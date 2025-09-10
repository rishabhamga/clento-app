/**
 * Job Matching Service
 * 
 * Provides sophisticated job matching capabilities including exact and fuzzy matching
 * of job titles against predefined lists, department categorization, and job title
 * standardization.
 */

import {
  type JobMatchingCriteria,
  type DepartmentConfig,
  type JobTitleMapping,
  type MatchType,
  PREDEFINED_DEPARTMENTS,
  PREDEFINED_JOB_TITLES,
  type PredefinedDepartment,
  type PredefinedJobTitle
} from '@/types/linkedin-job-filter';

// Fuzzy matching library - using a simple string similarity algorithm
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  // Levenshtein distance calculation
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  return 1 - (distance / maxLength);
}

// Job title normalization and standardization
const JOB_TITLE_MAPPINGS: JobTitleMapping[] = [
  // Revenue and Sales Leadership
  { standardTitle: 'Chief Revenue Officer', aliases: ['CRO', 'Chief Revenue Officer'], department: 'Sales', seniority: 'executive' },
  { standardTitle: 'Chief Growth Officer', aliases: ['CGO', 'Chief Growth Officer'], department: 'Sales', seniority: 'executive' },
  { standardTitle: 'Chief Sales Officer', aliases: ['CSO', 'Chief Sales Officer'], department: 'Sales', seniority: 'executive' },
  { standardTitle: 'Chief Commercial Officer', aliases: ['CCO', 'Chief Commercial Officer'], department: 'Sales', seniority: 'executive' },
  { standardTitle: 'VP Revenue', aliases: ['VP Revenue', 'VP of Revenue', 'Vice President Revenue', 'Vice President of Revenue'], department: 'Sales', seniority: 'executive' },
  { standardTitle: 'VP Sales', aliases: ['VP Sales', 'VP of Sales', 'Vice President Sales', 'Vice President of Sales'], department: 'Sales', seniority: 'executive' },
  { standardTitle: 'VP Commercial', aliases: ['VP of Commercial', 'VP Commercial', 'Vice President Commercial'], department: 'Sales', seniority: 'executive' },
  { standardTitle: 'Head of Sales', aliases: ['Head of Sales', 'Sales Head'], department: 'Sales', seniority: 'senior' },
  { standardTitle: 'Head of Revenue', aliases: ['Head of Revenue', 'Revenue Head'], department: 'Sales', seniority: 'senior' },
  { standardTitle: 'Head of Commercial', aliases: ['Head of Commercial', 'Commercial Head'], department: 'Sales', seniority: 'senior' },
  { standardTitle: 'Head of Growth', aliases: ['Head of Growth', 'Growth Head'], department: 'Sales', seniority: 'senior' },
  { standardTitle: 'Director of Sales', aliases: ['Director of Sales', 'Director Sales', 'Sales Director'], department: 'Sales', seniority: 'senior' },
  { standardTitle: 'VP Go To Market', aliases: ['VP Go To Market', 'VP GTM', 'VP Go-to-Market'], department: 'Sales', seniority: 'executive' },
  { standardTitle: 'Head of GTM', aliases: ['Head of GTM', 'Head of Go To Market', 'GTM Head'], department: 'Sales', seniority: 'senior' },
  { standardTitle: 'GTM Lead', aliases: ['GTM Lead', 'Go To Market Lead'], department: 'Sales', seniority: 'senior' },
  { standardTitle: 'GTM Manager', aliases: ['GTM Manager', 'Go To Market Manager'], department: 'Sales', seniority: 'mid' },
  { standardTitle: 'Go-to-Market Strategist', aliases: ['Go-to-Market Strategist', 'GTM Strategist'], department: 'Sales', seniority: 'mid' },
  { standardTitle: 'Revenue Operations', aliases: ['Revenue Operations', 'RevOps', 'Revenue Ops'], department: 'Operations', seniority: 'mid' },
  { standardTitle: 'Director RevOps', aliases: ['Director RevOps', 'Director of Revenue Operations'], department: 'Operations', seniority: 'senior' },
  { standardTitle: 'Sales Operations', aliases: ['Sales Operations', 'Sales Ops'], department: 'Sales', seniority: 'mid' },
  
  // Engineering Leadership
  { standardTitle: 'Chief Technology Officer', aliases: ['CTO', 'Chief Technology Officer'], department: 'Engineering', seniority: 'executive' },
  { standardTitle: 'VP Engineering', aliases: ['VP Engineering', 'VP of Engineering', 'Vice President Engineering'], department: 'Engineering', seniority: 'executive' },
  { standardTitle: 'Head of Engineering', aliases: ['Head of Engineering', 'Engineering Head'], department: 'Engineering', seniority: 'senior' },
  { standardTitle: 'Director of Engineering', aliases: ['Director of Engineering', 'Engineering Director'], department: 'Engineering', seniority: 'senior' },
  
  // Product Leadership
  { standardTitle: 'Chief Product Officer', aliases: ['CPO', 'Chief Product Officer'], department: 'Product', seniority: 'executive' },
  { standardTitle: 'VP Product', aliases: ['VP Product', 'VP of Product', 'Vice President Product'], department: 'Product', seniority: 'executive' },
  { standardTitle: 'Head of Product', aliases: ['Head of Product', 'Product Head'], department: 'Product', seniority: 'senior' },
  { standardTitle: 'Director of Product', aliases: ['Director of Product', 'Product Director'], department: 'Product', seniority: 'senior' },
  
  // Marketing Leadership
  { standardTitle: 'Chief Marketing Officer', aliases: ['CMO', 'Chief Marketing Officer'], department: 'Marketing', seniority: 'executive' },
  { standardTitle: 'VP Marketing', aliases: ['VP Marketing', 'VP of Marketing', 'Vice President Marketing'], department: 'Marketing', seniority: 'executive' },
  { standardTitle: 'Head of Marketing', aliases: ['Head of Marketing', 'Marketing Head'], department: 'Marketing', seniority: 'senior' },
  { standardTitle: 'Director of Marketing', aliases: ['Director of Marketing', 'Marketing Director'], department: 'Marketing', seniority: 'senior' },
];

