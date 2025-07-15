// Explorium filter types and constants

// Company filter types
export interface CompanyFilters {
  // Location filters
  country_code?: string[]
  region_country_code?: string[]
  city_region_country?: string[]

  // Company size and financials
  company_size?: string[]
  annual_revenue?: string[]

  // Industry classification
  google_category?: string[]
  // Technology filters (Apollo UID format)
  currently_using_any_of_technology_uids?: string[]
  currently_not_using_any_of_technology_uids?: string[]

  // Organization job filters
  organization_job_titles?: string[]
  organization_job_locations?: string[]
  organization_num_jobs_range_min?: number
  organization_num_jobs_range_max?: number
  organization_job_posted_at_range_min?: string
  organization_job_posted_at_range_max?: string
}

// Prospect filter types
export interface ProspectFilters {
  // Job information
  job_title?: string[]
  job_level?: string[]
  job_department?: string[]

  // Location information
  person_locations?: string[]

  // Experience and tenure
  total_experience_months?: { gte?: number; lte?: number }
  current_role_months?: { gte?: number; lte?: number }

  // Contact availability
  has_email?: boolean
  has_phone?: boolean

  // Company filters (prefixed with company_ for prospect search)
  company_country_code?: string[]
  company_region_country_code?: string[]
  company_city_region_country?: string[]
  company_size?: string[]
  company_annual_revenue?: string[]
  // Technology filters for company (prefixed for prospect search)
  company_currently_using_any_of_technology_uids?: string[]
  company_currently_not_using_any_of_technology_uids?: string[]
  company_google_category?: string[]
  // Organization job filters for company (prefixed for prospect search)
  company_organization_job_titles?: string[]
  company_organization_job_locations?: string[]
  company_organization_num_jobs_range_min?: number
  company_organization_num_jobs_range_max?: number
  company_organization_job_posted_at_range_min?: string
  company_organization_job_posted_at_range_max?: string
}

// Combined filter interface for ICP profiles
export interface ExplorimFilters extends ProspectFilters, CompanyFilters {}

// Filter option types
export interface FilterOption {
  value: string
  label: string
}

// Company size options based on Explorium documentation
export const COMPANY_SIZE_OPTIONS: FilterOption[] = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1,000 employees' },
  { value: '1001-5000', label: '1,001-5,000 employees' },
  { value: '5001-10000', label: '5,001-10,000 employees' },
  { value: '10001+', label: '10,001+ employees' }
]

// Annual revenue options
export const ANNUAL_REVENUE_OPTIONS: FilterOption[] = [
  { value: '0-500K', label: '$0-$500K' },
  { value: '500K-1M', label: '$500K-$1M' },
  { value: '1M-5M', label: '$1M-$5M' },
  { value: '5M-10M', label: '$5M-$10M' },
  { value: '10M-25M', label: '$10M-$25M' },
  { value: '25M-50M', label: '$25M-$50M' },
  { value: '50M-100M', label: '$50M-$100M' },
  { value: '100M-500M', label: '$100M-$500M' },
  { value: '500M-1B', label: '$500M-$1B' },
  { value: '1B-10B', label: '$1B-$10B' },
  { value: '10B-100B', label: '$10B-$100B' }
]



// Job level options - Updated to match Apollo API person_seniorities parameter
export const JOB_LEVEL_OPTIONS: FilterOption[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'founder', label: 'Founder' },
  { value: 'c_suite', label: 'C-Suite (CEO, CTO, CFO, etc.)' },
  { value: 'partner', label: 'Partner' },
  { value: 'vp', label: 'Vice President' },
  { value: 'head', label: 'Head of Department' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'intern', label: 'Intern' }
]

// Job department options
export const JOB_DEPARTMENT_OPTIONS: FilterOption[] = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'human_resources', label: 'Human Resources' },
  { value: 'operations', label: 'Operations' },
  { value: 'customer_success', label: 'Customer Success' },
  { value: 'product', label: 'Product' },
  { value: 'legal', label: 'Legal' },
  { value: 'consulting', label: 'Consulting' }
]







