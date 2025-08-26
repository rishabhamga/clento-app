import { FlowNode, FlowEdge, FlowData, ActionNodeData, DelayData } from '../types/WorkflowTypes';
import { actionDefinitions } from './ActionDefinitions';

export class FlowUtils {
  // Generate unique node ID
  static generateNodeId(type: string): string {
    return `${type}-${Date.now()}`;
  }

  // Generate unique edge ID
  static generateEdgeId(source: string, target: string): string {
    return `e-${source}-${target}`;
  }

  // Create a new action node
  static createActionNode(
    type: string,
    position: { x: number; y: number },
    pathType?: 'accepted' | 'not-accepted'
  ): FlowNode {
    const actionDef = actionDefinitions.find(a => a.type === type);
    if (!actionDef) {
      throw new Error(`Unknown action type: ${type}`);
    }

    return {
      id: this.generateNodeId(type),
      type: 'action',
      position,
      data: {
        type: type as any,
        label: actionDef.label,
        isConfigured: true, // Set to true by default to avoid warnings
        config: { ...actionDef.defaultConfig },
        pathType
      },
      measured: {
        width: 220,
        height: 54
      },
      selected: false
    };
  }

  // Create an add step node
  static createAddStepNode(
    position: { x: number; y: number },
    pathType?: 'accepted' | 'not-accepted'
  ): FlowNode {
    return {
      id: this.generateNodeId('add-step'),
      type: 'addStep',
      position,
      data: {
        pathType
      },
      measured: {
        width: 220,
        height: 40
      }
    };
  }

  // Create a standard edge
  static createEdge(
    source: string,
    target: string,
    delay: DelayData = { delay: 15, unit: 'm' },
    isConditional = false,
    isPositive?: boolean
  ): FlowEdge {
    return {
      id: this.generateEdgeId(source, target),
      source,
      target,
      type: isConditional ? 'conditional' : 'buttonedge',
      animated: true,
      data: {
        delay: `${delay.delay}${delay.unit}`,
        delayData: delay,
        isPositive,
        isConditionalPath: isConditional
      }
    };
  }

  // Format delay for display
  static formatDelay(delayData: DelayData): string {
    const unitMap = {
      'm': delayData.delay === 1 ? 'minute' : 'minutes',
      'h': delayData.delay === 1 ? 'hour' : 'hours',
      'd': delayData.delay === 1 ? 'day' : 'days'
    };
    
    return `${delayData.delay} ${unitMap[delayData.unit]}`;
  }

  // Parse delay string to DelayData
  static parseDelay(delayString: string): DelayData {
    const match = delayString.match(/^(\d+)([mhd])$/);
    if (!match) {
      return { delay: 15, unit: 'm' };
    }
    
    return {
      delay: parseInt(match[1]),
      unit: match[2] as 'm' | 'h' | 'd'
    };
  }

  // Get node position for new nodes
  static getNextNodePosition(
    nodes: FlowNode[],
    sourceNodeId?: string,
    pathType?: 'accepted' | 'not-accepted'
  ): { x: number; y: number } {
    if (!sourceNodeId) {
      // First node
      return { x: 100, y: 0 };
    }

    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) {
      return { x: 100, y: 0 };
    }

    const baseY = sourceNode.position.y + 150;
    
