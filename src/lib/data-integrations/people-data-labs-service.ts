import { supabase } from '@/lib/supabase'
import PDLJS from 'peopledatalabs'

// People Data Labs API interfaces
export interface PDLQuery {
  query: Record<string, unknown>
  size?: number
  scroll_token?: string
  dataset?: string
}

export interface PDLPerson {
  id: string
  full_name: string
  first_name: string
  last_name: string
  emails?: Array<{
    address: string
    type: string
  }>
  phone_numbers?: string[]
  work_email?: string
  linkedin_url?: string
  linkedin_username?: string
  job_title?: string
  job_company_name?: string
  job_company_industry?: string
  job_company_size?: string
  job_company_employee_count?: number
  job_company_founded?: number
  job_company_location_country?: string
  job_company_location_region?: string
  job_company_location_locality?: string
  job_title_levels?: string[]
  job_title_role?: string
  job_title_sub_role?: string
  job_title_class?: string
  inferred_salary?: string
  inferred_years_experience?: number
  location_country?: string
  location_region?: string
  location_locality?: string
  location_metro?: string
  industry?: string
  skills?: string[]
  interests?: string[]
  summary?: string
  headline?: string
}

export interface PDLResponse {
  status: number
  total: number
  data: PDLPerson[]
  scroll_token?: string
}

// Advanced filter interfaces
export interface LocationFilter {
  countries?: string[]
  regions?: string[]
  localities?: string[]
  metros?: string[]
  exclude_countries?: string[]
  exclude_regions?: string[]
}

export interface CompanyFilter {
  company_names?: string[]
  company_domains?: string[]
  company_industries?: string[]
  company_sizes?: string[]
  company_types?: string[]
  company_founded_min?: number
  company_founded_max?: number
  employee_count_min?: number
  employee_count_max?: number
  revenue_ranges?: string[]
  funding_stages?: string[]
  technologies?: string[]
  exclude_companies?: string[]
}

export interface JobFilter {
  job_titles?: string[]
  job_title_levels?: string[]
  job_title_roles?: string[]
  job_title_sub_roles?: string[]
  job_title_classes?: string[]
  seniority_levels?: string[]
  departments?: string[]
  years_experience_min?: number
  years_experience_max?: number
  salary_ranges?: string[]
  exclude_job_titles?: string[]
  exclude_departments?: string[]
}

export interface PersonalFilter {
  education_degrees?: string[]
  education_majors?: string[]
  schools?: string[]
  languages?: string[]
  skills?: string[]
  interests?: string[]
  certifications?: string[]
  exclude_skills?: string[]
}

export interface PDLSearchFilters {
  location?: LocationFilter
  company?: CompanyFilter
  job?: JobFilter
  personal?: PersonalFilter
  contact_info?: {
    has_email?: boolean
    has_phone?: boolean
    has_linkedin?: boolean
    email_types?: string[]
  }
  demographics?: {
    age_min?: number
    age_max?: number
  }
}

class PeopleDataLabsService {
  private apiKey: string
  private baseUrl = 'https://api.peopledatalabs.com/v5'
  private PDLClient: any

  constructor() {
    this.apiKey = process.env.PEOPLE_DATA_LABS_API_KEY || ''
    if (!this.apiKey) {
      console.warn('People Data Labs API key not found in environment variables')
    }
    this.PDLClient = new PDLJS({ apiKey: this.apiKey })
  }

