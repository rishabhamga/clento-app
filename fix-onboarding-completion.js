const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOnboardingCompletion() {
  try {
    console.log('🔍 Finding users with completed analysis but incomplete onboarding...\n');
    
    // Find users who have completed website analysis but haven't marked onboarding as complete
    const { data: usersToFix, error: queryError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        clerk_id,
        website_url,
        website_analysis!inner(
          id,
          website_url,
          status,
          core_offer,
          industry,
          business_model,
          icp_summary,
          target_personas,
          case_studies,
          lead_magnets,
          competitive_advantages,
          tech_stack,
          social_proof,
          confidence_score,
          completed_at
        ),
        user_profile(
          completed,
          icp
        )
      `)
      .eq('website_analysis.status', 'completed')
      .or('user_profile.completed.is.null,user_profile.completed.eq.false');

    if (queryError) {
      console.error('Error querying users:', queryError);
      return;
    }

    if (!usersToFix || usersToFix.length === 0) {
      console.log('✅ No users found who need onboarding completion fix!');
      return;
    }

    console.log(`📋 Found ${usersToFix.length} users who need onboarding completion fix:\n`);
    
    for (const user of usersToFix) {
      console.log(`👤 ${user.email} (${user.clerk_id})`);
      console.log(`   Website: ${user.website_analysis[0]?.website_url}`);
      console.log(`   Analysis: ${user.website_analysis[0]?.core_offer}`);
      console.log(`   Current completed status: ${user.user_profile?.[0]?.completed || 'null'}\n`);
    }

    // Ask for confirmation
    console.log('🚀 Ready to fix these users...');
    console.log('This will:');
    console.log('1. Create/update user profiles with completed=true');
    console.log('2. Copy website analysis data to user profile ICP field');
    console.log('3. Set website_url and site_summary from analysis\n');

    // For automated execution, you can comment out this check
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const shouldProceed = await new Promise((resolve) => {
      rl.question('Do you want to proceed? (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (!shouldProceed) {
      console.log('❌ Operation cancelled.');
      return;
    }

    // Fix each user
    let fixedCount = 0;
    for (const user of usersToFix) {
      try {
        const analysis = user.website_analysis[0];
        
        // Prepare ICP data from analysis
        const icpData = {
          core_offer: analysis.core_offer,
          industry: analysis.industry,
          business_model: analysis.business_model,
          icp_summary: analysis.icp_summary,
          target_personas: analysis.target_personas || [],
          case_studies: analysis.case_studies || [],
          lead_magnets: analysis.lead_magnets || [],
          competitive_advantages: analysis.competitive_advantages || [],
          tech_stack: analysis.tech_stack || [],
          social_proof: analysis.social_proof || {},
          confidence_score: analysis.confidence_score
        };

        // Upsert user profile
        const { error: upsertError } = await supabase
          .from('user_profile')
          .upsert({
            user_id: user.id,
            website_url: analysis.website_url,
            site_summary: analysis.core_offer,
            icp: icpData,
            completed: true,
            updated_at: new Date().toISOString()
          });

        if (upsertError) {
          console.error(`❌ Error fixing user ${user.email}:`, upsertError);
        } else {
          console.log(`✅ Fixed onboarding for ${user.email}`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }

    console.log(`\n🎉 Operation completed!`);
    console.log(`✅ Successfully fixed ${fixedCount} out of ${usersToFix.length} users`);
    
    if (fixedCount > 0) {
      console.log('\n📊 These users should now be able to access the dashboard without redirect loops.');
    }

  } catch (error) {
    console.error('❌ Error in fix operation:', error);
    process.exit(1);
  }
}

// For automated execution without confirmation, set this to true
const AUTO_FIX = process.argv.includes('--auto-fix');

if (AUTO_FIX) {
  // Override the confirmation for automated execution
  fixOnboardingCompletion();
} else {
  fixOnboardingCompletion();
} 