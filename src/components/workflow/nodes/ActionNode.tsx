import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Trash2, 
  Check, 
  Eye,
  Heart,
  MessageCircle,
  Mail,
  UserPlus,
  Send,
  UserCheck,
  Building,
  Webhook,
  UserMinus,
  Plus
} from 'lucide-react';
import { ActionNodeData } from '../types/WorkflowTypes';
import { workflowTheme } from '../utils/ActionDefinitions';
import ButtonHandle from '../handles/ButtonHandle';

const iconMap = {
  profile_visit: Eye,
  like_post: Heart,
  comment_post: MessageCircle,
  send_inmail: Mail,
  send_invite: UserPlus,
  send_followup: Send,
  follow_profile: UserCheck,
  follow_company: Building,
  notify_webhook: Webhook,
  withdraw_request: UserMinus
};

interface ActionNodeProps {
  id: string;
  data: ActionNodeData;
  selected: boolean;
}

const ActionNode = memo(({ id, data, selected }: ActionNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = iconMap[data.type] || Settings;
  const nodeColor = workflowTheme.nodeColors[data.type] || '#6B7280';

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Emit custom event to open settings panel
    window.dispatchEvent(new CustomEvent('openNodeSettings', { 
      detail: { nodeId: id } 
    }));
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Emit custom event to delete node
    window.dispatchEvent(new CustomEvent('deleteNode', { 
      detail: { nodeId: id } 
    }));
  };

  const nodeVariants = {
    initial: { scale: 0, opacity: 0, y: 20 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    hover: { 
      scale: 1.02, 
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600 transition-colors"
        style={{ 
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />

      <motion.div
        variants={nodeVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className={`
          relative group w-[220px] h-[70px] rounded-xl overflow-hidden
          ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        `}
        style={{
          background: `linear-gradient(135deg, ${nodeColor}15 0%, ${nodeColor}25 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${nodeColor}40`
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient Border Effect */}
        <div 
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${nodeColor}40 0%, ${nodeColor}60 100%)`,
            padding: '1px'
          }}
        >
          <div 
            className="w-full h-full rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${nodeColor}15 0%, ${nodeColor}25 100%)`
            }}
          />
        </div>

        {/* Node Content */}
        <div className="relative px-4 py-3 flex items-center justify-between h-full">
          <div className="flex items-center space-x-3">
            {/* Icon */}
            <div 
              className="p-2 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${nodeColor}20` }}
            >
              <IconComponent 
                size={20} 
                style={{ color: nodeColor }}
              />
            </div>

            {/* Label and Subtitle */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {data.label}
              </span>
              {data.subtitle && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {data.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center space-x-2">
            {/* Configuration Status */}
            {data.isConfigured && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-1 rounded-full bg-green-100 dark:bg-green-900"
              >
                <Check size={12} className="text-green-600 dark:text-green-400" />
              </motion.div>
            )}

            {/* Action Buttons (visible on hover) */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : 10
              }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-1"
            >
              <button
                onClick={handleSettingsClick}
                className="p-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                title="Configure"
              >
                <Settings size={14} className="text-gray-600 dark:text-gray-400" />
              </button>
              
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
                title="Delete"
              >
                <Trash2 size={14} className="text-gray-600 dark:text-gray-400 hover:text-red-500" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Path Type Indicator */}
        {data.pathType && (
          <div className="absolute -top-2 -right-2">
            <div className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${data.pathType === 'accepted' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }
            `}>
              {data.pathType === 'accepted' ? 'Accepted' : 'Not Accepted'}
            </div>
          </div>
        )}
      </motion.div>

      {/* Output Handle - Single central handle for all nodes */}
      <ButtonHandle
        type="source"
        position={Position.Bottom}
        handleClassName={`w-4 h-4 border-2 border-white transition-colors ${
          data.type === 'send_invite' 
            ? 'bg-purple-500 hover:bg-purple-600' // Special color for conditional nodes
            : 'bg-gray-400 hover:bg-gray-600'    // Standard color for regular nodes
        }`}
        style={{ 
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
        showButton={false}
      />
    </>
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode;