// Department configurations with keywords and common titles
const DEPARTMENT_CONFIGS: DepartmentConfig[] = [
  {
    name: 'Sales',
    keywords: ['sales', 'revenue', 'commercial', 'business development', 'account management', 'customer success'],
    commonTitles: ['Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Representative'],
    aliases: ['Business Development', 'Commercial', 'Revenue']
  },
  {
    name: 'Engineering',
    keywords: ['engineer', 'developer', 'software', 'programming', 'technical', 'backend', 'frontend', 'fullstack'],
    commonTitles: ['Software Engineer', 'Senior Developer', 'Tech Lead', 'DevOps Engineer'],
    aliases: ['Development', 'Software', 'Technology', 'IT']
  },
  {
    name: 'Product',
    keywords: ['product', 'product management', 'product owner', 'product strategy'],
    commonTitles: ['Product Manager', 'Product Owner', 'Product Analyst', 'Product Designer'],
    aliases: ['Product Management', 'Product Strategy']
  },
  {
    name: 'Marketing',
    keywords: ['marketing', 'digital marketing', 'content', 'brand', 'advertising', 'promotion'],
    commonTitles: ['Marketing Manager', 'Content Marketing', 'Digital Marketing Specialist', 'Brand Manager'],
    aliases: ['Brand', 'Communications', 'Digital Marketing']
  },
  {
    name: 'Operations',
    keywords: ['operations', 'ops', 'logistics', 'supply chain', 'process'],
    commonTitles: ['Operations Manager', 'Operations Analyst', 'Business Analyst', 'Process Manager'],
    aliases: ['Logistics', 'Supply Chain', 'Business Operations']
  },
  {
    name: 'Customer Support',
    keywords: ['support', 'customer service', 'help desk', 'customer care', 'client services'],
    commonTitles: ['Customer Support Specialist', 'Customer Success Manager', 'Support Engineer'],
    aliases: ['Customer Service', 'Customer Success', 'Client Services']
  },
  {
    name: 'Human Resources',
    keywords: ['hr', 'human resources', 'people', 'talent', 'recruiting', 'recruitment'],
    commonTitles: ['HR Manager', 'Recruiter', 'People Operations', 'Talent Acquisition'],
    aliases: ['People', 'Talent', 'Recruiting', 'People Operations']
  },
  {
    name: 'Finance',
    keywords: ['finance', 'accounting', 'financial', 'controller', 'treasury'],
    commonTitles: ['Financial Analyst', 'Accountant', 'Finance Manager', 'Controller'],
    aliases: ['Accounting', 'Financial Planning', 'Treasury']
  }
];

export interface JobMatchResult {
  title: string;
  matchType: MatchType;
  confidenceScore: number;
  standardizedTitle?: string;
  department?: string;
  seniority?: string;
}

