import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Eye, MessageCircle, UserPlus, Info, Check, Send, UserX } from 'lucide-react';
import { ActionNodeData } from '../types/WorkflowTypes';

interface NodeSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
  nodeData?: ActionNodeData & { id: string };
}

const NodeSettingsPanel: React.FC<NodeSettingsPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  nodeData
}) => {
  const [config, setConfig] = useState<any>({});
  const [previewComment, setPreviewComment] = useState('');

  useEffect(() => {
    if (nodeData?.config) {
      setConfig(nodeData.config);
      if (nodeData.config.customComment) {
        setPreviewComment(nodeData.config.customComment);
      }
    }
  }, [nodeData]);

  const handleSave = () => {
    if (nodeData?.id) {
      onSave(nodeData.id, config);
      onClose();
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const getNodeIcon = () => {
    switch (nodeData?.type) {
      case 'profile_visit':
        return <Eye size={20} className="text-blue-600 dark:text-blue-400" />;
      case 'comment_post':
        return <MessageCircle size={20} className="text-orange-600 dark:text-orange-400" />;
      case 'send_invite':
        return <UserPlus size={20} className="text-green-600 dark:text-green-400" />;
      case 'send_followup':
        return <Send size={20} className="text-purple-600 dark:text-purple-400" />;
      case 'withdraw_request':
        return <UserX size={20} className="text-red-600 dark:text-red-400" />;
      default:
        return <Settings size={20} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const renderVisitProfileConfig = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mx-auto mb-4">
          <Info size={24} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Simple Action
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          This is a simple action that requires no configuration.
        </p>
      </div>
    </div>
  );

  const renderCommentPostConfig = () => (
    <div className="space-y-6">
      {/* Number of Posts */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Number of Posts
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          How many recent posts to comment on
        </p>
        <input
          type="number"
          min="1"
          max="10"
          value={config.postCount || 1}
          onChange={(e) => updateConfig('postCount', parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Recent Post Within */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Recent Post Within (days)
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Only comment on the most recent post
        </p>
        <input
          type="number"
          min="1"
          max="365"
          value={config.recentPostWithin || 15}
          onChange={(e) => updateConfig('recentPostWithin', parseInt(e.target.value) || 15)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Configure with AI */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">Configure with AI</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Let AI help you generate engaging comments
          </p>
        </div>
        <button
          onClick={() => updateConfig('useAI', !config.useAI)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.useAI 
              ? 'bg-blue-600' 
              : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.useAI ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {config.useAI && (
        <>
          {/* Length */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Length
            </label>
            <select
              value={config.length || 'short(1 sentence)'}
              onChange={(e) => updateConfig('length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="short(1 sentence)">Short (1 sentence)</option>
              <option value="medium(2-3 sentences)">Medium (2-3 sentences)</option>
              <option value="long(4+ sentences)">Long (4+ sentences)</option>
            </select>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tone
            </label>
            <select
              value={config.commentTone || 'agreeable'}
              onChange={(e) => updateConfig('commentTone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="agreeable">Agreeable</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="supportive">Supportive</option>
            </select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Language
              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                Beta
              </span>
            </label>
            <select
              value={config.language || 'english'}
              onChange={(e) => updateConfig('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="german">German</option>
            </select>
          </div>

          {/* Custom Guidelines */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Guidelines
            </label>
            <textarea
              value={config.customGuidelines || ''}
              onChange={(e) => updateConfig('customGuidelines', e.target.value)}
              placeholder="Write comments that feel extremely natural, casual, and human — as if a real person is replying on LinkedIn without overthinking it. Avoid sounding like a bot or using generic phrases."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Comment Preview */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Comment Preview
            </label>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">John Doe</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Sep 3, 2023</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {previewComment || config.customComment || "That's so true! Intentional reflection is something I'm trying to implement more often with my team. Thanks for sharing!"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderConnectionRequestConfig = () => (
    <div className="space-y-6">
      {/* Configure with AI */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">Configure with AI</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send a more personalized connection request with AI
          </p>
        </div>
        <button
          onClick={() => updateConfig('useAI', !config.useAI)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.useAI 
              ? 'bg-blue-600' 
              : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.useAI ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Message Variables */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message Variables
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click on these variables to automatically insert personalized placeholders in your message. They'll be replaced with each lead's actual information when the message is sent.
        </p>
        <div className="flex flex-wrap gap-2">
          {['first_name', 'full_name', 'company_name', 'job_title'].map((variable) => (
            <button
              key={variable}
              onClick={() => {
                const currentMessage = config.message || '';
                const newMessage = currentMessage + `[${variable}]`;
                updateConfig('message', newMessage);
              }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-mono transition-colors"
            >
              {variable}
            </button>
          ))}
        </div>
      </div>

      {/* Message Text */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Connection Request Message
        </label>
        <textarea
          value={config.message || ''}
          onChange={(e) => updateConfig('message', e.target.value)}
          placeholder="Hi [first_name], I'm swaraj from Alloroots—India's leading hair restoration clinic. We specialize in safe, natural procedures performed only by M.D. dermatologists from AIIMS (Delhi)."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        />
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            LinkedIn limits connection request messages to 200 characters
          </span>
          <span className={`font-medium ${
            (config.message || '').length > 200 
              ? 'text-red-500' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {(config.message || '').length}/200
          </span>
        </div>
      </div>
    </div>
  );

  const renderSendMessageConfig = () => (
    <div className="space-y-6">
      {/* Configure with AI */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">AI Writing Assistant</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Let AI help you write a personalized message
          </p>
        </div>
        <button
          onClick={() => updateConfig('useAI', !config.useAI)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.useAI 
              ? 'bg-blue-600' 
              : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.useAI ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {config.useAI && (
        <>
          {/* Message Length */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message Length
            </label>
            <select
              value={config.messageLength || 'medium'}
              onChange={(e) => updateConfig('messageLength', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tone
            </label>
            <select
              value={config.tone || 'casual'}
              onChange={(e) => updateConfig('tone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">formal</option>
            </select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Language
            </label>
            <select
              value={config.language || 'english'}
              onChange={(e) => updateConfig('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="german">German</option>
            </select>
          </div>

          {/* Custom Guidelines */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Guidelines
            </label>
            <textarea
              value={config.customGuidelines || ''}
              onChange={(e) => updateConfig('customGuidelines', e.target.value)}
              placeholder="Add specific instructions for AI message generation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>
        </>
      )}

      {/* Message Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Message Content
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Craft your message manually
          </span>
        </div>
        <div className="space-y-2">
          <textarea
            value={config.message || ''}
            onChange={(e) => updateConfig('message', e.target.value)}
            placeholder="Write your personalized message here..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-500 dark:text-gray-400">
              Click on variables to insert: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">first_name</span>, <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">company_name</span>, <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">job_title</span>
            </div>
            <span className={`${
              (config.message || '').length > 1000 
                ? 'text-red-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {(config.message || '').length}/1000
            </span>
          </div>
        </div>
      </div>

      {/* Message Variables */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message Variables
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Click on these variables to automatically insert personalized placeholders in your message.
        </p>
        <div className="flex flex-wrap gap-2">
          {['first_name', 'full_name', 'company_name', 'job_title'].map((variable) => (
            <button
              key={variable}
              onClick={() => {
                const currentMessage = config.message || '';
                const newMessage = currentMessage + `[${variable}]`;
                updateConfig('message', newMessage);
              }}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-mono"
            >
              {variable}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Follow-up */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">Smart Follow-up</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Will only send if they haven't replied to you yet
          </p>
        </div>
        <button
          onClick={() => updateConfig('isFollowUp', !config.isFollowUp)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.isFollowUp 
              ? 'bg-blue-600' 
              : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.isFollowUp ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderWithdrawRequestConfig = () => (
    <div className="p-6 text-center text-gray-600 dark:text-gray-400">
      <Info size={24} className="mx-auto mb-3" />
      <p className="text-lg font-semibold">No Configuration Needed</p>
      <p className="text-sm">This action simply withdraws the pending connection request.</p>
    </div>
  );

  const renderConfigContent = () => {
    switch (nodeData?.type) {
      case 'profile_visit':
        return renderVisitProfileConfig();
      case 'comment_post':
        return renderCommentPostConfig();
      case 'send_invite':
        return renderConnectionRequestConfig();
      case 'send_followup':
        return renderSendMessageConfig();
      case 'withdraw_request':
        return renderWithdrawRequestConfig();
      default:
        return renderVisitProfileConfig();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && nodeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white dark:bg-gray-800 h-full w-full max-w-md shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {getNodeIcon()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Configure Action
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {nodeData.label}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderConfigContent()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
              >
                <Check size={16} />
                <span>Done</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NodeSettingsPanel;