    if (pathType === 'accepted') {
      return { x: sourceNode.position.x + 200, y: baseY };
    } else if (pathType === 'not-accepted') {
      return { x: sourceNode.position.x - 200, y: baseY };
    } else {
      // Standard sequential flow
      return { x: sourceNode.position.x, y: baseY };
    }
  }

  // Check if node has conditional branching
  static hasConditionalBranching(nodeData: ActionNodeData): boolean {
    const actionDef = actionDefinitions.find(a => a.type === nodeData.type);
    return actionDef?.hasConditionalBranching || false;
  }

  // Get outgoing edges for a node
  static getOutgoingEdges(nodeId: string, edges: FlowEdge[]): FlowEdge[] {
    return edges.filter(edge => edge.source === nodeId);
  }

  // Get incoming edges for a node
  static getIncomingEdges(nodeId: string, edges: FlowEdge[]): FlowEdge[] {
    return edges.filter(edge => edge.target === nodeId);
  }

  // Check if node can be deleted
  static canDeleteNode(nodeId: string, nodes: FlowNode[], edges: FlowEdge[]): boolean {
    // Don't allow deletion if it would create orphaned nodes
    const outgoingEdges = this.getOutgoingEdges(nodeId, edges);
    const incomingEdges = this.getIncomingEdges(nodeId, edges);
    
    // If this node has both incoming and outgoing edges, deletion would break the flow
    if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
      return false;
    }
    
    return true;
  }

  // Auto-layout nodes
  static autoLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    // Simple vertical layout - can be enhanced with more sophisticated algorithms
    const layoutNodes = [...nodes];
    const visited = new Set<string>();
    const positioned = new Map<string, { x: number; y: number }>();
    
    // Find root nodes (no incoming edges)
    const rootNodes = layoutNodes.filter(node => 
      !edges.some(edge => edge.target === node.id)
    );
    
    let currentY = 0;
    const nodeSpacing = 150;
    
    const layoutBranch = (nodeId: string, x: number, y: number) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      positioned.set(nodeId, { x, y });
      
      const outgoingEdges = this.getOutgoingEdges(nodeId, edges);
      const childNodes = outgoingEdges.map(edge => edge.target);
      
      childNodes.forEach((childId, index) => {
        const childX = x + (index - (childNodes.length - 1) / 2) * 250;
        const childY = y + nodeSpacing;
        layoutBranch(childId, childX, childY);
      });
    };
    
    // Layout each root node
    rootNodes.forEach((rootNode, index) => {
      layoutBranch(rootNode.id, index * 300, currentY);
    });
    
    // Apply positions
    return layoutNodes.map(node => ({
      ...node,
      position: positioned.get(node.id) || node.position
    }));
  }

  // Export flow to JSON (matching sample-flow.json format exactly)
  static exportFlow(nodes: FlowNode[], edges: FlowEdge[]): FlowData {
    return {
      nodes,
      edges,
      timestamp: new Date().toISOString()
    };
  }

  // Auto-layout nodes for better positioning
  static autoLayoutNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    const layoutNodes = [...nodes];
    const nodeSpacing = { x: 300, y: 150 };
    const startPosition = { x: 100, y: 50 };

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = layoutNodes.filter(node => 
      !edges.some(edge => edge.target === node.id)
    );

    // Build adjacency list
    const adjacencyList: Record<string, string[]> = {};
    edges.forEach(edge => {
      if (!adjacencyList[edge.source]) {
        adjacencyList[edge.source] = [];
      }
      adjacencyList[edge.source].push(edge.target);
    });

    // Track positioned nodes and their levels
    const positioned = new Set<string>();
    const levels: Record<string, number> = {};

    // BFS to assign levels
    const queue = rootNodes.map(node => ({ id: node.id, level: 0 }));
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      
      if (positioned.has(id)) continue;
      
      levels[id] = level;
      positioned.add(id);
      
      // Add children to queue
      if (adjacencyList[id]) {
        adjacencyList[id].forEach(childId => {
          if (!positioned.has(childId)) {
            queue.push({ id: childId, level: level + 1 });
          }
        });
      }
    }

    // Group nodes by level
    const nodesByLevel: Record<number, FlowNode[]> = {};
    layoutNodes.forEach(node => {
      const level = levels[node.id] || 0;
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }
      nodesByLevel[level].push(node);
    });

    // Position nodes level by level
    Object.keys(nodesByLevel).forEach(levelStr => {
      const level = parseInt(levelStr);
      const nodesAtLevel = nodesByLevel[level];
      
      // Handle conditional branching (accepted/not-accepted paths)
      const acceptedNodes = nodesAtLevel.filter(node => 
        node.data.pathType === 'accepted' || !node.data.pathType
      );
      const notAcceptedNodes = nodesAtLevel.filter(node => 
        node.data.pathType === 'not-accepted'
      );

      // Position accepted path nodes (center-right)
      acceptedNodes.forEach((node, index) => {
        const totalWidth = (acceptedNodes.length - 1) * nodeSpacing.x;
        const startX = startPosition.x - totalWidth / 2;
        
        node.position = {
          x: startX + index * nodeSpacing.x,
          y: startPosition.y + level * nodeSpacing.y
        };
      });

      // Position not-accepted path nodes (left side)
      notAcceptedNodes.forEach((node, index) => {
        node.position = {
          x: startPosition.x - 200 - index * nodeSpacing.x,
          y: startPosition.y + level * nodeSpacing.y
        };
      });
    });

    return layoutNodes;
  }

  // Import flow from JSON
  static importFlow(flowData: FlowData): { nodes: FlowNode[]; edges: FlowEdge[] } {
    return {
      nodes: flowData.nodes,
      edges: flowData.edges
    };
  }

  // Validate flow structure
  static validateFlow(nodes: FlowNode[], edges: FlowEdge[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for orphaned nodes
    const connectedNodeIds = new Set([
      ...edges.map(e => e.source),
      ...edges.map(e => e.target)
    ]);
    
    const orphanedNodes = nodes.filter(node => 
      node.type === 'action' && !connectedNodeIds.has(node.id) && nodes.length > 1
    );
    
    if (orphanedNodes.length > 0) {
      warnings.push(`Found ${orphanedNodes.length} orphaned node(s)`);
    }
    
    // Check for unconfigured nodes
    const unconfiguredNodes = nodes.filter(node => 
      node.type === 'action' && !(node.data as ActionNodeData).isConfigured
    );
    
    if (unconfiguredNodes.length > 0) {
      warnings.push(`Found ${unconfiguredNodes.length} unconfigured node(s)`);
    }
    
    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const outgoingEdges = this.getOutgoingEdges(nodeId, edges);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) return true;
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const node of nodes) {
      if (hasCycle(node.id)) {
        errors.push('Circular dependency detected in workflow');
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
