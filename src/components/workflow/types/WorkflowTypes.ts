import { Node, Edge } from '@xyflow/react';

// Base workflow data structure matching sample-flow.json exactly
export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  timestamp: string;
}

// Extended interface for internal storage with metadata
export interface FlowDataWithMetadata extends FlowData {
  id?: string; // Unique flow ID for GCS storage
  version?: number; // Version for future migrations
  campaignId?: string; // Associated campaign ID
}

// Node types
export type NodeType = 'action' | 'addStep';
export type ActionType = 
  | 'profile_visit'
  | 'like_post' 
  | 'comment_post'
  | 'send_inmail'
  | 'send_invite'
  | 'send_followup'
  | 'follow_profile'
  | 'follow_company'
  | 'notify_webhook'
  | 'withdraw_request';

export type PathType = 'accepted' | 'not-accepted';

// Node data structure (compatible with React Flow)
export interface ActionNodeData extends Record<string, unknown> {
  type: ActionType;
  label: string;
  isConfigured: boolean;
  config: Record<string, any>;
  pathType?: PathType;
  integrationLogoUrl?: string;
  subtitle?: string;
}

export interface AddStepNodeData extends Record<string, unknown> {
  pathType?: PathType;
}

export type NodeData = ActionNodeData | AddStepNodeData;

// Flow node structure (matching sample-flow.json exactly)
export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  measured?: { width: number; height: number };
  selected?: boolean;
}

// Edge types
export type EdgeType = 'buttonedge' | 'conditional';

export interface DelayData {
  delay: number;
  unit: 'm' | 'h' | 'd';
}

export interface EdgeData extends Record<string, unknown> {
  delay?: string;
  delayData?: DelayData;
  isPositive?: boolean;
  isConditionalPath?: boolean;
}

// Flow edge structure (matching sample-flow.json exactly)
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  animated?: boolean;
  data?: EdgeData;
  selected?: boolean;
}

// Action configurations
export interface VisitProfileConfig {
  // No specific config needed
}

export interface LikePostConfig {
  postCount: number;
  recentPostWithin: number; // days
}

export interface CommentPostConfig {
  useAI: boolean;
  language: string;
  length: string;
  commentTone: string;
  customGuidelines: string;
  postCount: number;
  recentPostWithin: number;
  customComment?: string;
}

export interface SendInMailConfig {
  useAI: boolean;
  messageLength: string;
  tone: string;
  language: string;
  purpose: string;
  customMessage?: string;
}

export interface ConnectionRequestConfig {
  useAI: boolean;
  tone: string;
  formality: string;
  approach: string;
  focus: string;
  intention: string;
  callToAction: string;
  personalization: string;
  language: string;
  mentionPost: boolean;
  customGuidelines: string;
  message?: string;
}

export interface SendMessageConfig {
  useAI: boolean;
  isFollowUp: boolean;
  mentionPost: boolean;
  language: string;
  messageLength: string;
  tone: string;
  customGuidelines: string;
  message?: string;
}

export interface WebhookConfig {
  typeId: string;
  integrationId: string;
  targetUrl: string;
  integrationName: string;
  timeDelay: {
    value: number;
    unit: string;
  };
}

// Action definitions
export interface ActionDefinition {
  type: ActionType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: 'engagement' | 'connection' | 'follow-up' | 'integrations';
  hasConditionalBranching?: boolean;
  defaultConfig: Record<string, any>;
}

// Workflow theme
export interface WorkflowTheme {
  primary: string;
  glassBg: string;
  darkGlassBg: string;
  borderColor: string;
  accentGradient: string;
  nodeColors: Record<ActionType, string>;
}

// Settings panel props
export interface SettingsPanelProps {
  nodeId: string;
  nodeData: ActionNodeData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

// Flow validation
export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  type: 'error' | 'warning';
  message: string;
}

export interface FlowValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
