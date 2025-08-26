'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';
import { FlowData } from '@/components/workflow/types/WorkflowTypes';

// Sample flow data from your sample-flow.json
const sampleFlowData: FlowData = {
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
      "id": "comment_post-1755016587374",
      "type": "action",
      "position": {
        "x": 100,
        "y": 150
      },
      "data": {
        "type": "comment_post",
        "label": "Comment on Post",
        "isConfigured": true,
        "config": {
          "useAI": true,
          "language": "english",
          "length": "short(1 sentence)",
          "commentTone": "agreeable",
          "customGuidelines": "Write comments that feel extremely natural, casual, and human — as if a real person is replying on LinkedIn without overthinking it.",
          "postCount": 1,
          "recentPostWithin": 15,
          "customComment": "Stand-up meetings can be surprisingly effective when done right; it's great to hear your team found value in streamlining your workflow!"
        }
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
        "y": 300
      },
      "data": {
        "type": "send_invite",
        "label": "Connection Request",
        "isConfigured": true,
        "config": {
          "useAI": false,
          "tone": "Warm",
          "formality": "Casual",
          "approach": "Direct",
          "focus": "Personal",
          "intention": "Networking",
          "callToAction": "Subtle",
          "personalization": "Specific",
          "language": "english",
          "mentionPost": false,
          "customGuidelines": "",
          "message": "Hi [first_name], I'm from Clento—a leading automation platform. We specialize in safe, natural LinkedIn outreach performed by industry experts."
        }
      },
      "measured": {
        "width": 220,
        "height": 54
      },
      "selected": false
    },
    {
      "id": "send_followup-1755016604848",
      "type": "action",
      "position": {
        "x": 300,
        "y": 450
      },
      "data": {
        "type": "send_followup",
        "label": "Send Message",
        "isConfigured": true,
        "config": {
          "useAI": false,
          "isFollowUp": true,
          "mentionPost": false,
          "language": "english",
          "messageLength": "medium",
          "tone": "casual",
          "customGuidelines": "",
          "message": "Thanks for connecting, [first_name]! Just sharing for your awareness—at Clento, we help professionals automate their LinkedIn outreach safely and effectively."
        },
        "pathType": "accepted"
      },
      "measured": {
        "width": 220,
        "height": 54
      },
      "selected": false
    },
    {
      "id": "add-step-accepted-1755017161200",
      "type": "addStep",
      "position": {
        "x": 300,
        "y": 600
      },
      "data": {
        "pathType": "accepted"
      },
      "measured": {
        "width": 220,
        "height": 40
      }
    },
    {
      "id": "withdraw_request-1755016639716",
      "type": "action",
      "position": {
        "x": -100,
        "y": 450
      },
      "data": {
        "type": "withdraw_request",
        "label": "Withdraw Request",
        "isConfigured": true,
        "config": {},
        "pathType": "not-accepted"
      },
      "measured": {
        "width": 220,
        "height": 54
      },
      "selected": false
    },
    {
      "id": "add-step-not-accepted-1756030968466",
      "type": "addStep",
      "position": {
        "x": -100,
        "y": 600
      },
      "data": {
        "pathType": "not-accepted"
      },
      "measured": {
        "width": 220,
        "height": 40
      },
      "selected": false
    }
  ],
  "edges": [
    {
      "id": "e0-1",
      "source": "profile_visit-1741803242094",
      "target": "comment_post-1755016587374",
      "type": "buttonedge",
      "animated": true,
      "data": {
        "delay": "15m",
        "delayData": {
          "delay": 15,
          "unit": "m"
        }
      }
    },
    {
      "id": "e1-2",
      "source": "comment_post-1755016587374",
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
    },
    {
      "id": "e-accepted",
      "source": "send-invite-1755016596165",
      "target": "send_followup-1755016604848",
      "type": "conditional",
      "animated": true,
      "data": {
        "delay": "15m",
        "delayData": {
          "delay": 15,
          "unit": "m"
        },
        "isPositive": true,
        "isConditionalPath": true
      }
    },
    {
      "id": "e-not-accepted",
      "source": "send-invite-1755016596165",
      "target": "withdraw_request-1755016639716",
      "type": "conditional",
      "animated": true,
      "data": {
        "delay": "7d",
        "delayData": {
          "delay": 7,
          "unit": "d"
        },
        "isPositive": false,
        "isConditionalPath": true
      }
    },
    {
      "id": "e-followup-add",
      "source": "send_followup-1755016604848",
      "target": "add-step-accepted-1755017161200",
      "type": "conditional",
      "animated": true,
      "data": {
        "delay": "2d",
        "delayData": {
          "delay": 2,
          "unit": "d"
        },
        "isPositive": true,
        "isConditionalPath": true
      }
    },
    {
      "id": "e-withdraw-add",
      "source": "withdraw_request-1755016639716",
      "target": "add-step-not-accepted-1756030968466",
      "type": "conditional",
      "animated": true,
      "data": {
        "delay": "15m",
        "delayData": {
          "delay": 15,
          "unit": "m"
        },
        "isPositive": false,
        "isConditionalPath": true
      }
    }
  ],
  "timestamp": "2025-01-24T10:24:28.794Z"
};

export default function WorkflowDemoPage() {
  const [currentFlow, setCurrentFlow] = useState<FlowData | undefined>(sampleFlowData);
  const [validationState, setValidationState] = useState({
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  });

  const handleSave = async (flowData: FlowData) => {
    console.log('Saving workflow:', flowData);
    setCurrentFlow(flowData);
    // Here you would typically save to your backend
    alert('Workflow saved successfully!');
  };

  const handleValidationChange = (isValid: boolean, errors: string[], warnings: string[]) => {
    setValidationState({ isValid, errors, warnings });
  };

  const handleLoadSample = () => {
    setCurrentFlow(sampleFlowData);
  };

  const handleStartFresh = () => {
    setCurrentFlow(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/campaigns"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Campaigns</span>
              </Link>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Workflow Builder Demo
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Design sophisticated LinkedIn automation workflows
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleLoadSample}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Upload size={16} />
                <span>Load Sample</span>
              </button>
              
              <button
                onClick={handleStartFresh}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Play size={16} />
                <span>Start Fresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status Bar */}
      {(!validationState.isValid || validationState.warnings.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 ${
            validationState.isValid 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          } border-b`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                {!validationState.isValid && (
                  <div className="text-red-800 dark:text-red-200">
                    <span className="font-medium">
                      {validationState.errors.length} Error(s):
                    </span>
                    <ul className="list-disc list-inside ml-4 text-sm">
                      {validationState.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationState.warnings.length > 0 && (
                  <div className="text-yellow-800 dark:text-yellow-200">
                    <span className="font-medium">
                      {validationState.warnings.length} Warning(s):
                    </span>
                    <ul className="list-disc list-inside ml-4 text-sm">
                      {validationState.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Workflow Builder */}
      <div className="h-[calc(100vh-4rem)]">
        <WorkflowBuilder
          initialFlow={currentFlow}
          onSave={handleSave}
          onValidationChange={handleValidationChange}
          className="h-full"
        />
      </div>
    </div>
  );
}