export class JobMatchingService {
  private criteria: JobMatchingCriteria;
  private titleMappings: Map<string, JobTitleMapping>;
  private departmentMappings: Map<string, DepartmentConfig>;

  constructor(criteria: JobMatchingCriteria) {
    this.criteria = criteria;
    this.titleMappings = new Map();
    this.departmentMappings = new Map();
    
    this.initializeMappings();
  }

  private initializeMappings(): void {
    // Initialize job title mappings
    JOB_TITLE_MAPPINGS.forEach(mapping => {
      mapping.aliases.forEach(alias => {
        this.titleMappings.set(alias.toLowerCase(), mapping);
      });
    });

    // Initialize department mappings
    DEPARTMENT_CONFIGS.forEach(config => {
      this.departmentMappings.set(config.name.toLowerCase(), config);
      config.aliases.forEach(alias => {
        this.departmentMappings.set(alias.toLowerCase(), config);
      });
    });
  }

  /**
   * Match a job title against the criteria
   */
  public matchJobTitle(jobTitle: string): JobMatchResult | null {
    const normalizedTitle = jobTitle.toLowerCase().trim();
    
    // Try exact match first
    const exactMatch = this.tryExactMatch(normalizedTitle);
    if (exactMatch) return exactMatch;

    // Try fuzzy match if enabled
    if (this.criteria.fuzzyMatch) {
      const fuzzyMatch = this.tryFuzzyMatch(normalizedTitle);
      if (fuzzyMatch && fuzzyMatch.confidenceScore >= this.criteria.confidenceThreshold) {
        return fuzzyMatch;
      }
    }

    // Try department-based matching
    const departmentMatch = this.tryDepartmentMatch(normalizedTitle);
    if (departmentMatch) return departmentMatch;

    return null;
  }

  private tryExactMatch(normalizedTitle: string): JobMatchResult | null {
    // Check against specific job titles if provided
    if (this.criteria.jobTitles && this.criteria.jobTitles.length > 0) {
      for (const targetTitle of this.criteria.jobTitles) {
        if (normalizedTitle === targetTitle.toLowerCase()) {
          const mapping = this.titleMappings.get(normalizedTitle);
          return {
            title: normalizedTitle,
            matchType: 'exact',
            confidenceScore: 1.0,
            standardizedTitle: mapping?.standardTitle,
            department: mapping?.department,
            seniority: mapping?.seniority
          };
        }
      }
    }

    // Check against predefined job titles
    const predefinedMatch = PREDEFINED_JOB_TITLES.find(title => 
      title.toLowerCase() === normalizedTitle
    );
    
    if (predefinedMatch) {
      const mapping = this.titleMappings.get(normalizedTitle);
      return {
        title: normalizedTitle,
        matchType: 'exact',
        confidenceScore: 1.0,
        standardizedTitle: mapping?.standardTitle || predefinedMatch,
        department: mapping?.department,
        seniority: mapping?.seniority
      };
    }

    return null;
  }

  private tryFuzzyMatch(normalizedTitle: string): JobMatchResult | null {
    let bestMatch: JobMatchResult | null = null;
    let bestScore = 0;

    // Check against specific job titles if provided
    if (this.criteria.jobTitles && this.criteria.jobTitles.length > 0) {
      for (const targetTitle of this.criteria.jobTitles) {
        const similarity = calculateSimilarity(normalizedTitle, targetTitle.toLowerCase());
        if (similarity > bestScore && similarity >= this.criteria.confidenceThreshold) {
          const mapping = this.titleMappings.get(targetTitle.toLowerCase());
          bestMatch = {
            title: normalizedTitle,
            matchType: 'fuzzy',
            confidenceScore: similarity,
            standardizedTitle: mapping?.standardTitle || targetTitle,
            department: mapping?.department,
            seniority: mapping?.seniority
          };
          bestScore = similarity;
        }
      }
    }

    // Check against predefined job titles
    for (const predefinedTitle of PREDEFINED_JOB_TITLES) {
      const similarity = calculateSimilarity(normalizedTitle, predefinedTitle.toLowerCase());
      if (similarity > bestScore && similarity >= this.criteria.confidenceThreshold) {
        const mapping = this.titleMappings.get(predefinedTitle.toLowerCase());
        bestMatch = {
          title: normalizedTitle,
          matchType: 'fuzzy',
          confidenceScore: similarity,
          standardizedTitle: mapping?.standardTitle || predefinedTitle,
          department: mapping?.department,
          seniority: mapping?.seniority
        };
        bestScore = similarity;
      }
    }

    return bestMatch;
  }

