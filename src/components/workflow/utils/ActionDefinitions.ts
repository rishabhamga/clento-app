import { ActionDefinition, WorkflowTheme } from '../types/WorkflowTypes';

export const workflowTheme: WorkflowTheme = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  glassBg: 'rgba(255, 255, 255, 0.9)',
  darkGlassBg: 'rgba(26, 32, 44, 0.9)',
  borderColor: 'rgba(255, 255, 255, 0.2)',
  accentGradient: 'linear-gradient(45deg, #667eea, #764ba2)',
  nodeColors: {
    profile_visit: '#4F46E5',
    like_post: '#EF4444',
    comment_post: '#F59E0B',
    send_inmail: '#0EA5E9',
    send_invite: '#10B981',
    send_followup: '#8B5CF6',
    follow_profile: '#F97316',
    follow_company: '#EC4899',
    notify_webhook: '#6B7280',
    withdraw_request: '#DC2626'
  }
};

export const actionDefinitions: ActionDefinition[] = [
  {
    type: 'profile_visit',
    label: 'Visit Profile',
    description: 'View prospect\'s LinkedIn profile',
    icon: 'Eye',
    color: workflowTheme.nodeColors.profile_visit,
    category: 'engagement',
    defaultConfig: {}
  },
  {
    type: 'like_post',
    label: 'Like Recent Post',
    description: 'Like prospect\'s most recent post',
    icon: 'Heart',
    color: workflowTheme.nodeColors.like_post,
    category: 'engagement',
    defaultConfig: {
      postCount: 1,
      recentPostWithin: 7
    }
  },
  {
    type: 'comment_post',
    label: 'Comment on Post',
    description: 'Comment on prospect\'s recent post',
    icon: 'MessageCircle',
    color: workflowTheme.nodeColors.comment_post,
    category: 'engagement',
    defaultConfig: {
      useAI: true,
      language: 'english',
      length: 'medium(2-3 sentences)',
      commentTone: 'agreeable',
      customGuidelines: '',
      postCount: 1,
      recentPostWithin: 7
    }
  },
  {
    type: 'send_inmail',
    label: 'Send InMail',
    description: 'Send an InMail message to prospect',
    icon: 'Mail',
    color: workflowTheme.nodeColors.send_inmail,
    category: 'connection',
    defaultConfig: {
      useAI: true,
      messageLength: 'medium(100-200 words)',
      tone: 'friendly',
      language: 'english',
      purpose: 'networking'
    }
  },
  {
    type: 'send_invite',
    label: 'Connection Request',
    description: 'Send a connection request',
    icon: 'UserPlus',
    color: workflowTheme.nodeColors.send_invite,
    category: 'connection',
    hasConditionalBranching: true,
    defaultConfig: {
      useAI: true,
      tone: 'warm',
      formality: 'casual',
      approach: 'direct',
      focus: 'personal',
      intention: 'networking',
      callToAction: 'subtle',
      personalization: 'specific',
      language: 'english',
      mentionPost: false,
      customGuidelines: ''
    }
  },
  {
    type: 'send_followup',
    label: 'Send Message',
    description: 'Send a personalized message to your connection',
    icon: 'Send',
    color: workflowTheme.nodeColors.send_followup,
    category: 'follow-up',
    defaultConfig: {
      useAI: true,
      isFollowUp: true,
      mentionPost: false,
      language: 'english',
      messageLength: 'medium',
      tone: 'casual',
      customGuidelines: ''
    }
  },
  {
    type: 'follow_profile',
    label: 'Follow Profile',
    description: 'Follow the prospect\'s profile',
    icon: 'UserCheck',
    color: workflowTheme.nodeColors.follow_profile,
    category: 'engagement',
    defaultConfig: {}
  },
  {
    type: 'follow_company',
    label: 'Follow Company',
    description: 'Follow the prospect\'s company',
    icon: 'Building',
    color: workflowTheme.nodeColors.follow_company,
    category: 'engagement',
    defaultConfig: {}
  },
  {
    type: 'notify_webhook',
    label: 'Notify Webhook',
    description: 'Send webhook notification',
    icon: 'Webhook',
    color: workflowTheme.nodeColors.notify_webhook,
    category: 'integrations',
    defaultConfig: {
      typeId: 'webhook',
      integrationId: '',
      targetUrl: '',
      integrationName: '',
      timeDelay: {
        value: 0,
        unit: 'minutes'
      }
    }
  },
  {
    type: 'withdraw_request',
    label: 'Withdraw Request',
    description: 'Withdraw pending connection request',
    icon: 'UserMinus',
    color: workflowTheme.nodeColors.withdraw_request,
    category: 'connection',
    defaultConfig: {}
  }
];

export const getActionDefinition = (type: string): ActionDefinition | undefined => {
  return actionDefinitions.find(action => action.type === type);
};

export const getActionsByCategory = (category: string): ActionDefinition[] => {
  return actionDefinitions.filter(action => action.category === category);
};

export const actionCategories = [
  { key: 'engagement', label: 'Engagement', description: 'Profile visits, likes, and follows' },
  { key: 'connection', label: 'Connection', description: 'Connection requests and management' },
  { key: 'follow-up', label: 'Follow-up', description: 'Messages and follow-up sequences' },
  { key: 'integrations', label: 'Integrations', description: 'Webhooks and external integrations' }
];
