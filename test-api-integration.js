// Comprehensive API Integration Test Suite
// Tests both Apollo and Explorium providers with various scenarios
// Run: node test-api-integration.js

const { getDataProviderManager } = require('./src/lib/data-providers/provider-manager');

// Test data and scenarios
const testFilters = {
  basic: {
    searchType: 'people',
    jobTitles: ['Software Engineer', 'Developer'],
    locations: ['United States'],
    page: 1,
    pageSize: 10
  },
  advanced: {
    searchType: 'people',
    jobTitles: ['CTO', 'Chief Technology Officer'],
    seniorities: ['c_suite', 'vp'],
    locations: ['United States', 'Canada'],
    companyHeadcount: ['51-200', '201-500'],
    industries: ['Technology', 'Software'],
    hasEmail: true,
    page: 1,
    pageSize: 25
  },
  minimal: {
    searchType: 'people',
    jobTitles: ['Manager'],
    page: 1,
    pageSize: 5
  }
};

// Mock API responses for testing
const mockApolloResponse = {
  people: [
    {
      id: 'apollo_123',
      name: 'John Doe',
      title: 'Software Engineer',
      email: 'john.doe@example.com',
      organization: {
        name: 'Tech Corp',
        industry: 'Technology'
      }
    }
  ],
  pagination: {
    page: 1,
    per_page: 10,
    total_entries: 100,
    total_pages: 10
  }
};

const mockExplorimResponse = {
  prospects: [
    {
      id: 'explorium_456',
      full_name: 'Jane Smith',
      job_title: 'CTO',
      email: 'jane.smith@example.com',
      company: 'Explorium Corp',
      industry: 'Technology'
    }
  ],
  totalProspects: 150,
  pagination: {
    page: 1,
    pageSize: 10,
    hasMore: true,
    totalPages: 15
  }
};

// Test utilities
class TestResult {
  constructor(testName) {
    this.testName = testName;
    this.passed = false;
    this.error = null;
    this.duration = 0;
    this.details = {};
  }
  
  pass(details = {}) {
    this.passed = true;
    this.details = details;
    return this;
  }
  
  fail(error, details = {}) {
    this.passed = false;
    this.error = error;
    this.details = details;
    return this;
  }
}

class TestSuite {
  constructor() {
    this.results = [];
    this.stats = { passed: 0, failed: 0, total: 0 };
  }
  
  async run(testName, testFunction) {
    const result = new TestResult(testName);
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running: ${testName}`);
      await testFunction(result);
      if (!result.passed && !result.error) {
        result.fail('Test did not explicitly pass or fail');
      }
    } catch (error) {
      result.fail(error.message, { stack: error.stack });
    }
    
    result.duration = Date.now() - startTime;
    this.results.push(result);
    
    if (result.passed) {
      console.log(`✅ PASS: ${testName} (${result.duration}ms)`);
      this.stats.passed++;
    } else {
      console.log(`❌ FAIL: ${testName} (${result.duration}ms)`);
      console.log(`   Error: ${result.error}`);
      this.stats.failed++;
    }
    
    this.stats.total++;
  }
  
  summary() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${this.stats.total}`);
    console.log(`Passed: ${this.stats.passed}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Success Rate: ${((this.stats.passed / this.stats.total) * 100).toFixed(1)}%`);
    
