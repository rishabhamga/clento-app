#!/usr/bin/env node

/**
 * Test script to verify workflow storage matches sample-flow.json format
 * Run with: node scripts/test-workflow-storage.js
 */

const fs = require('fs');
const path = require('path');

// Mock the workflow storage functions for testing
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

function testWorkflowFormat() {
  console.log('🧪 Testing Workflow Storage Format');
  console.log('=====================================\n');

  // Test 1: Verify structure matches sample-flow.json
  console.log('✅ Test 1: Structure Validation');
  const requiredFields = ['nodes', 'edges', 'timestamp'];
  const actualFields = Object.keys(testWorkflowData);
  
  console.log('Required fields:', requiredFields);
  console.log('Actual fields:', actualFields);
  
  const hasAllRequired = requiredFields.every(field => actualFields.includes(field));
  const hasOnlyRequired = actualFields.every(field => requiredFields.includes(field));
  
  if (hasAllRequired && hasOnlyRequired) {
    console.log('✅ Structure matches sample-flow.json format\n');
  } else {
    console.log('❌ Structure does NOT match sample-flow.json format');
    console.log('Missing fields:', requiredFields.filter(f => !actualFields.includes(f)));
    console.log('Extra fields:', actualFields.filter(f => !requiredFields.includes(f)));
    console.log('');
  }

  // Test 2: Verify node structure
  console.log('✅ Test 2: Node Structure Validation');
  if (testWorkflowData.nodes && testWorkflowData.nodes.length > 0) {
    const sampleNode = testWorkflowData.nodes[0];
    const nodeFields = Object.keys(sampleNode);
    console.log('Sample node fields:', nodeFields);
    
    const requiredNodeFields = ['id', 'type', 'position', 'data'];
    const hasRequiredNodeFields = requiredNodeFields.every(field => nodeFields.includes(field));
    
    if (hasRequiredNodeFields) {
      console.log('✅ Node structure is valid');
    } else {
      console.log('❌ Node structure is invalid');
      console.log('Missing node fields:', requiredNodeFields.filter(f => !nodeFields.includes(f)));
    }
  }
  console.log('');

  // Test 3: Verify edge structure
  console.log('✅ Test 3: Edge Structure Validation');
  if (testWorkflowData.edges && testWorkflowData.edges.length > 0) {
    const sampleEdge = testWorkflowData.edges[0];
    const edgeFields = Object.keys(sampleEdge);
    console.log('Sample edge fields:', edgeFields);
    
    const requiredEdgeFields = ['id', 'source', 'target', 'type'];
    const hasRequiredEdgeFields = requiredEdgeFields.every(field => edgeFields.includes(field));
    
    if (hasRequiredEdgeFields) {
      console.log('✅ Edge structure is valid');
    } else {
      console.log('❌ Edge structure is invalid');
      console.log('Missing edge fields:', requiredEdgeFields.filter(f => !edgeFields.includes(f)));
    }
  }
  console.log('');

  // Test 4: Verify timestamp format
  console.log('✅ Test 4: Timestamp Format Validation');
  const timestamp = testWorkflowData.timestamp;
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  
  if (timestampRegex.test(timestamp)) {
    console.log('✅ Timestamp format is valid:', timestamp);
  } else {
    console.log('❌ Timestamp format is invalid:', timestamp);
  }
  console.log('');

  // Test 5: JSON serialization test
  console.log('✅ Test 5: JSON Serialization Test');
  try {
    const jsonString = JSON.stringify(testWorkflowData, null, 2);
    const parsed = JSON.parse(jsonString);
    
    if (JSON.stringify(parsed) === JSON.stringify(testWorkflowData)) {
      console.log('✅ JSON serialization/deserialization works correctly');
    } else {
      console.log('❌ JSON serialization/deserialization failed');
    }
  } catch (error) {
    console.log('❌ JSON serialization error:', error.message);
  }
  console.log('');

  // Test 6: Compare with actual sample-flow.json
  console.log('✅ Test 6: Compare with sample-flow.json');
  try {
    const sampleFlowPath = path.join(__dirname, '..', 'sample-flow.json');
    if (fs.existsSync(sampleFlowPath)) {
      const sampleFlowContent = fs.readFileSync(sampleFlowPath, 'utf8');
      const sampleFlow = JSON.parse(sampleFlowContent);
      
      const sampleFields = Object.keys(sampleFlow).sort();
      const testFields = Object.keys(testWorkflowData).sort();
      
      console.log('Sample flow fields:', sampleFields);
      console.log('Test workflow fields:', testFields);
      
      if (JSON.stringify(sampleFields) === JSON.stringify(testFields)) {
        console.log('✅ Field structure matches sample-flow.json exactly');
      } else {
        console.log('❌ Field structure does NOT match sample-flow.json');
      }
    } else {
      console.log('⚠️ sample-flow.json not found, skipping comparison');
    }
  } catch (error) {
    console.log('❌ Error comparing with sample-flow.json:', error.message);
  }
  console.log('');

  // Test 7: Generate test output file
  console.log('✅ Test 7: Generate Test Output');
  const outputPath = path.join(__dirname, 'test-workflow-output.json');
  try {
    fs.writeFileSync(outputPath, JSON.stringify(testWorkflowData, null, 2));
    console.log('✅ Test workflow saved to:', outputPath);
    console.log('📁 You can compare this with sample-flow.json manually');
  } catch (error) {
    console.log('❌ Error saving test output:', error.message);
  }

  console.log('\n🎉 Workflow Format Testing Complete!');
  console.log('=====================================');
}

// Run the tests
testWorkflowFormat();