// Comprehensive Countries (ISO-2 codes) - 240+ countries supported by Explorium
export const ALL_COUNTRIES: FilterOption[] = [
  // North America
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'gt', label: 'Guatemala' },
  { value: 'cr', label: 'Costa Rica' },
  { value: 'pa', label: 'Panama' },
  { value: 'hn', label: 'Honduras' },
  { value: 'ni', label: 'Nicaragua' },
  { value: 'sv', label: 'El Salvador' },
  { value: 'bz', label: 'Belize' },
  
  // South America
  { value: 'br', label: 'Brazil' },
  { value: 'ar', label: 'Argentina' },
  { value: 'cl', label: 'Chile' },
  { value: 'co', label: 'Colombia' },
  { value: 'pe', label: 'Peru' },
  { value: 've', label: 'Venezuela' },
  { value: 'ec', label: 'Ecuador' },
  { value: 'uy', label: 'Uruguay' },
  { value: 'py', label: 'Paraguay' },
  { value: 'bo', label: 'Bolivia' },
  { value: 'gy', label: 'Guyana' },
  { value: 'sr', label: 'Suriname' },
  
  // Europe
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'it', label: 'Italy' },
  { value: 'es', label: 'Spain' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'be', label: 'Belgium' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'at', label: 'Austria' },
  { value: 'se', label: 'Sweden' },
  { value: 'no', label: 'Norway' },
  { value: 'dk', label: 'Denmark' },
  { value: 'fi', label: 'Finland' },
  { value: 'ie', label: 'Ireland' },
  { value: 'pt', label: 'Portugal' },
  { value: 'pl', label: 'Poland' },
  { value: 'cz', label: 'Czech Republic' },
  { value: 'hu', label: 'Hungary' },
  { value: 'sk', label: 'Slovakia' },
  { value: 'si', label: 'Slovenia' },
  { value: 'hr', label: 'Croatia' },
  { value: 'rs', label: 'Serbia' },
  { value: 'ba', label: 'Bosnia and Herzegovina' },
  { value: 'me', label: 'Montenegro' },
  { value: 'mk', label: 'North Macedonia' },
  { value: 'al', label: 'Albania' },
  { value: 'bg', label: 'Bulgaria' },
  { value: 'ro', label: 'Romania' },
  { value: 'gr', label: 'Greece' },
  { value: 'cy', label: 'Cyprus' },
  { value: 'mt', label: 'Malta' },
  { value: 'ee', label: 'Estonia' },
  { value: 'lv', label: 'Latvia' },
  { value: 'lt', label: 'Lithuania' },
  { value: 'lu', label: 'Luxembourg' },
  { value: 'is', label: 'Iceland' },
  { value: 'ua', label: 'Ukraine' },
  { value: 'by', label: 'Belarus' },
  { value: 'md', label: 'Moldova' },
  { value: 'ru', label: 'Russia' },
  
  // Asia-Pacific
  { value: 'in', label: 'India' },
  { value: 'cn', label: 'China' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'South Korea' },
  { value: 'au', label: 'Australia' },
  { value: 'nz', label: 'New Zealand' },
  { value: 'sg', label: 'Singapore' },
  { value: 'my', label: 'Malaysia' },
  { value: 'th', label: 'Thailand' },
  { value: 'vn', label: 'Vietnam' },
  { value: 'ph', label: 'Philippines' },
  { value: 'id', label: 'Indonesia' },
  { value: 'tw', label: 'Taiwan' },
  { value: 'hk', label: 'Hong Kong' },
  { value: 'mo', label: 'Macau' },
  { value: 'pk', label: 'Pakistan' },
  { value: 'bd', label: 'Bangladesh' },
  { value: 'lk', label: 'Sri Lanka' },
  { value: 'np', label: 'Nepal' },
  { value: 'mm', label: 'Myanmar' },
  { value: 'kh', label: 'Cambodia' },
  { value: 'la', label: 'Laos' },
  { value: 'bn', label: 'Brunei' },
  { value: 'mn', label: 'Mongolia' },
  { value: 'kz', label: 'Kazakhstan' },
  { value: 'uz', label: 'Uzbekistan' },
  { value: 'kg', label: 'Kyrgyzstan' },
  { value: 'tj', label: 'Tajikistan' },
  { value: 'tm', label: 'Turkmenistan' },
  
  // Middle East
  { value: 'ae', label: 'United Arab Emirates' },
  { value: 'sa', label: 'Saudi Arabia' },
  { value: 'il', label: 'Israel' },
  { value: 'tr', label: 'Turkey' },
  { value: 'eg', label: 'Egypt' },
  { value: 'qa', label: 'Qatar' },
  { value: 'kw', label: 'Kuwait' },
  { value: 'bh', label: 'Bahrain' },
  { value: 'om', label: 'Oman' },
  { value: 'jo', label: 'Jordan' },
  { value: 'lb', label: 'Lebanon' },
  { value: 'iq', label: 'Iraq' },
  { value: 'ir', label: 'Iran' },
  { value: 'af', label: 'Afghanistan' },
  { value: 'sy', label: 'Syria' },
  { value: 'ye', label: 'Yemen' },
  
  // Africa
  { value: 'za', label: 'South Africa' },
  { value: 'ng', label: 'Nigeria' },
  { value: 'ke', label: 'Kenya' },
  { value: 'gh', label: 'Ghana' },
  { value: 'et', label: 'Ethiopia' },
  { value: 'ug', label: 'Uganda' },
  { value: 'tz', label: 'Tanzania' },
  { value: 'rw', label: 'Rwanda' },
  { value: 'ma', label: 'Morocco' },
  { value: 'dz', label: 'Algeria' },
  { value: 'tn', label: 'Tunisia' },
  { value: 'ly', label: 'Libya' },
  { value: 'sd', label: 'Sudan' },
  { value: 'ci', label: 'Côte d\'Ivoire' },
  { value: 'sn', label: 'Senegal' },
  { value: 'ml', label: 'Mali' },
  { value: 'bf', label: 'Burkina Faso' },
  { value: 'ne', label: 'Niger' },
  { value: 'td', label: 'Chad' },
  { value: 'cm', label: 'Cameroon' },
  { value: 'ga', label: 'Gabon' },
  { value: 'cg', label: 'Republic of the Congo' },
  { value: 'cd', label: 'Democratic Republic of the Congo' },
  { value: 'ao', label: 'Angola' },
  { value: 'zm', label: 'Zambia' },
  { value: 'zw', label: 'Zimbabwe' },
  { value: 'bw', label: 'Botswana' },
  { value: 'mw', label: 'Malawi' },
  { value: 'mz', label: 'Mozambique' },
  { value: 'mg', label: 'Madagascar' },
  { value: 'mu', label: 'Mauritius' },
  { value: 'sc', label: 'Seychelles' }
]

