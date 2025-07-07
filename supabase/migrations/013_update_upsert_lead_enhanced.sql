-- Update upsert_lead_enhanced function to support organization_id
-- This ensures leads are properly associated with organizations for RLS policies

CREATE OR REPLACE FUNCTION upsert_lead_enhanced(
  p_external_id VARCHAR(255),
  p_first_name VARCHAR(255) DEFAULT NULL,
  p_last_name VARCHAR(255) DEFAULT NULL,
  p_full_name VARCHAR(255) DEFAULT NULL,
  p_email VARCHAR(255) DEFAULT NULL,
  p_phone VARCHAR(50) DEFAULT NULL,
  p_headline TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_title VARCHAR(255) DEFAULT NULL,
  p_company VARCHAR(255) DEFAULT NULL,
  p_industry VARCHAR(255) DEFAULT NULL,
  p_location VARCHAR(255) DEFAULT NULL,
  p_city VARCHAR(255) DEFAULT NULL,
  p_state VARCHAR(255) DEFAULT NULL,
  p_country VARCHAR(255) DEFAULT NULL,
  p_linkedin_url TEXT DEFAULT NULL,
  p_twitter_url TEXT DEFAULT NULL,
  p_facebook_url TEXT DEFAULT NULL,
  p_github_url TEXT DEFAULT NULL,
  p_employee_count INTEGER DEFAULT NULL,
  p_revenue BIGINT DEFAULT NULL,
  p_company_id VARCHAR(255) DEFAULT NULL,
  p_company_website VARCHAR(255) DEFAULT NULL,
  p_company_linkedin VARCHAR(255) DEFAULT NULL,
  p_company_founded_year INTEGER DEFAULT NULL,
  p_company_logo_url TEXT DEFAULT NULL,
  p_company_phone VARCHAR(50) DEFAULT NULL,
  p_company_alexa_ranking INTEGER DEFAULT NULL,
  p_company_primary_domain VARCHAR(255) DEFAULT NULL,
  p_company_headcount_six_month_growth DECIMAL(5,4) DEFAULT NULL,
  p_company_headcount_twelve_month_growth DECIMAL(5,4) DEFAULT NULL,
  p_company_headcount_twenty_four_month_growth DECIMAL(5,4) DEFAULT NULL,
  p_departments JSONB DEFAULT '[]'::jsonb,
  p_subdepartments JSONB DEFAULT '[]'::jsonb,
  p_seniority VARCHAR(255) DEFAULT NULL,
  p_functions JSONB DEFAULT '[]'::jsonb,
  p_years_experience INTEGER DEFAULT NULL,
  p_time_in_current_role VARCHAR(255) DEFAULT NULL,
  p_employment_history JSONB DEFAULT '[]'::jsonb,
  p_email_status VARCHAR(50) DEFAULT NULL,
  p_source VARCHAR(50) DEFAULT 'apollo',
  p_verified BOOLEAN DEFAULT FALSE,
  p_confidence DECIMAL(3,2) DEFAULT 1.0,
  p_technologies JSONB DEFAULT '[]'::jsonb,
  p_keywords JSONB DEFAULT '[]'::jsonb,
  p_organization_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  lead_id UUID;
  current_user_id UUID;
  current_org_id UUID;
BEGIN
  -- Get the current user's ID from the users table
  SELECT id INTO current_user_id 
  FROM users 
  WHERE clerk_id = auth.jwt() ->> 'sub';
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not authenticated';
  END IF;

  -- Determine organization ID (use provided or get from user's profile)
  IF p_organization_id IS NOT NULL THEN
    current_org_id := p_organization_id;
  ELSE
    SELECT organization_id INTO current_org_id
    FROM user_profile
    WHERE user_id = current_user_id;
  END IF;

  INSERT INTO leads (
    user_id, organization_id, external_id, first_name, last_name, full_name, email, phone, headline, photo_url,
    title, company, industry, location, city, state, country,
    linkedin_url, twitter_url, facebook_url, github_url,
    employee_count, revenue, company_id, company_website, company_linkedin,
    company_founded_year, company_logo_url, company_phone, company_alexa_ranking,
    company_primary_domain, company_headcount_six_month_growth,
    company_headcount_twelve_month_growth, company_headcount_twenty_four_month_growth,
    departments, subdepartments, seniority, functions, years_experience,
    time_in_current_role, employment_history, email_status, source,
    verified, confidence, technologies, keywords, last_enriched_at
  ) VALUES (
    current_user_id, current_org_id, p_external_id, p_first_name, p_last_name, p_full_name, p_email, p_phone, p_headline, p_photo_url,
    p_title, p_company, p_industry, p_location, p_city, p_state, p_country,
    p_linkedin_url, p_twitter_url, p_facebook_url, p_github_url,
    p_employee_count, p_revenue, p_company_id, p_company_website, p_company_linkedin,
    p_company_founded_year, p_company_logo_url, p_company_phone, p_company_alexa_ranking,
    p_company_primary_domain, p_company_headcount_six_month_growth,
    p_company_headcount_twelve_month_growth, p_company_headcount_twenty_four_month_growth,
    p_departments, p_subdepartments, p_seniority, p_functions, p_years_experience,
    p_time_in_current_role, p_employment_history, p_email_status, p_source,
    p_verified, p_confidence, p_technologies, p_keywords, NOW()
  )
  ON CONFLICT (external_id) DO UPDATE SET
    first_name = COALESCE(p_first_name, leads.first_name),
    last_name = COALESCE(p_last_name, leads.last_name),
    full_name = COALESCE(p_full_name, leads.full_name),
    email = COALESCE(p_email, leads.email),
    phone = COALESCE(p_phone, leads.phone),
    headline = COALESCE(p_headline, leads.headline),
    photo_url = COALESCE(p_photo_url, leads.photo_url),
    title = COALESCE(p_title, leads.title),
    company = COALESCE(p_company, leads.company),
    industry = COALESCE(p_industry, leads.industry),
    location = COALESCE(p_location, leads.location),
    city = COALESCE(p_city, leads.city),
    state = COALESCE(p_state, leads.state),
    country = COALESCE(p_country, leads.country),
    linkedin_url = COALESCE(p_linkedin_url, leads.linkedin_url),
    twitter_url = COALESCE(p_twitter_url, leads.twitter_url),
    facebook_url = COALESCE(p_facebook_url, leads.facebook_url),
    github_url = COALESCE(p_github_url, leads.github_url),
    employee_count = COALESCE(p_employee_count, leads.employee_count),
    revenue = COALESCE(p_revenue, leads.revenue),
    company_id = COALESCE(p_company_id, leads.company_id),
    company_website = COALESCE(p_company_website, leads.company_website),
    company_linkedin = COALESCE(p_company_linkedin, leads.company_linkedin),
    company_founded_year = COALESCE(p_company_founded_year, leads.company_founded_year),
    company_logo_url = COALESCE(p_company_logo_url, leads.company_logo_url),
    company_phone = COALESCE(p_company_phone, leads.company_phone),
    company_alexa_ranking = COALESCE(p_company_alexa_ranking, leads.company_alexa_ranking),
    company_primary_domain = COALESCE(p_company_primary_domain, leads.company_primary_domain),
    company_headcount_six_month_growth = COALESCE(p_company_headcount_six_month_growth, leads.company_headcount_six_month_growth),
    company_headcount_twelve_month_growth = COALESCE(p_company_headcount_twelve_month_growth, leads.company_headcount_twelve_month_growth),
    company_headcount_twenty_four_month_growth = COALESCE(p_company_headcount_twenty_four_month_growth, leads.company_headcount_twenty_four_month_growth),
    departments = COALESCE(p_departments, leads.departments),
    subdepartments = COALESCE(p_subdepartments, leads.subdepartments),
    seniority = COALESCE(p_seniority, leads.seniority),
    functions = COALESCE(p_functions, leads.functions),
    years_experience = COALESCE(p_years_experience, leads.years_experience),
    time_in_current_role = COALESCE(p_time_in_current_role, leads.time_in_current_role),
    employment_history = COALESCE(p_employment_history, leads.employment_history),
    email_status = COALESCE(p_email_status, leads.email_status),
    confidence = COALESCE(p_confidence, leads.confidence),
    technologies = COALESCE(p_technologies, leads.technologies),
    keywords = COALESCE(p_keywords, leads.keywords),
    organization_id = COALESCE(current_org_id, leads.organization_id),
    updated_at = NOW(),
    last_enriched_at = NOW(),
    search_count = leads.search_count + 1,
    last_searched_at = NOW()
  RETURNING id INTO lead_id;
  
  RETURN lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 