  private buildElasticsearchQuery(filters: PDLSearchFilters): Record<string, unknown> {
    const mustClauses: Record<string, unknown>[] = []
    const shouldClauses: Record<string, unknown>[] = []
    const filterClauses: Record<string, unknown>[] = []

    // Location filters
    if (filters.location) {
      if (filters.location.countries?.length) {
        mustClauses.push({
          terms: { 'location_country': filters.location.countries }
        })
      }
      if (filters.location.regions?.length) {
        mustClauses.push({
          terms: { 'location_region': filters.location.regions }
        })
      }
      if (filters.location.localities?.length) {
        mustClauses.push({
          terms: { 'location_locality': filters.location.localities }
        })
      }
      if (filters.location.metros?.length) {
        mustClauses.push({
          terms: { 'location_metro': filters.location.metros }
        })
      }
      if (filters.location.exclude_countries?.length) {
        mustClauses.push({
          bool: {
            must_not: {
              terms: { 'location_country': filters.location.exclude_countries }
            }
          }
        })
      }
    }

    // Company filters
    if (filters.company) {
      if (filters.company.company_names?.length) {
        shouldClauses.push({
          terms: { 'job_company_name': filters.company.company_names }
        })
      }
      if (filters.company.company_industries?.length) {
        mustClauses.push({
          terms: { 'job_company_industry': filters.company.company_industries }
        })
      }
      if (filters.company.company_sizes?.length) {
        mustClauses.push({
          terms: { 'job_company_size': filters.company.company_sizes }
        })
      }
      if (filters.company.company_types?.length) {
        mustClauses.push({
          terms: { 'job_company_type': filters.company.company_types }
        })
      }
      if (filters.company.employee_count_min !== undefined || filters.company.employee_count_max !== undefined) {
        const rangeQuery: Record<string, number> = {}
        if (filters.company.employee_count_min !== undefined) {
          rangeQuery.gte = filters.company.employee_count_min
        }
        if (filters.company.employee_count_max !== undefined) {
          rangeQuery.lte = filters.company.employee_count_max
        }
        mustClauses.push({
          range: { 'job_company_employee_count': rangeQuery }
        })
      }
      if (filters.company.company_founded_min !== undefined || filters.company.company_founded_max !== undefined) {
        const rangeQuery: Record<string, number> = {}
        if (filters.company.company_founded_min !== undefined) {
          rangeQuery.gte = filters.company.company_founded_min
        }
        if (filters.company.company_founded_max !== undefined) {
          rangeQuery.lte = filters.company.company_founded_max
        }
        mustClauses.push({
          range: { 'job_company_founded': rangeQuery }
        })
      }
      if (filters.company.revenue_ranges?.length) {
        mustClauses.push({
          terms: { 'job_company_inferred_revenue': filters.company.revenue_ranges }
        })
      }
      if (filters.company.exclude_companies?.length) {
        mustClauses.push({
          bool: {
            must_not: {
              terms: { 'job_company_name': filters.company.exclude_companies }
            }
          }
        })
      }
    }

    // Job filters
    if (filters.job) {
      if (filters.job.job_titles?.length) {
        shouldClauses.push({
          terms: { 'job_title': filters.job.job_titles }
        })
      }
      if (filters.job.job_title_levels?.length) {
        mustClauses.push({
          terms: { 'job_title_levels': filters.job.job_title_levels }
        })
      }
      if (filters.job.job_title_roles?.length) {
        mustClauses.push({
          terms: { 'job_title_role': filters.job.job_title_roles }
        })
      }
      if (filters.job.job_title_sub_roles?.length) {
        mustClauses.push({
          terms: { 'job_title_sub_role': filters.job.job_title_sub_roles }
        })
      }
      if (filters.job.job_title_classes?.length) {
        mustClauses.push({
          terms: { 'job_title_class': filters.job.job_title_classes }
        })
      }
      if (filters.job.years_experience_min !== undefined || filters.job.years_experience_max !== undefined) {
        const rangeQuery: Record<string, number> = {}
        if (filters.job.years_experience_min !== undefined) {
          rangeQuery.gte = filters.job.years_experience_min
        }
        if (filters.job.years_experience_max !== undefined) {
          rangeQuery.lte = filters.job.years_experience_max
        }
        mustClauses.push({
          range: { 'inferred_years_experience': rangeQuery }
        })
      }
      if (filters.job.salary_ranges?.length) {
        mustClauses.push({
          terms: { 'inferred_salary': filters.job.salary_ranges }
        })
      }
      if (filters.job.exclude_job_titles?.length) {
        mustClauses.push({
          bool: {
            must_not: {
              terms: { 'job_title': filters.job.exclude_job_titles }
            }
          }
        })
      }
    }

    // Personal filters
    if (filters.personal) {
      if (filters.personal.education_degrees?.length) {
        mustClauses.push({
          nested: {
            path: 'education',
            query: {
              terms: { 'education.degrees': filters.personal.education_degrees }
            }
          }
        })
      }
      if (filters.personal.education_majors?.length) {
        mustClauses.push({
          nested: {
            path: 'education',
            query: {
              terms: { 'education.majors': filters.personal.education_majors }
            }
          }
        })
      }
      if (filters.personal.schools?.length) {
        mustClauses.push({
          nested: {
            path: 'education',
            query: {
              terms: { 'education.school.name': filters.personal.schools }
            }
          }
        })
      }
      if (filters.personal.skills?.length) {
        mustClauses.push({
          terms: { 'skills': filters.personal.skills }
        })
      }
      if (filters.personal.interests?.length) {
        mustClauses.push({
          terms: { 'interests': filters.personal.interests }
        })
      }
      if (filters.personal.languages?.length) {
        mustClauses.push({
          nested: {
            path: 'languages',
            query: {
              terms: { 'languages.name': filters.personal.languages }
            }
          }
        })
      }
      if (filters.personal.exclude_skills?.length) {
        mustClauses.push({
          bool: {
            must_not: {
              terms: { 'skills': filters.personal.exclude_skills }
            }
          }
        })
      }
    }

    // Contact info filters
    if (filters.contact_info) {
      if (filters.contact_info.has_email) {
        mustClauses.push({
          exists: { field: 'emails' }
        })
      }
      if (filters.contact_info.has_phone) {
        mustClauses.push({
          exists: { field: 'phone_numbers' }
        })
      }
      if (filters.contact_info.has_linkedin) {
        mustClauses.push({
          exists: { field: 'linkedin_url' }
        })
      }
    }

    return {
      bool: {
        ...(mustClauses.length > 0 && { must: mustClauses }),
        ...(shouldClauses.length > 0 && { should: shouldClauses, minimum_should_match: 1 }),
        ...(filterClauses.length > 0 && { filter: filterClauses })
      }
    }
  }