// Major cities by country (formatted as "City, State/Region, Country" as required by Explorium)
export const CITIES_BY_COUNTRY: Record<string, FilterOption[]> = {
  // United States
  'us': [
    { value: 'New York, NY, US', label: 'New York, NY' },
    { value: 'Los Angeles, CA, US', label: 'Los Angeles, CA' },
    { value: 'Chicago, IL, US', label: 'Chicago, IL' },
    { value: 'Houston, TX, US', label: 'Houston, TX' },
    { value: 'Phoenix, AZ, US', label: 'Phoenix, AZ' },
    { value: 'Philadelphia, PA, US', label: 'Philadelphia, PA' },
    { value: 'San Antonio, TX, US', label: 'San Antonio, TX' },
    { value: 'San Diego, CA, US', label: 'San Diego, CA' },
    { value: 'Dallas, TX, US', label: 'Dallas, TX' },
    { value: 'San Jose, CA, US', label: 'San Jose, CA' },
    { value: 'Austin, TX, US', label: 'Austin, TX' },
    { value: 'Jacksonville, FL, US', label: 'Jacksonville, FL' },
    { value: 'Fort Worth, TX, US', label: 'Fort Worth, TX' },
    { value: 'Columbus, OH, US', label: 'Columbus, OH' },
    { value: 'San Francisco, CA, US', label: 'San Francisco, CA' },
    { value: 'Charlotte, NC, US', label: 'Charlotte, NC' },
    { value: 'Indianapolis, IN, US', label: 'Indianapolis, IN' },
    { value: 'Seattle, WA, US', label: 'Seattle, WA' },
    { value: 'Denver, CO, US', label: 'Denver, CO' },
    { value: 'Boston, MA, US', label: 'Boston, MA' },
    { value: 'El Paso, TX, US', label: 'El Paso, TX' },
    { value: 'Detroit, MI, US', label: 'Detroit, MI' },
    { value: 'Nashville, TN, US', label: 'Nashville, TN' },
    { value: 'Portland, OR, US', label: 'Portland, OR' },
    { value: 'Memphis, TN, US', label: 'Memphis, TN' },
    { value: 'Oklahoma City, OK, US', label: 'Oklahoma City, OK' },
    { value: 'Las Vegas, NV, US', label: 'Las Vegas, NV' },
    { value: 'Louisville, KY, US', label: 'Louisville, KY' },
    { value: 'Baltimore, MD, US', label: 'Baltimore, MD' },
    { value: 'Milwaukee, WI, US', label: 'Milwaukee, WI' },
    { value: 'Albuquerque, NM, US', label: 'Albuquerque, NM' },
    { value: 'Tucson, AZ, US', label: 'Tucson, AZ' },
    { value: 'Fresno, CA, US', label: 'Fresno, CA' },
    { value: 'Sacramento, CA, US', label: 'Sacramento, CA' },
    { value: 'Long Beach, CA, US', label: 'Long Beach, CA' },
    { value: 'Kansas City, MO, US', label: 'Kansas City, MO' },
    { value: 'Mesa, AZ, US', label: 'Mesa, AZ' },
    { value: 'Virginia Beach, VA, US', label: 'Virginia Beach, VA' },
    { value: 'Atlanta, GA, US', label: 'Atlanta, GA' },
    { value: 'Colorado Springs, CO, US', label: 'Colorado Springs, CO' },
    { value: 'Omaha, NE, US', label: 'Omaha, NE' },
    { value: 'Raleigh, NC, US', label: 'Raleigh, NC' },
    { value: 'Miami, FL, US', label: 'Miami, FL' },
    { value: 'Oakland, CA, US', label: 'Oakland, CA' },
    { value: 'Minneapolis, MN, US', label: 'Minneapolis, MN' },
    { value: 'Tulsa, OK, US', label: 'Tulsa, OK' },
    { value: 'Cleveland, OH, US', label: 'Cleveland, OH' },
    { value: 'Wichita, KS, US', label: 'Wichita, KS' },
    { value: 'Arlington, TX, US', label: 'Arlington, TX' }
  ],

  // Canada
  'ca': [
    { value: 'Toronto, ON, CA', label: 'Toronto, Ontario' },
    { value: 'Montreal, QC, CA', label: 'Montreal, Quebec' },
    { value: 'Vancouver, BC, CA', label: 'Vancouver, British Columbia' },
    { value: 'Calgary, AB, CA', label: 'Calgary, Alberta' },
    { value: 'Edmonton, AB, CA', label: 'Edmonton, Alberta' },
    { value: 'Ottawa, ON, CA', label: 'Ottawa, Ontario' },
    { value: 'Winnipeg, MB, CA', label: 'Winnipeg, Manitoba' },
    { value: 'Quebec City, QC, CA', label: 'Quebec City, Quebec' },
    { value: 'Hamilton, ON, CA', label: 'Hamilton, Ontario' },
    { value: 'Kitchener, ON, CA', label: 'Kitchener, Ontario' },
    { value: 'London, ON, CA', label: 'London, Ontario' },
    { value: 'Victoria, BC, CA', label: 'Victoria, British Columbia' },
    { value: 'Halifax, NS, CA', label: 'Halifax, Nova Scotia' },
    { value: 'Oshawa, ON, CA', label: 'Oshawa, Ontario' },
    { value: 'Windsor, ON, CA', label: 'Windsor, Ontario' }
  ],

  // United Kingdom
  'gb': [
    { value: 'London, England, GB', label: 'London' },
    { value: 'Birmingham, England, GB', label: 'Birmingham' },
    { value: 'Leeds, England, GB', label: 'Leeds' },
    { value: 'Glasgow, Scotland, GB', label: 'Glasgow' },
    { value: 'Sheffield, England, GB', label: 'Sheffield' },
    { value: 'Bradford, England, GB', label: 'Bradford' },
    { value: 'Edinburgh, Scotland, GB', label: 'Edinburgh' },
    { value: 'Liverpool, England, GB', label: 'Liverpool' },
    { value: 'Manchester, England, GB', label: 'Manchester' },
    { value: 'Bristol, England, GB', label: 'Bristol' },
    { value: 'Cardiff, Wales, GB', label: 'Cardiff' },
    { value: 'Leicester, England, GB', label: 'Leicester' },
    { value: 'Coventry, England, GB', label: 'Coventry' },
    { value: 'Hull, England, GB', label: 'Hull' },
    { value: 'Belfast, Northern Ireland, GB', label: 'Belfast' }
  ],

  // Germany
  'de': [
    { value: 'Berlin, Berlin, DE', label: 'Berlin' },
    { value: 'Hamburg, Hamburg, DE', label: 'Hamburg' },
    { value: 'Munich, Bavaria, DE', label: 'Munich' },
    { value: 'Cologne, North Rhine-Westphalia, DE', label: 'Cologne' },
    { value: 'Frankfurt, Hesse, DE', label: 'Frankfurt' },
    { value: 'Stuttgart, Baden-Württemberg, DE', label: 'Stuttgart' },
    { value: 'Düsseldorf, North Rhine-Westphalia, DE', label: 'Düsseldorf' },
    { value: 'Dortmund, North Rhine-Westphalia, DE', label: 'Dortmund' },
    { value: 'Essen, North Rhine-Westphalia, DE', label: 'Essen' },
    { value: 'Leipzig, Saxony, DE', label: 'Leipzig' },
    { value: 'Bremen, Bremen, DE', label: 'Bremen' },
    { value: 'Dresden, Saxony, DE', label: 'Dresden' },
    { value: 'Hanover, Lower Saxony, DE', label: 'Hanover' },
    { value: 'Nuremberg, Bavaria, DE', label: 'Nuremberg' },
    { value: 'Duisburg, North Rhine-Westphalia, DE', label: 'Duisburg' }
  ],

  // France
  'fr': [
    { value: 'Paris, Île-de-France, FR', label: 'Paris' },
    { value: 'Marseille, Provence-Alpes-Côte d\'Azur, FR', label: 'Marseille' },
    { value: 'Lyon, Auvergne-Rhône-Alpes, FR', label: 'Lyon' },
    { value: 'Toulouse, Occitanie, FR', label: 'Toulouse' },
    { value: 'Nice, Provence-Alpes-Côte d\'Azur, FR', label: 'Nice' },
    { value: 'Nantes, Pays de la Loire, FR', label: 'Nantes' },
    { value: 'Strasbourg, Grand Est, FR', label: 'Strasbourg' },
    { value: 'Montpellier, Occitanie, FR', label: 'Montpellier' },
    { value: 'Bordeaux, Nouvelle-Aquitaine, FR', label: 'Bordeaux' },
    { value: 'Lille, Hauts-de-France, FR', label: 'Lille' },
    { value: 'Rennes, Brittany, FR', label: 'Rennes' },
    { value: 'Reims, Grand Est, FR', label: 'Reims' },
    { value: 'Le Havre, Normandy, FR', label: 'Le Havre' },
    { value: 'Saint-Étienne, Auvergne-Rhône-Alpes, FR', label: 'Saint-Étienne' },
    { value: 'Toulon, Provence-Alpes-Côte d\'Azur, FR', label: 'Toulon' }
  ],

  // India
  'in': [
    { value: 'Mumbai, Maharashtra, IN', label: 'Mumbai' },
    { value: 'Delhi, Delhi, IN', label: 'Delhi' },
    { value: 'Bangalore, Karnataka, IN', label: 'Bangalore' },
    { value: 'Hyderabad, Telangana, IN', label: 'Hyderabad' },
    { value: 'Ahmedabad, Gujarat, IN', label: 'Ahmedabad' },
    { value: 'Chennai, Tamil Nadu, IN', label: 'Chennai' },
    { value: 'Kolkata, West Bengal, IN', label: 'Kolkata' },
    { value: 'Surat, Gujarat, IN', label: 'Surat' },
    { value: 'Pune, Maharashtra, IN', label: 'Pune' },
    { value: 'Jaipur, Rajasthan, IN', label: 'Jaipur' },
    { value: 'Lucknow, Uttar Pradesh, IN', label: 'Lucknow' },
    { value: 'Kanpur, Uttar Pradesh, IN', label: 'Kanpur' },
    { value: 'Nagpur, Maharashtra, IN', label: 'Nagpur' },
    { value: 'Indore, Madhya Pradesh, IN', label: 'Indore' },
    { value: 'Thane, Maharashtra, IN', label: 'Thane' },
    { value: 'Bhopal, Madhya Pradesh, IN', label: 'Bhopal' },
    { value: 'Visakhapatnam, Andhra Pradesh, IN', label: 'Visakhapatnam' },
    { value: 'Pimpri-Chinchwad, Maharashtra, IN', label: 'Pimpri-Chinchwad' },
    { value: 'Patna, Bihar, IN', label: 'Patna' },
    { value: 'Vadodara, Gujarat, IN', label: 'Vadodara' },
    { value: 'Ghaziabad, Uttar Pradesh, IN', label: 'Ghaziabad' },
    { value: 'Ludhiana, Punjab, IN', label: 'Ludhiana' },
    { value: 'Agra, Uttar Pradesh, IN', label: 'Agra' },
    { value: 'Nashik, Maharashtra, IN', label: 'Nashik' },
    { value: 'Faridabad, Haryana, IN', label: 'Faridabad' },
    { value: 'Meerut, Uttar Pradesh, IN', label: 'Meerut' },
    { value: 'Rajkot, Gujarat, IN', label: 'Rajkot' },
    { value: 'Kalyan-Dombivali, Maharashtra, IN', label: 'Kalyan-Dombivali' },
    { value: 'Vasai-Virar, Maharashtra, IN', label: 'Vasai-Virar' },
    { value: 'Varanasi, Uttar Pradesh, IN', label: 'Varanasi' },
    { value: 'Srinagar, Jammu and Kashmir, IN', label: 'Srinagar' },
    { value: 'Aurangabad, Maharashtra, IN', label: 'Aurangabad' },
    { value: 'Dhanbad, Jharkhand, IN', label: 'Dhanbad' },
    { value: 'Amritsar, Punjab, IN', label: 'Amritsar' },
    { value: 'Navi Mumbai, Maharashtra, IN', label: 'Navi Mumbai' },
    { value: 'Allahabad, Uttar Pradesh, IN', label: 'Allahabad' },
    { value: 'Ranchi, Jharkhand, IN', label: 'Ranchi' },
    { value: 'Howrah, West Bengal, IN', label: 'Howrah' },
    { value: 'Coimbatore, Tamil Nadu, IN', label: 'Coimbatore' },
    { value: 'Jabalpur, Madhya Pradesh, IN', label: 'Jabalpur' },
    { value: 'Gwalior, Madhya Pradesh, IN', label: 'Gwalior' },
    { value: 'Vijayawada, Andhra Pradesh, IN', label: 'Vijayawada' },
    { value: 'Jodhpur, Rajasthan, IN', label: 'Jodhpur' },
    { value: 'Madurai, Tamil Nadu, IN', label: 'Madurai' },
    { value: 'Raipur, Chhattisgarh, IN', label: 'Raipur' },
    { value: 'Kota, Rajasthan, IN', label: 'Kota' },
    { value: 'Guwahati, Assam, IN', label: 'Guwahati' },
    { value: 'Chandigarh, Chandigarh, IN', label: 'Chandigarh' },
    { value: 'Solapur, Maharashtra, IN', label: 'Solapur' },
    { value: 'Hubli-Dharwad, Karnataka, IN', label: 'Hubli-Dharwad' },
    { value: 'Tiruchirappalli, Tamil Nadu, IN', label: 'Tiruchirappalli' },
    { value: 'Bareilly, Uttar Pradesh, IN', label: 'Bareilly' }
  ],

  // Australia
  'au': [
    { value: 'Sydney, NSW, AU', label: 'Sydney' },
    { value: 'Melbourne, VIC, AU', label: 'Melbourne' },
    { value: 'Brisbane, QLD, AU', label: 'Brisbane' },
    { value: 'Perth, WA, AU', label: 'Perth' },
    { value: 'Adelaide, SA, AU', label: 'Adelaide' },
    { value: 'Gold Coast, QLD, AU', label: 'Gold Coast' },
    { value: 'Newcastle, NSW, AU', label: 'Newcastle' },
    { value: 'Canberra, ACT, AU', label: 'Canberra' },
    { value: 'Sunshine Coast, QLD, AU', label: 'Sunshine Coast' },
    { value: 'Wollongong, NSW, AU', label: 'Wollongong' },
    { value: 'Hobart, TAS, AU', label: 'Hobart' },
    { value: 'Geelong, VIC, AU', label: 'Geelong' },
    { value: 'Townsville, QLD, AU', label: 'Townsville' },
    { value: 'Cairns, QLD, AU', label: 'Cairns' },
    { value: 'Darwin, NT, AU', label: 'Darwin' }
  ],

  // Japan
  'jp': [
    { value: 'Tokyo, Tokyo, JP', label: 'Tokyo' },
    { value: 'Yokohama, Kanagawa, JP', label: 'Yokohama' },
    { value: 'Osaka, Osaka, JP', label: 'Osaka' },
    { value: 'Nagoya, Aichi, JP', label: 'Nagoya' },
    { value: 'Sapporo, Hokkaido, JP', label: 'Sapporo' },
    { value: 'Fukuoka, Fukuoka, JP', label: 'Fukuoka' },
    { value: 'Kobe, Hyogo, JP', label: 'Kobe' },
    { value: 'Kawasaki, Kanagawa, JP', label: 'Kawasaki' },
    { value: 'Kyoto, Kyoto, JP', label: 'Kyoto' },
    { value: 'Saitama, Saitama, JP', label: 'Saitama' },
    { value: 'Hiroshima, Hiroshima, JP', label: 'Hiroshima' },
    { value: 'Sendai, Miyagi, JP', label: 'Sendai' },
    { value: 'Kitakyushu, Fukuoka, JP', label: 'Kitakyushu' },
    { value: 'Chiba, Chiba, JP', label: 'Chiba' },
    { value: 'Sakai, Osaka, JP', label: 'Sakai' }
  ],

  // Singapore
  'sg': [
    { value: 'Singapore, Singapore, SG', label: 'Singapore' }
  ],

  // Netherlands
  'nl': [
    { value: 'Amsterdam, North Holland, NL', label: 'Amsterdam' },
    { value: 'Rotterdam, South Holland, NL', label: 'Rotterdam' },
    { value: 'The Hague, South Holland, NL', label: 'The Hague' },
    { value: 'Utrecht, Utrecht, NL', label: 'Utrecht' },
    { value: 'Eindhoven, North Brabant, NL', label: 'Eindhoven' },
    { value: 'Tilburg, North Brabant, NL', label: 'Tilburg' },
    { value: 'Groningen, Groningen, NL', label: 'Groningen' },
    { value: 'Almere, Flevoland, NL', label: 'Almere' },
    { value: 'Breda, North Brabant, NL', label: 'Breda' },
    { value: 'Nijmegen, Gelderland, NL', label: 'Nijmegen' }
  ],

  // Sweden
  'se': [
    { value: 'Stockholm, Stockholm County, SE', label: 'Stockholm' },
    { value: 'Gothenburg, Västra Götaland County, SE', label: 'Gothenburg' },
    { value: 'Malmö, Skåne County, SE', label: 'Malmö' },
    { value: 'Uppsala, Uppsala County, SE', label: 'Uppsala' },
    { value: 'Västerås, Västmanland County, SE', label: 'Västerås' },
    { value: 'Örebro, Örebro County, SE', label: 'Örebro' },
    { value: 'Linköping, Östergötland County, SE', label: 'Linköping' },
    { value: 'Helsingborg, Skåne County, SE', label: 'Helsingborg' },
    { value: 'Jönköping, Jönköping County, SE', label: 'Jönköping' },
    { value: 'Norrköping, Östergötland County, SE', label: 'Norrköping' }
  ],

  // Switzerland
  'ch': [
    { value: 'Zurich, Zurich, CH', label: 'Zurich' },
    { value: 'Geneva, Geneva, CH', label: 'Geneva' },
    { value: 'Basel, Basel-Stadt, CH', label: 'Basel' },
    { value: 'Bern, Bern, CH', label: 'Bern' },
    { value: 'Lausanne, Vaud, CH', label: 'Lausanne' },
    { value: 'Winterthur, Zurich, CH', label: 'Winterthur' },
    { value: 'Lucerne, Lucerne, CH', label: 'Lucerne' },
    { value: 'St. Gallen, St. Gallen, CH', label: 'St. Gallen' },
    { value: 'Lugano, Ticino, CH', label: 'Lugano' },
    { value: 'Biel/Bienne, Bern, CH', label: 'Biel/Bienne' }
  ],

  // Denmark
  'dk': [
    { value: 'Copenhagen, Capital Region, DK', label: 'Copenhagen' },
    { value: 'Aarhus, Central Denmark Region, DK', label: 'Aarhus' },
    { value: 'Odense, Southern Denmark, DK', label: 'Odense' },
    { value: 'Aalborg, North Denmark Region, DK', label: 'Aalborg' },
    { value: 'Esbjerg, Southern Denmark, DK', label: 'Esbjerg' },
    { value: 'Randers, Central Denmark Region, DK', label: 'Randers' },
    { value: 'Kolding, Southern Denmark, DK', label: 'Kolding' },
    { value: 'Horsens, Central Denmark Region, DK', label: 'Horsens' },
    { value: 'Vejle, Southern Denmark, DK', label: 'Vejle' },
    { value: 'Roskilde, Zealand, DK', label: 'Roskilde' }
  ],

  // Norway
  'no': [
    { value: 'Oslo, Oslo, NO', label: 'Oslo' },
    { value: 'Bergen, Vestland, NO', label: 'Bergen' },
    { value: 'Stavanger, Rogaland, NO', label: 'Stavanger' },
    { value: 'Trondheim, Trøndelag, NO', label: 'Trondheim' },
    { value: 'Drammen, Viken, NO', label: 'Drammen' },
    { value: 'Fredrikstad, Viken, NO', label: 'Fredrikstad' },
    { value: 'Kristiansand, Agder, NO', label: 'Kristiansand' },
    { value: 'Sandnes, Rogaland, NO', label: 'Sandnes' },
    { value: 'Tromsø, Troms og Finnmark, NO', label: 'Tromsø' },
    { value: 'Sarpsborg, Viken, NO', label: 'Sarpsborg' }
  ],

  // Finland
  'fi': [
    { value: 'Helsinki, Uusimaa, FI', label: 'Helsinki' },
    { value: 'Espoo, Uusimaa, FI', label: 'Espoo' },
    { value: 'Tampere, Pirkanmaa, FI', label: 'Tampere' },
    { value: 'Vantaa, Uusimaa, FI', label: 'Vantaa' },
    { value: 'Oulu, North Ostrobothnia, FI', label: 'Oulu' },
    { value: 'Turku, Southwest Finland, FI', label: 'Turku' },
    { value: 'Jyväskylä, Central Finland, FI', label: 'Jyväskylä' },
    { value: 'Lahti, Päijät-Häme, FI', label: 'Lahti' },
    { value: 'Kuopio, North Savo, FI', label: 'Kuopio' },
    { value: 'Pori, Satakunta, FI', label: 'Pori' }
  ],

  // Ireland
  'ie': [
    { value: 'Dublin, Leinster, IE', label: 'Dublin' },
    { value: 'Cork, Munster, IE', label: 'Cork' },
    { value: 'Limerick, Munster, IE', label: 'Limerick' },
    { value: 'Galway, Connacht, IE', label: 'Galway' },
    { value: 'Waterford, Munster, IE', label: 'Waterford' },
    { value: 'Drogheda, Leinster, IE', label: 'Drogheda' },
    { value: 'Dundalk, Leinster, IE', label: 'Dundalk' },
    { value: 'Swords, Leinster, IE', label: 'Swords' },
    { value: 'Bray, Leinster, IE', label: 'Bray' },
    { value: 'Navan, Leinster, IE', label: 'Navan' }
  ],

  // Italy
  'it': [
    { value: 'Rome, Lazio, IT', label: 'Rome' },
    { value: 'Milan, Lombardy, IT', label: 'Milan' },
    { value: 'Naples, Campania, IT', label: 'Naples' },
    { value: 'Turin, Piedmont, IT', label: 'Turin' },
    { value: 'Palermo, Sicily, IT', label: 'Palermo' },
    { value: 'Genoa, Liguria, IT', label: 'Genoa' },
    { value: 'Bologna, Emilia-Romagna, IT', label: 'Bologna' },
    { value: 'Florence, Tuscany, IT', label: 'Florence' },
    { value: 'Bari, Apulia, IT', label: 'Bari' },
    { value: 'Catania, Sicily, IT', label: 'Catania' },
    { value: 'Venice, Veneto, IT', label: 'Venice' },
    { value: 'Verona, Veneto, IT', label: 'Verona' },
    { value: 'Messina, Sicily, IT', label: 'Messina' },
    { value: 'Padua, Veneto, IT', label: 'Padua' },
    { value: 'Trieste, Friuli-Venezia Giulia, IT', label: 'Trieste' }
  ],

  // Spain
  'es': [
    { value: 'Madrid, Madrid, ES', label: 'Madrid' },
    { value: 'Barcelona, Catalonia, ES', label: 'Barcelona' },
    { value: 'Valencia, Valencia, ES', label: 'Valencia' },
    { value: 'Seville, Andalusia, ES', label: 'Seville' },
    { value: 'Zaragoza, Aragon, ES', label: 'Zaragoza' },
    { value: 'Málaga, Andalusia, ES', label: 'Málaga' },
    { value: 'Murcia, Murcia, ES', label: 'Murcia' },
    { value: 'Palma, Balearic Islands, ES', label: 'Palma' },
    { value: 'Las Palmas, Canary Islands, ES', label: 'Las Palmas' },
    { value: 'Bilbao, Basque Country, ES', label: 'Bilbao' },
    { value: 'Alicante, Valencia, ES', label: 'Alicante' },
    { value: 'Córdoba, Andalusia, ES', label: 'Córdoba' },
    { value: 'Valladolid, Castile and León, ES', label: 'Valladolid' },
    { value: 'Vigo, Galicia, ES', label: 'Vigo' },
    { value: 'Gijón, Asturias, ES', label: 'Gijón' }
  ],

  // Brazil
  'br': [
    { value: 'São Paulo, São Paulo, BR', label: 'São Paulo' },
    { value: 'Rio de Janeiro, Rio de Janeiro, BR', label: 'Rio de Janeiro' },
    { value: 'Brasília, Federal District, BR', label: 'Brasília' },
    { value: 'Salvador, Bahia, BR', label: 'Salvador' },
    { value: 'Fortaleza, Ceará, BR', label: 'Fortaleza' },
    { value: 'Belo Horizonte, Minas Gerais, BR', label: 'Belo Horizonte' },
    { value: 'Manaus, Amazonas, BR', label: 'Manaus' },
    { value: 'Curitiba, Paraná, BR', label: 'Curitiba' },
    { value: 'Recife, Pernambuco, BR', label: 'Recife' },
    { value: 'Goiânia, Goiás, BR', label: 'Goiânia' },
    { value: 'Belém, Pará, BR', label: 'Belém' },
    { value: 'Porto Alegre, Rio Grande do Sul, BR', label: 'Porto Alegre' },
    { value: 'Guarulhos, São Paulo, BR', label: 'Guarulhos' },
    { value: 'Campinas, São Paulo, BR', label: 'Campinas' },
    { value: 'São Luís, Maranhão, BR', label: 'São Luís' }
  ],

  // Mexico
  'mx': [
    { value: 'Mexico City, CDMX, MX', label: 'Mexico City' },
    { value: 'Guadalajara, Jalisco, MX', label: 'Guadalajara' },
    { value: 'Monterrey, Nuevo León, MX', label: 'Monterrey' },
    { value: 'Puebla, Puebla, MX', label: 'Puebla' },
    { value: 'Tijuana, Baja California, MX', label: 'Tijuana' },
    { value: 'León, Guanajuato, MX', label: 'León' },
    { value: 'Juárez, Chihuahua, MX', label: 'Juárez' },
    { value: 'Torreón, Coahuila, MX', label: 'Torreón' },
    { value: 'Querétaro, Querétaro, MX', label: 'Querétaro' },
    { value: 'San Luis Potosí, San Luis Potosí, MX', label: 'San Luis Potosí' },
    { value: 'Mérida, Yucatán, MX', label: 'Mérida' },
    { value: 'Mexicali, Baja California, MX', label: 'Mexicali' },
    { value: 'Aguascalientes, Aguascalientes, MX', label: 'Aguascalientes' },
    { value: 'Cancún, Quintana Roo, MX', label: 'Cancún' },
    { value: 'Saltillo, Coahuila, MX', label: 'Saltillo' }
  ]
}

// Legacy COMMON_COUNTRIES for backwards compatibility (now points to ALL_COUNTRIES)
export const COMMON_COUNTRIES = ALL_COUNTRIES

// Search types
export type SearchType = 'people' | 'companies' | 'both'

// Filter profile interface
export interface ICPFilterProfile {
  id?: string
  profile_name: string
  description?: string
  filters: ExplorimFilters
  search_type: SearchType
  usage_count?: number
  last_used_at?: string
  created_at?: string
  updated_at?: string
} 