  private tryDepartmentMatch(normalizedTitle: string): JobMatchResult | null {
    for (const department of this.criteria.departments) {
      const departmentConfig = this.departmentMappings.get(department.toLowerCase());
      if (!departmentConfig) continue;

      // Check if job title contains department keywords
      for (const keyword of departmentConfig.keywords) {
        if (normalizedTitle.includes(keyword.toLowerCase())) {
          return {
            title: normalizedTitle,
            matchType: 'department',
            confidenceScore: 0.7, // Department matches get moderate confidence
            department: departmentConfig.name
          };
        }
      }

      // Check against common titles for this department
      for (const commonTitle of departmentConfig.commonTitles) {
        const similarity = calculateSimilarity(normalizedTitle, commonTitle.toLowerCase());
        if (similarity >= 0.8) { // High threshold for common titles
          return {
            title: normalizedTitle,
            matchType: 'title_keyword',
            confidenceScore: similarity,
            department: departmentConfig.name
          };
        }
      }
    }

    return null;
  }

  /**
   * Categorize a job title into a department
   */
  public categorizeJobTitle(jobTitle: string): string | null {
    const normalizedTitle = jobTitle.toLowerCase().trim();

    // First try to find exact mapping
    const mapping = this.titleMappings.get(normalizedTitle);
    if (mapping) return mapping.department;

    // Then try department keyword matching
    for (const [_, config] of this.departmentMappings) {
      for (const keyword of config.keywords) {
        if (normalizedTitle.includes(keyword.toLowerCase())) {
          return config.name;
        }
      }
    }

    return null;
  }

  /**
   * Standardize a job title to its canonical form
   */
  public standardizeJobTitle(jobTitle: string): string {
    const normalizedTitle = jobTitle.toLowerCase().trim();
    const mapping = this.titleMappings.get(normalizedTitle);
    return mapping?.standardTitle || jobTitle;
  }

  /**
   * Get department configuration
   */
  public getDepartmentConfig(department: string): DepartmentConfig | null {
    return this.departmentMappings.get(department.toLowerCase()) || null;
  }

  /**
   * Get all predefined departments
   */
  public static getPredefinedDepartments(): readonly PredefinedDepartment[] {
    return PREDEFINED_DEPARTMENTS;
  }

  /**
   * Get all predefined job titles
   */
  public static getPredefinedJobTitles(): readonly PredefinedJobTitle[] {
    return PREDEFINED_JOB_TITLES;
  }

  /**
   * Validate job matching criteria
   */
  public static validateCriteria(criteria: JobMatchingCriteria): string[] {
    const errors: string[] = [];

    if (!criteria.departments || criteria.departments.length === 0) {
      errors.push('At least one department must be specified');
    }

    if (criteria.confidenceThreshold < 0 || criteria.confidenceThreshold > 1) {
      errors.push('Confidence threshold must be between 0 and 1');
    }

    if (criteria.jobTitles) {
      for (const title of criteria.jobTitles) {
        if (!title || title.trim().length === 0) {
          errors.push('Job titles cannot be empty');
        }
      }
    }

    return errors;
  }

  /**
   * Calculate match statistics for a set of job results
   */
  public calculateMatchStatistics(matches: JobMatchResult[]): {
    totalMatches: number;
    exactMatches: number;
    fuzzyMatches: number;
    departmentMatches: number;
    titleKeywordMatches: number;
    averageConfidence: number;
    departmentBreakdown: { [department: string]: number };
  } {
    const stats = {
      totalMatches: matches.length,
      exactMatches: 0,
      fuzzyMatches: 0,
      departmentMatches: 0,
      titleKeywordMatches: 0,
      averageConfidence: 0,
      departmentBreakdown: {} as { [department: string]: number }
    };

    if (matches.length === 0) return stats;

    let totalConfidence = 0;

    matches.forEach(match => {
      totalConfidence += match.confidenceScore;

      switch (match.matchType) {
        case 'exact':
          stats.exactMatches++;
          break;
        case 'fuzzy':
          stats.fuzzyMatches++;
          break;
        case 'department':
          stats.departmentMatches++;
          break;
        case 'title_keyword':
          stats.titleKeywordMatches++;
          break;
      }

      if (match.department) {
        stats.departmentBreakdown[match.department] = 
          (stats.departmentBreakdown[match.department] || 0) + 1;
      }
    });

    stats.averageConfidence = totalConfidence / matches.length;

    return stats;
  }
}