  async searchPeople(filters: PDLSearchFilters, options: {
    size?: number
    scroll_token?: string
    dataset?: string
  } = {}): Promise<PDLResponse> {
    try {
      // Use direct fetch API call instead of client library
      const response = await fetch(`${this.baseUrl}/person/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey
        },
        body: JSON.stringify({
          query: this.buildElasticsearchQuery(filters),
          size: options.size || 10,
          scroll_token: options.scroll_token,
          dataset: options.dataset,
        })
      });
      
      if (!response.ok) {
        throw new Error(`PDL API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        status: response.status,
        total: data.total,
        data: data.data,
        scroll_token: data.scroll_token,
      }
    } catch (error) {
      console.error('Error searching people:', error)
      throw error
    }
  }

  async enrichPerson(params: {
    email?: string
    phone?: string
    linkedin_url?: string
    first_name?: string
    last_name?: string
    company?: string
    location?: string
  }): Promise<PDLPerson | null> {
    try {
      const response = await this.PDLClient.person.enrichment(params)
      return response.data
    } catch (error) {
      console.error('Error enriching person:', error)
      return null
    }
  }

  // Save leads to Supabase with deduplication
  async saveLeads(leads: PDLPerson[], campaignId?: string): Promise<{ saved: number; duplicates: number }> {
    try {
      let saved = 0
      let duplicates = 0

      for (const lead of leads) {
        // Check if lead already exists
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', lead.work_email || lead.emails?.[0]?.address)
          .single()

        if (existingLead) {
          duplicates++
          continue
        }

        // Save new lead
        const { error } = await supabase
          .from('leads')
          .insert({
            email: lead.work_email || lead.emails?.[0]?.address,
            first_name: lead.first_name,
            last_name: lead.last_name,
            full_name: lead.full_name,
            job_title: lead.job_title,
            company: lead.job_company_name,
            industry: lead.job_company_industry,
            company_size: lead.job_company_size,
            location: lead.location_locality || lead.location_region,
            country: lead.location_country,
            linkedin_url: lead.linkedin_url,
            phone: lead.phone_numbers?.[0],
            seniority_level: lead.job_title_levels?.[0],
            department: lead.job_title_role,
            years_experience: lead.inferred_years_experience,
            skills: lead.skills,
            data_source: 'peopledatalabs',
            external_id: lead.id,
            campaign_id: campaignId
          })

        if (!error) {
          saved++
        }
      }

      return { saved, duplicates }
    } catch (error) {
      console.error('Error saving leads:', error)
      throw error
    }
  }

  // Get available filter options
  getFilterOptions() {
    return {
      jobTitleLevels: [
        'cxo', 'owner', 'vp', 'director', 'partner', 'senior', 'manager', 'entry', 'training', 'unpaid'
      ],
      jobTitleRoles: [
        'advisory', 'analyst', 'creative', 'education', 'engineering', 'finance', 'fulfillment',
        'health', 'hospitality', 'human_resources', 'legal', 'manufacturing', 'marketing',
        'operations', 'partnerships', 'product', 'professional_service', 'public_service',
        'research', 'sales', 'sales_engineering', 'support', 'trade', 'unemployed'
      ],
      companySizes: [
        '1', '2-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'
      ],
      companyTypes: [
        'public', 'private', 'non_profit', 'government', 'educational', 'self_employed', 'partnership'
      ],
      industries: [
        'computer software', 'information technology and services', 'financial services',
        'marketing and advertising', 'management consulting', 'internet', 'retail',
        'health, wellness and fitness', 'real estate', 'construction', 'education management',
        'hospital & health care', 'automotive', 'telecommunications', 'banking', 'insurance'
      ],
      revenueRanges: [
        '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M', '$500M-$1B', '$1B+'
      ],
      salaryRanges: [
        '$30,000-$50,000', '$50,000-$75,000', '$75,000-$100,000', '$100,000-$150,000',
        '$150,000-$200,000', '$200,000-$300,000', '$300,000+'
      ],
      educationDegrees: [
        'high school', 'associate', 'bachelor', 'master', 'doctorate', 'professional'
      ],
      languages: [
        'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'russian',
        'chinese', 'japanese', 'korean', 'arabic', 'hindi'
      ]
    }
  }
}

export const peopleDataLabsService = new PeopleDataLabsService()
export default peopleDataLabsService 