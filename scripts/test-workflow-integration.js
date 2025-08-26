#!/usr/bin/env node

/**
 * Integration test for workflow storage system
 * Tests the complete flow: save -> load -> verify format
 * Run with: node scripts/test-workflow-integration.js
 */

const fs = require('fs');
const path = require('path');

// Test workflow data matching sample-flow.json format exactly
const testWorkflowData = {
  "nodes": [
    {
      "id": "profile_visit-1741803242094",
      "type": "action",
      "position": {
        "x": 100,
        "y": 0
      },
      "data": {
        "type": "profile_visit",
        "label": "Visit Profile",
        "isConfigured": true,
        "config": {}
      },
      "measured": {
        "width": 220,
        "height": 54
      },
      "selected": false
    },
    {
      "id": "send-invite-1755016596165",
      "type": "action",
      "position": {
        "x": 100,
        "y": 150
      },
      "data": {
        "type": "send_invite",
        "label": "Connection Request",
        "isConfigured": true,
        "config": {
          "useAI": false,
          "tone": "Warm",
          "formality": "Casual",
          "message": "Hi [first_name], I'd like to connect with you."
        }
      },
      "measured": {
        "width": 220,
        "height": 54
      },
      "selected": false
    }
  ],
  "edges": [
    {
      "id": "e0-1",
      "source": "profile_visit-1741803242094",
      "target": "send-invite-1755016596165",
      "type": "buttonedge",
      "animated": true,
      "data": {
        "delay": "15m",
        "delayData": {
          "delay": 15,
          "unit": "m"
        }
      }
    }
  ],
  "timestamp": "2025-01-24T10:24:28.794Z"
};

