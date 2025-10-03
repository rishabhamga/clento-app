import {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    MarkerType,
    MiniMap,
    Node,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow
} from '@xyflow/react';
import React, { useEffect, useState, useCallback } from 'react';

import '@xyflow/react/dist/style.css';

import edgeTypes from './edges/EdgeTypes';
import nodeTypes from './nodes/NodeTypes';
import { FlowData } from './types/WorkflowTypes';
import { FlowUtils } from './utils/FlowUtils';

interface WorkflowViewerProps {
  workflowData: FlowData | null | undefined;
  className?: string;
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
}

const WorkflowViewerContent: React.FC<WorkflowViewerProps> = ({
  workflowData,
  className = '',
  showControls = false,
  showMiniMap = false,
  showBackground = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const reactFlowInstance = useReactFlow();

  // Center the view after nodes are loaded
  const centerView = useCallback(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.1,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 1.5,
          duration: 500
        });
      }, 100);
    }
  }, [reactFlowInstance, nodes.length]);

  // Initialize flow from props
  useEffect(() => {
    if (workflowData && workflowData.nodes && workflowData.edges && Array.isArray(workflowData.nodes) && Array.isArray(workflowData.edges)) {
      try {
        const { nodes: initialNodes, edges: initialEdges } = FlowUtils.importFlow(workflowData);
        setNodes(initialNodes);
        setEdges(initialEdges);
        setIsLoading(false);

        // Center the view after a short delay to ensure nodes are rendered
        setTimeout(() => {
          centerView();
        }, 200);
      } catch (error) {
        console.error('Error loading workflow data:', error);
        setNodes([]);
        setEdges([]);
        setIsLoading(false);
      }
    } else {
      // No valid workflow data
      setNodes([]);
      setEdges([]);
      setIsLoading(false);
    }
  }, [workflowData, setNodes, setEdges, centerView]);

  // Disable all interactions in view-only mode
  const onConnect = () => {
    // Disabled in view mode
  };

  const onNodesChangeHandler = () => {
    // Disabled in view mode - prevent any node changes
  };

  const onEdgesChangeHandler = () => {
    // Disabled in view mode - prevent any edge changes
  };

  if (isLoading) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!nodes.length && !edges.length) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center space-y-4">
          <div className="text-gray-400 text-6xl">📋</div>
          <p className="text-gray-600">No workflow data to display</p>
          {workflowData && (
            <div className="text-xs text-gray-400 mt-4 p-4 bg-gray-100 rounded max-w-md">
              <p>Workflow data received but invalid:</p>
              <pre className="text-left mt-2 overflow-auto max-h-32">
                {JSON.stringify(workflowData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative bg-white ${className}`} style={{ minHeight: '400px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.1,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 1.5,
          duration: 500
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        selectionKeyCode={null}
        preventScrolling={false}
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#6366f1'
          },
          style: {
            strokeWidth: 2,
            stroke: '#6366f1'
          }
        }}
        className="workflow-viewer"
      >
        {showBackground && (
          <Background
            color="#e5e7eb"
            gap={20}
            size={1}
            variant={BackgroundVariant.Dots}
          />
        )}

        {showControls && (
          <Controls
            position="bottom-left"
          />
        )}

        {showMiniMap && (
          <MiniMap
            nodeStrokeColor={(n) => {
              if (n.type === 'action') {
                const actionType = (n.data as any)?.type;
                const colorMap: Record<string, string> = {
                  profile_visit: '#3b82f6',
                  like_post: '#10b981',
                  comment_post: '#f59e0b',
                  send_inmail: '#8b5cf6',
                  send_invite: '#06b6d4',
                  send_followup: '#ef4444',
                  follow_profile: '#84cc16',
                  follow_company: '#f97316',
                  notify_webhook: '#6366f1',
                  withdraw_request: '#6b7280'
                };
                return colorMap[actionType] || '#6b7280';
              }
              return '#6b7280';
            }}
            nodeColor={(n) => {
              if (n.type === 'action') {
                return 'rgba(255, 255, 255, 0.8)';
              }
              return 'rgba(107, 114, 128, 0.2)';
            }}
            nodeBorderRadius={8}
            maskColor="rgba(0, 0, 0, 0.1)"
            position="bottom-right"
          />
        )}

        {/* Workflow Info Panel */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-sm">Workflow Overview</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Actions:</span>
                <span className="font-medium">{nodes.filter(n => n.type === 'action').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Connections:</span>
                <span className="font-medium">{edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-medium">
                  {workflowData?.timestamp ? new Date(workflowData.timestamp).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Indicator */}
        <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-blue-700 text-sm font-medium">View Only</span>
          </div>
        </div>
      </ReactFlow>

      {/* Custom styles for view-only mode */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .workflow-viewer .react-flow__node {
            cursor: default !important;
          }

          .workflow-viewer .react-flow__node:hover {
            transform: none !important;
          }

          .workflow-viewer .react-flow__handle {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .workflow-viewer .react-flow__edge {
            cursor: default !important;
          }

          .workflow-viewer .react-flow__edge:hover {
            stroke-width: 2px !important;
          }

          .workflow-viewer .react-flow__controls {
            opacity: 0.8;
          }

          .workflow-viewer .react-flow__controls button {
            cursor: pointer;
          }

          .workflow-viewer .react-flow__minimap {
            opacity: 0.8;
          }

          .workflow-viewer .react-flow__background {
            opacity: 0.4;
          }
        `
      }} />
    </div>
  );
};

const WorkflowViewer: React.FC<WorkflowViewerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowViewerContent {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowViewer;
