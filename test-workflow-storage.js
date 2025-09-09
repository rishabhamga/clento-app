// Test script to diagnose workflow storage issues
const { uploadFlowToGCS } = require('./src/utils/gcsUtil');

async function testWorkflowStorage() {
  console.log('🧪 Testing Workflow Storage System');
  console.log('=====================================');
  
  // Check environment variables
  console.log('🔧 Environment Variables Check:');
  console.log('GOOGLE_CLOUD_PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅ Set' : '❌ Missing');
  console.log('GOOGLE_CLOUD_STORAGE_BUCKET:', process.env.GOOGLE_CLOUD_STORAGE_BUCKET ? '✅ Set' : '❌ Missing');
  console.log('GOOGLE_CLOUD_FLOW_STORAGE_BUCKET:', process.env.GOOGLE_CLOUD_FLOW_STORAGE_BUCKET ? '✅ Set' : '❌ Missing (will use default: campaign-flow)');
  console.log('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY:', process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing');
  console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅ Set' : '❌ Missing');
  
  // Test workflow data
  const testWorkflow = {
    nodes: [
      {
        id: '1',
        type: 'input',
        position: { x: 250, y: 25 },
        data: { label: 'Test Node' }
      }
    ],
    edges: [],
    timestamp: new Date().toISOString()
  };
  
  console.log('\n🚀 Testing Workflow Upload:');
  console.log('Test workflow:', JSON.stringify(testWorkflow, null, 2));
  
  try {
    const buffer = Buffer.from(JSON.stringify(testWorkflow), 'utf-8');
    const result = await uploadFlowToGCS(buffer, 'test-workflow.json', 'workflows');
    
    console.log('\n✅ Upload Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 Workflow storage is working correctly!');
    } else {
      console.log('\n❌ Workflow storage failed:', result.error);
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
  
  console.log('\n🏁 Test completed');
}

// Run the test
testWorkflowStorage().catch(console.error);
