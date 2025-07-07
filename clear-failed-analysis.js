const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearFailedAnalyses() {
  try {
    console.log('Clearing failed and incomplete website analyses...');
    
    // Delete failed analyses
    const { data: failedDeleted, error: failedError } = await supabase
      .from('website_analysis')
      .delete()
      .eq('status', 'failed');
    
    if (failedError) {
      console.error('Error deleting failed analyses:', failedError);
    } else {
      console.log(`Deleted ${failedDeleted?.length || 0} failed analyses`);
    }
    
    // Delete analyzing (stuck) analyses older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: stuckDeleted, error: stuckError } = await supabase
      .from('website_analysis')
      .delete()
      .eq('status', 'analyzing')
      .lt('started_at', oneHourAgo);
    
    if (stuckError) {
      console.error('Error deleting stuck analyses:', stuckError);
    } else {
      console.log(`Deleted ${stuckDeleted?.length || 0} stuck analyses`);
    }
    
    // List remaining analyses
    const { data: remaining, error: listError } = await supabase
      .from('website_analysis')
      .select('id, website_url, status, started_at, completed_at')
      .order('created_at', { ascending: false });
    
    if (listError) {
      console.error('Error listing remaining analyses:', listError);
    } else {
      console.log(`\nRemaining analyses: ${remaining?.length || 0}`);
      if (remaining && remaining.length > 0) {
        remaining.forEach((analysis, index) => {
          console.log(`${index + 1}. ${analysis.website_url} - ${analysis.status} (${analysis.started_at})`);
        });
      }
    }
    
    console.log('\nClear operation completed!');
    
  } catch (error) {
    console.error('Error in clear operation:', error);
    process.exit(1);
  }
}

clearFailedAnalyses(); 