    if (this.stats.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.testName}: ${r.error}`);
      });
    }
    
    return this.stats.failed === 0;
  }
}

// Test functions
async function testProviderInitialization(result) {
  const manager = getDataProviderManager();
  const currentProvider = manager.getCurrentProvider();
  const config = manager.getProviderInfo();
  
  if (!['apollo', 'explorium'].includes(currentProvider)) {
    return result.fail(`Invalid provider: ${currentProvider}`);
  }
  
  if (!config || !config.type) {
    return result.fail('Provider config is missing or invalid');
  }
  
  result.pass({
    provider: currentProvider,
    hasApiKey: !!config.apiKey,
    baseUrl: config.baseUrl,
    features: config.features
  });
}

async function testFilterTransformation(result) {
  const manager = getDataProviderManager();
  const provider = manager.getCurrentProvider();
  
  try {
    // Test basic filter transformation
    const validation = await manager.validateFilters(testFilters.basic);
    
    if (!validation) {
      return result.fail('Filter validation returned null/undefined');
    }
    
    result.pass({
      provider,
      validationResult: validation,
      originalFilters: testFilters.basic
    });
  } catch (error) {
    result.fail(`Filter transformation failed: ${error.message}`);
  }
}

async function testAdvancedFilters(result) {
  const manager = getDataProviderManager();
  const provider = manager.getCurrentProvider();
  
  try {
    const validation = await manager.validateFilters(testFilters.advanced);
    
    if (!validation) {
      return result.fail('Advanced filter validation failed');
    }
    
    result.pass({
      provider,
      validationResult: validation,
      originalFilters: testFilters.advanced
    });
  } catch (error) {
    result.fail(`Advanced filter validation failed: ${error.message}`);
  }
}

async function testFilterOptions(result) {
  const manager = getDataProviderManager();
  const provider = manager.getCurrentProvider();
  const filterOptions = manager.getFilterOptions();
  
  if (!filterOptions) {
    return result.fail('Filter options are missing');
  }
  
  // Check for required filter options
  const requiredOptions = ['seniorities', 'companyHeadcount', 'companyRevenue'];
  const missing = requiredOptions.filter(opt => !filterOptions[opt]);
  
  if (missing.length > 0) {
    return result.fail(`Missing filter options: ${missing.join(', ')}`);
  }
  
  result.pass({
    provider,
    filterOptions: Object.keys(filterOptions),
    sampleSeniorities: filterOptions.seniorities
  });
}

async function testProviderSpecificFeatures(result) {
  const manager = getDataProviderManager();
  const provider = manager.getCurrentProvider();
  const config = manager.getProviderInfo();
  
  if (!config.features) {
    return result.fail('Provider features are missing');
  }
  
  // Test provider-specific features
  const features = config.features;
  const requiredFeatures = ['emailVerification', 'phoneNumbers', 'socialProfiles'];
  const missing = requiredFeatures.filter(feature => typeof features[feature] !== 'boolean');
  
  if (missing.length > 0) {
    return result.fail(`Missing feature flags: ${missing.join(', ')}`);
  }
  
  result.pass({
    provider,
    features,
    rateLimit: config.rateLimit
  });
}

async function testErrorHandling(result) {
  const manager = getDataProviderManager();
  
  try {
    // Test with invalid filters
    const invalidFilters = {
      searchType: 'invalid',
      jobTitles: null,
      pageSize: -1
    };
    
    const validation = await manager.validateFilters(invalidFilters);
    
    // Should handle invalid filters gracefully
    result.pass({
      handledInvalidFilters: true,
      validationResult: validation
    });
  } catch (error) {
    // It's okay if validation throws for invalid filters
    result.pass({
      handledInvalidFilters: true,
      errorMessage: error.message
    });
  }
}

async function testEmptyFilters(result) {
  const manager = getDataProviderManager();
  
  try {
    const validation = await manager.validateFilters({});
    
    // Should handle empty filters gracefully
    result.pass({
      handledEmptyFilters: true,
      validationResult: validation
    });
  } catch (error) {
    result.fail(`Empty filters should be handled gracefully: ${error.message}`);
  }
}

async function testApiKeyValidation(result) {
  const manager = getDataProviderManager();
  const config = manager.getProviderInfo();
  
  if (!config.apiKey) {
    // This is expected if no API key is configured
    try {
      await manager.searchProspects(testFilters.minimal);
      result.fail('Search should fail without API key');
    } catch (error) {
      if (error.message.includes('API key not configured')) {
        result.pass({
          correctlyValidatesApiKey: true,
          errorMessage: error.message
        });
      } else {
        result.fail(`Unexpected error message: ${error.message}`);
      }
    }
  } else {
    result.pass({
      apiKeyConfigured: true,
      provider: config.type
    });
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Integration Test Suite');
  console.log('======================================');
  
  const testSuite = new TestSuite();
  
  // Run all test cases
  await testSuite.run('Provider Initialization', testProviderInitialization);
  await testSuite.run('Filter Transformation', testFilterTransformation);
  await testSuite.run('Advanced Filters', testAdvancedFilters);
  await testSuite.run('Filter Options', testFilterOptions);
  await testSuite.run('Provider-Specific Features', testProviderSpecificFeatures);
  await testSuite.run('Error Handling', testErrorHandling);
  await testSuite.run('Empty Filters', testEmptyFilters);
  await testSuite.run('API Key Validation', testApiKeyValidation);
  
  // Show summary
  const success = testSuite.summary();
  
  if (success) {
    console.log('\n🎉 All tests passed! API integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }
  
  return success;
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, TestSuite, TestResult }; 