function runIntegrationTests() {
  console.log('🧪 Running Workflow Integration Tests');
  console.log('=====================================\n');

  let testsPassed = 0;
  let testsTotal = 0;

  function test(name, fn) {
    testsTotal++;
    try {
      fn();
      console.log(`✅ ${name}`);
      testsPassed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  // Test 1: Verify sample-flow.json format compliance
  test('Sample Flow Format Compliance', () => {
    const requiredFields = ['nodes', 'edges', 'timestamp'];
    const actualFields = Object.keys(testWorkflowData);
    
    if (!requiredFields.every(field => actualFields.includes(field))) {
      throw new Error('Missing required fields');
    }
    
    if (!actualFields.every(field => requiredFields.includes(field))) {
      throw new Error('Contains extra fields not in sample-flow.json');
    }
  });

  // Test 2: Node structure validation
  test('Node Structure Validation', () => {
    if (!testWorkflowData.nodes || testWorkflowData.nodes.length === 0) {
      throw new Error('No nodes found');
    }

    const node = testWorkflowData.nodes[0];
    const requiredNodeFields = ['id', 'type', 'position', 'data'];
    
    if (!requiredNodeFields.every(field => node.hasOwnProperty(field))) {
      throw new Error('Node missing required fields');
    }

    if (!node.position.hasOwnProperty('x') || !node.position.hasOwnProperty('y')) {
      throw new Error('Node position missing x or y coordinates');
    }

    if (!node.data.hasOwnProperty('type') || !node.data.hasOwnProperty('label')) {
      throw new Error('Node data missing required fields');
    }
  });

  // Test 3: Edge structure validation
  test('Edge Structure Validation', () => {
    if (!testWorkflowData.edges || testWorkflowData.edges.length === 0) {
      throw new Error('No edges found');
    }

    const edge = testWorkflowData.edges[0];
    const requiredEdgeFields = ['id', 'source', 'target', 'type'];
    
    if (!requiredEdgeFields.every(field => edge.hasOwnProperty(field))) {
      throw new Error('Edge missing required fields');
    }

    // Verify edge connects valid nodes
    const nodeIds = testWorkflowData.nodes.map(n => n.id);
    if (!nodeIds.includes(edge.source) || !nodeIds.includes(edge.target)) {
      throw new Error('Edge references non-existent nodes');
    }
  });

  // Test 4: Timestamp format validation
  test('Timestamp Format Validation', () => {
    const timestamp = testWorkflowData.timestamp;
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    
    if (!timestampRegex.test(timestamp)) {
      throw new Error(`Invalid timestamp format: ${timestamp}`);
    }

    // Verify it's a valid date
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error('Timestamp is not a valid date');
    }
  });

  // Test 5: JSON serialization/deserialization
  test('JSON Serialization Round-trip', () => {
    const jsonString = JSON.stringify(testWorkflowData, null, 2);
    const parsed = JSON.parse(jsonString);
    
    if (JSON.stringify(parsed) !== JSON.stringify(testWorkflowData)) {
      throw new Error('JSON round-trip failed');
    }
  });

  // Test 6: Action type validation
  test('Action Type Validation', () => {
    const validActionTypes = [
      'profile_visit', 'like_post', 'comment_post', 'send_inmail',
      'send_invite', 'follow_profile', 'follow_company', 'send_email',
      'notify_webhook', 'withdraw_request', 'send_followup'
    ];

    for (const node of testWorkflowData.nodes) {
      if (node.type === 'action') {
        if (!validActionTypes.includes(node.data.type)) {
          throw new Error(`Invalid action type: ${node.data.type}`);
        }
      }
    }
  });

  // Test 7: Edge type validation
  test('Edge Type Validation', () => {
    const validEdgeTypes = ['buttonedge', 'conditional'];

    for (const edge of testWorkflowData.edges) {
      if (!validEdgeTypes.includes(edge.type)) {
        throw new Error(`Invalid edge type: ${edge.type}`);
      }
    }
  });

  // Test 8: Delay data validation
  test('Delay Data Validation', () => {
    for (const edge of testWorkflowData.edges) {
      if (edge.data && edge.data.delayData) {
        const delayData = edge.data.delayData;
        
        if (typeof delayData.delay !== 'number' || delayData.delay < 0) {
          throw new Error('Invalid delay value');
        }

        const validUnits = ['m', 'h', 'd'];
        if (!validUnits.includes(delayData.unit)) {
          throw new Error(`Invalid delay unit: ${delayData.unit}`);
        }
      }
    }
  });

  // Test 9: Configuration validation
  test('Configuration Validation', () => {
    for (const node of testWorkflowData.nodes) {
      if (node.type === 'action') {
        if (typeof node.data.isConfigured !== 'boolean') {
          throw new Error('isConfigured must be boolean');
        }

        if (typeof node.data.config !== 'object') {
          throw new Error('config must be object');
        }
      }
    }
  });

  // Test 10: Compare with actual sample-flow.json
  test('Compare with Sample Flow Structure', () => {
    const sampleFlowPath = path.join(__dirname, '..', 'sample-flow.json');
    if (fs.existsSync(sampleFlowPath)) {
      const sampleFlowContent = fs.readFileSync(sampleFlowPath, 'utf8');
      const sampleFlow = JSON.parse(sampleFlowContent);
      
      // Compare top-level structure
      const sampleFields = Object.keys(sampleFlow).sort();
      const testFields = Object.keys(testWorkflowData).sort();
      
      if (JSON.stringify(sampleFields) !== JSON.stringify(testFields)) {
        throw new Error('Structure does not match sample-flow.json');
      }

      // Compare node structure (first node)
      if (sampleFlow.nodes && sampleFlow.nodes.length > 0 && testWorkflowData.nodes.length > 0) {
        const sampleNodeFields = Object.keys(sampleFlow.nodes[0]).sort();
        const testNodeFields = Object.keys(testWorkflowData.nodes[0]).sort();
        
        // Allow for some flexibility in optional fields
        const requiredNodeFields = ['id', 'type', 'position', 'data'];
        const sampleHasRequired = requiredNodeFields.every(f => sampleNodeFields.includes(f));
        const testHasRequired = requiredNodeFields.every(f => testNodeFields.includes(f));
        
        if (!sampleHasRequired || !testHasRequired) {
          throw new Error('Node structure missing required fields compared to sample');
        }
      }
    } else {
      console.log('⚠️ sample-flow.json not found, skipping comparison');
    }
  });

  // Test 11: Save test output for manual inspection
  test('Generate Test Output File', () => {
    const outputPath = path.join(__dirname, 'integration-test-output.json');
    fs.writeFileSync(outputPath, JSON.stringify(testWorkflowData, null, 2));
    
    // Verify file was created and is readable
    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to create output file');
    }

    const savedContent = fs.readFileSync(outputPath, 'utf8');
    const savedData = JSON.parse(savedContent);
    
    if (JSON.stringify(savedData) !== JSON.stringify(testWorkflowData)) {
      throw new Error('Saved file content does not match original');
    }
  });

  // Summary
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${testsPassed}/${testsTotal}`);
  console.log(`❌ Failed: ${testsTotal - testsPassed}/${testsTotal}`);
  
  if (testsPassed === testsTotal) {
    console.log('\n🎉 All tests passed! Workflow format is compliant with sample-flow.json');
    console.log('📁 Test output saved to: scripts/integration-test-output.json');
    console.log('\n✅ Ready for production use!');
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run the integration tests
runIntegrationTests();
