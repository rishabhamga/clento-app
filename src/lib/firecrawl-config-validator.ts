/**
 * Firecrawl Configuration Validator
 * 
 * Helps validate and test Firecrawl API key configuration
 * according to the official authentication requirements:
 * Authorization: Bearer fc-123456789
 */

import FirecrawlApp from '@mendable/firecrawl-js';

export interface FirecrawlConfigValidation {
  isValid: boolean;
  hasApiKey: boolean;
  correctFormat: boolean;
  keyLength: number;
  keyPrefix: string;
  keySuffix: string;
  errorMessage?: string;
  testResult?: {
    success: boolean;
    creditsUsed?: number;
    error?: string;
  };
}

/**
 * Validate Firecrawl API key configuration
 */
export function validateFirecrawlConfig(apiKey?: string): FirecrawlConfigValidation {
  const key = apiKey || process.env.FIRECRAWL_API_KEY;
  
  const validation: FirecrawlConfigValidation = {
    isValid: false,
    hasApiKey: !!key,
    correctFormat: false,
    keyLength: key?.length || 0,
    keyPrefix: key?.substring(0, 3) || '',
    keySuffix: key?.slice(-4) || ''
  };

  if (!key) {
    validation.errorMessage = 'No Firecrawl API key found. Set FIRECRAWL_API_KEY environment variable.';
    return validation;
  }

  if (key === 'fc-YOUR_FIRECRAWL_API_KEY_HERE' || key === 'FIRECRAWL_API_KEY_HERE') {
    validation.errorMessage = 'Placeholder API key detected. Please replace with your actual Firecrawl API key.';
    return validation;
  }

  if (!key.startsWith('fc-')) {
    validation.errorMessage = 'Firecrawl API key must start with "fc-". Current format is incorrect.';
    return validation;
  }

  if (key.length < 10) {
    validation.errorMessage = 'Firecrawl API key appears too short. Please verify your API key.';
    return validation;
  }

  validation.correctFormat = true;
  validation.isValid = true;

  return validation;
}

/**
 * Test Firecrawl API key by making a simple API call
 */
export async function testFirecrawlApiKey(apiKey?: string): Promise<FirecrawlConfigValidation> {
  const validation = validateFirecrawlConfig(apiKey);
  
  if (!validation.isValid) {
    return validation;
  }

  try {
    const firecrawl = new FirecrawlApp({ apiKey: apiKey || process.env.FIRECRAWL_API_KEY });
    
    // Test with a simple scrape of a basic webpage
    const testResult = await firecrawl.scrapeUrl('https://httpbin.org/get', {
      formats: ['markdown'],
      timeout: 10000
    });

    if (testResult.success) {
      validation.testResult = {
        success: true,
        creditsUsed: 1 // Basic scrape typically uses 1 credit
      };
    } else {
      validation.testResult = {
        success: false,
        error: testResult.error || 'Unknown API test error'
      };
      validation.isValid = false;
      validation.errorMessage = `API test failed: ${testResult.error}`;
    }

  } catch (error) {
    validation.testResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    validation.isValid = false;
    validation.errorMessage = `API test error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  return validation;
}

/**
 * Get human-readable configuration status
 */
export function getFirecrawlConfigStatus(validation: FirecrawlConfigValidation): string {
  if (!validation.hasApiKey) {
    return '❌ No Firecrawl API key configured';
  }

  if (!validation.correctFormat) {
    return `❌ Invalid API key format: ${validation.errorMessage}`;
  }

  if (validation.testResult) {
    if (validation.testResult.success) {
      return `✅ Firecrawl API key valid and tested successfully`;
    } else {
      return `⚠️ API key format correct but test failed: ${validation.testResult.error}`;
    }
  }

  if (validation.isValid) {
    return `✅ Firecrawl API key format is valid (fc-****${validation.keySuffix})`;
  }

  return `❌ Configuration error: ${validation.errorMessage}`;
}

/**
 * Log Firecrawl configuration status for debugging
 */
export function logFirecrawlStatus(apiKey?: string): void {
  const validation = validateFirecrawlConfig(apiKey);
  const status = getFirecrawlConfigStatus(validation);
  
  console.log(`🔥 Firecrawl Configuration Status: ${status}`);
  
  if (validation.hasApiKey && validation.correctFormat) {
    console.log(`📊 API Key Info: ${validation.keyLength} chars, ${validation.keyPrefix}****${validation.keySuffix}`);
  }
}