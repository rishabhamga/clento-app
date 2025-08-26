import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  MarkerType
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Upload, 
  Save, 
  RotateCcw, 
  Play,
  AlertCircle,
  CheckCircle,
  Loader2,
  Check
} from 'lucide-react';

import '@xyflow/react/dist/style.css';

import { FlowNode, FlowEdge, FlowData, ActionNodeData } from './types/WorkflowTypes';
import { FlowUtils } from './utils/FlowUtils';
import { workflowTheme, actionDefinitions } from './utils/ActionDefinitions';
import nodeTypes from './nodes/NodeTypes';
import edgeTypes from './edges/EdgeTypes';
import ActionSelectionModal from './panels/ActionSelectionModal';
import DelayEditorModal from './panels/DelayEditorModal';
import NodeSettingsPanel from './panels/NodeSettingsPanel';

interface WorkflowBuilderProps {
  initialFlow?: FlowData;
  onSave?: (flowData: FlowData) => void;
  onValidationChange?: (isValid: boolean, errors: string[], warnings: string[]) => void;
  className?: string;
}

const WorkflowBuilderContent: React.FC<WorkflowBuilderProps> = ({
  initialFlow,
  onSave,
  onValidationChange,
  className = ''
}) => {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalContext, setActionModalContext] = useState<{
    sourceNodeId?: string;
    pathType?: 'accepted' | 'not-accepted';
    replaceAddStep?: boolean;
  }>({});
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayModalContext, setDelayModalContext] = useState<{
    edgeId?: string;
    currentDelay?: { delay: number; unit: 'd' | 'm' | 'h' };
  }>({});
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [settingsPanelNode, setSettingsPanelNode] = useState<(ActionNodeData & { id: string }) | undefined>();
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize flow from props
  useEffect(() => {
    if (initialFlow) {
      const { nodes: initialNodes, edges: initialEdges } = FlowUtils.importFlow(initialFlow);
      setNodes(initialNodes);
      setEdges(initialEdges);
    } else {
      // Start with an empty flow with an add step node
      const addStepNode = FlowUtils.createAddStepNode({ x: 100, y: 0 });
      setNodes([addStepNode]);
      setEdges([]);
    }
  }, [initialFlow, setNodes, setEdges]);

  // Validate flow whenever nodes or edges change
  useEffect(() => {
    const result = FlowUtils.validateFlow(nodes as FlowNode[], edges as FlowEdge[]);
    setValidationResult(result);
    onValidationChange?.(result.isValid, result.errors, result.warnings);
  }, [nodes, edges]); // Removed onValidationChange from dependencies to prevent infinite loops

  // Auto-save workflow whenever nodes or edges change
  useEffect(() => {
    if (!onSave || nodes.length === 0) return;

    const timeoutId = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const flowData = FlowUtils.exportFlow(nodes as FlowNode[], edges as FlowEdge[]);
        await onSave(flowData);
        console.log('Workflow auto-saved');
        
        // Show saved indicator briefly
        setShowSavedIndicator(true);
        setTimeout(() => setShowSavedIndicator(false), 2000);
      } catch (error) {
        console.error('Failed to auto-save workflow:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1000); // Debounce auto-save by 1 second

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, onSave]);

  // Ensure terminal nodes have Add Step nodes
  useEffect(() => {
    const actionNodes = nodes.filter(node => node.type === 'action') as FlowNode[];
    const addStepNodes = nodes.filter(node => node.type === 'addStep') as FlowNode[];
    
    // Find terminal nodes (nodes with no outgoing edges)
    const terminalNodes = actionNodes.filter(node => {
      const hasOutgoingEdges = edges.some(edge => edge.source === node.id);
      return !hasOutgoingEdges;
    });

    // Check if each terminal node has an Add Step node after it
    const missingAddSteps: FlowNode[] = [];
    
    terminalNodes.forEach(terminalNode => {
      const hasAddStepAfter = addStepNodes.some(addStepNode => {
        return edges.some(edge => 
          edge.source === terminalNode.id && edge.target === addStepNode.id
        );
      });

      if (!hasAddStepAfter) {
        // Create Add Step node for this terminal node
        const pathType = (terminalNode.data as ActionNodeData).pathType;
        const addStepPosition = {
          x: terminalNode.position.x,
          y: terminalNode.position.y + 150
        };
        
        const newAddStepNode = FlowUtils.createAddStepNode(addStepPosition, pathType);
        missingAddSteps.push(newAddStepNode);

        // Create edge to connect terminal node to Add Step
        const connectingEdge = FlowUtils.createEdge(
          terminalNode.id,
          newAddStepNode.id,
          { delay: 15, unit: 'm' },
          pathType === 'accepted' || pathType === 'not-accepted',
          pathType === 'accepted'
        );
        
        setEdges(edges => [...edges, connectingEdge] as Edge[]);
      }
    });

    if (missingAddSteps.length > 0) {
      setNodes(nodes => [...nodes, ...missingAddSteps] as Node[]);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Event listeners for node interactions
  useEffect(() => {
    const handleOpenNodeSettings = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      const node = nodes.find(n => n.id === nodeId) as FlowNode;
      if (node && node.data && node.data.type) {
        setSettingsPanelNode({ ...(node.data as ActionNodeData), id: nodeId });
        setIsSettingsPanelOpen(true);
      }
    };

    const handleDeleteNode = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      setNodes(nodes => nodes.filter(node => node.id !== nodeId));
      setEdges(edges => edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    };

    const handleShowActionSelection = (event: CustomEvent) => {
      const { sourceNodeId, pathType, replaceAddStep } = event.detail;
      setActionModalContext({ sourceNodeId, pathType, replaceAddStep });
      setIsActionModalOpen(true);
    };

    const handleEditEdgeDelay = (event: CustomEvent) => {
      const { edgeId, currentDelay } = event.detail;
      setDelayModalContext({ edgeId, currentDelay });
      setIsDelayModalOpen(true);
    };

    window.addEventListener('openNodeSettings', handleOpenNodeSettings as EventListener);
    window.addEventListener('deleteNode', handleDeleteNode as EventListener);
    window.addEventListener('showActionSelection', handleShowActionSelection as EventListener);
    window.addEventListener('editEdgeDelay', handleEditEdgeDelay as EventListener);

    return () => {
      window.removeEventListener('openNodeSettings', handleOpenNodeSettings as EventListener);
      window.removeEventListener('deleteNode', handleDeleteNode as EventListener);
      window.removeEventListener('showActionSelection', handleShowActionSelection as EventListener);
      window.removeEventListener('editEdgeDelay', handleEditEdgeDelay as EventListener);
    };
  }, [nodes, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = FlowUtils.createEdge(
        params.source!,
        params.target!,
        { delay: 15, unit: 'm' },
        params.sourceHandle === 'accepted' || params.sourceHandle === 'not-accepted',
        params.sourceHandle === 'accepted'
      );
      setEdges(eds => addEdge(newEdge, eds as FlowEdge[]) as Edge[]);
    },
    [setEdges]
  );

  const handleActionSelect = useCallback((actionType: string) => {
    const { sourceNodeId, pathType, replaceAddStep } = actionModalContext;
    
    if (replaceAddStep && sourceNodeId) {
      // Replace the add step node with the selected action
      const addStepNode = nodes.find(n => n.id === sourceNodeId);
      if (addStepNode) {
        const newActionNode = FlowUtils.createActionNode(
          actionType,
          addStepNode.position,
          pathType
        );
        
        // Replace the add step node
        setNodes(nodes => nodes.map(node => 
          node.id === sourceNodeId ? newActionNode : node
        ));

        // Update any edges that were pointing to the AddStep node to now point to the new action node
        setEdges(edges => edges.map(edge => {
          if (edge.target === sourceNodeId) {
            return { ...edge, target: newActionNode.id };
          }
          return edge;
        }));

        // Check if this action has conditional branching (like Connection Request)
        const actionDef = actionDefinitions.find(a => a.type === actionType);
        const hasConditionalBranching = actionDef?.hasConditionalBranching;

        if (hasConditionalBranching) {
          // Create two Add Step nodes for conditional branching (accepted/not-accepted)
          const acceptedPosition = {
            x: newActionNode.position.x + 200, // Right side for accepted
            y: newActionNode.position.y + 150
          };
          const notAcceptedPosition = {
            x: newActionNode.position.x - 200, // Left side for not-accepted
            y: newActionNode.position.y + 150
          };

          const acceptedAddStepNode = FlowUtils.createAddStepNode(acceptedPosition, 'accepted');
          const notAcceptedAddStepNode = FlowUtils.createAddStepNode(notAcceptedPosition, 'not-accepted');

          setNodes(nodes => [...nodes, acceptedAddStepNode, notAcceptedAddStepNode]);

          // Create conditional edges for both paths
          const acceptedEdge = FlowUtils.createEdge(
            newActionNode.id,
            acceptedAddStepNode.id,
            { delay: 15, unit: 'm' },
            true, // isConditional
            true  // isPositive (accepted)
          );

          const notAcceptedEdge = FlowUtils.createEdge(
            newActionNode.id,
            notAcceptedAddStepNode.id,
            { delay: 15, unit: 'm' },
            true,  // isConditional
            false  // isPositive (not-accepted)
          );

          setEdges(edges => [...edges, acceptedEdge, notAcceptedEdge]);
        } else {
          // Regular action - create single Add Step node
          const nextPosition = {
            x: newActionNode.position.x,
            y: newActionNode.position.y + 150
          };
          const newAddStepNode = FlowUtils.createAddStepNode(nextPosition, pathType);
          setNodes(nodes => [...nodes, newAddStepNode]);

          // Connect the new action to the new add step
          // Inherit conditional styling from the path type
          const isConditional = pathType === 'accepted' || pathType === 'not-accepted';
          const isPositive = pathType === 'accepted';
          
          const connectingEdge = FlowUtils.createEdge(
            newActionNode.id,
            newAddStepNode.id,
            { delay: 15, unit: 'm' },
            isConditional,
            isPositive
          );
          setEdges(edges => [...edges, connectingEdge]);
        }
      }
    } else {
      // This should not happen - all "Add Step" clicks should come from AddStep nodes
      console.warn('Add Step clicked from non-AddStep node:', sourceNodeId);
    }
  }, [actionModalContext, nodes, setNodes, setEdges]);

  const handleSaveDelay = useCallback((newDelay: { delay: number; unit: 'd' | 'm' | 'h' }) => {
    if (!delayModalContext.edgeId) return;

    setEdges(edges => edges.map(edge => {
      if (edge.id === delayModalContext.edgeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            delay: `${newDelay.delay}${newDelay.unit}`,
            delayData: newDelay
          }
        };
      }
      return edge;
    }) as Edge[]);
  }, [delayModalContext.edgeId, setEdges]);

  const handleSaveNodeSettings = useCallback((nodeId: string, newConfig: any) => {
    setNodes(nodes => nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            config: newConfig,
            isConfigured: true
          }
        };
      }
      return node;
    }) as Node[]);
  }, [setNodes]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      const flowData = FlowUtils.exportFlow(nodes as FlowNode[], edges as FlowEdge[]);
      await onSave(flowData);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges]); // Removed onSave from dependencies to prevent infinite loops

  const handleExport = useCallback(() => {
    const flowData = FlowUtils.exportFlow(nodes as FlowNode[], edges as FlowEdge[]);
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `workflow-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const flowData = JSON.parse(e.target?.result as string) as FlowData;
        const { nodes: importedNodes, edges: importedEdges } = FlowUtils.importFlow(flowData);
        setNodes(importedNodes);
        setEdges(importedEdges);
      } catch (error) {
        console.error('Failed to import workflow:', error);
        alert('Failed to import workflow. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  }, [setNodes, setEdges]);

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = FlowUtils.autoLayoutNodes(nodes as FlowNode[], edges as FlowEdge[]);
    setNodes(layoutedNodes as Node[]);
  }, [nodes, edges, setNodes]);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  return (
    <div className={`h-full w-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultMarkerColor="#6B7280"
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6B7280',
          },
        }}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        
        {/* Custom Layout Controls */}
        <Panel position="top-right" className="space-x-2">
          <button
            onClick={handleAutoLayout}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Auto Layout"
          >
            📐 Layout
          </button>
        </Panel>
        
        <MiniMap 
          nodeStrokeColor={(n) => {
            const nodeData = n.data as ActionNodeData;
            return workflowTheme.nodeColors[nodeData.type] || '#6B7280';
          }}
          nodeColor={(n) => {
            const nodeData = n.data as ActionNodeData;
            return `${workflowTheme.nodeColors[nodeData.type] || '#6B7280'}40`;
          }}
          nodeBorderRadius={12}
        />

        {/* Top Toolbar */}
        <Panel position="top-left">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
            <button
              onClick={handleImport}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Import Workflow"
            >
              <Upload size={16} />
              <span>Import</span>
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Export Workflow"
            >
              <Download size={16} />
              <span>Export</span>
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            <button
              onClick={handleSave}
              disabled={isSaving || !onSave}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
              title="Save Workflow"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save</span>
            </button>

            {/* Auto-save indicator */}
            {isAutoSaving && (
              <div className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md">
                <Loader2 size={12} className="animate-spin" />
                <span>Auto-saving...</span>
              </div>
            )}

            {/* Saved indicator */}
            {showSavedIndicator && (
              <div className="flex items-center space-x-1 px-2 py-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
                <Check size={12} />
                <span>Saved</span>
              </div>
            )}

            <button
              onClick={handleAutoLayout}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Auto Layout"
            >
              <RotateCcw size={16} />
              <span>Layout</span>
            </button>
          </div>
        </Panel>

        {/* Validation Status */}
        <Panel position="top-right">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {validationResult.isValid ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Valid Workflow
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-red-500" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    {validationResult.errors.length} Error(s)
                  </span>
                </>
              )}
              
              {validationResult.warnings.length > 0 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  {validationResult.warnings.length} Warning(s)
                </span>
              )}
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Action Selection Modal */}
      <ActionSelectionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSelectAction={handleActionSelect}
        pathType={actionModalContext.pathType}
      />

      {/* Delay Editor Modal */}
      <DelayEditorModal
        isOpen={isDelayModalOpen}
        onClose={() => setIsDelayModalOpen(false)}
        onSave={handleSaveDelay}
        currentDelay={delayModalContext.currentDelay}
        edgeId={delayModalContext.edgeId}
      />

      {/* Node Settings Panel */}
      <NodeSettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
        onSave={handleSaveNodeSettings}
        nodeData={settingsPanelNode}
      />
    </div>
  );
};

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder;
