import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, MessageCircle, Clock, Hash } from 'lucide-react';
import { CommentPostConfig } from '../../types/WorkflowTypes';

interface CommentPostSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CommentPostConfig) => void;
  initialConfig: CommentPostConfig;
}

const CommentPostSettings: React.FC<CommentPostSettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<CommentPostConfig>(initialConfig);
  const [previewComment, setPreviewComment] = useState('');

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleConfigChange = (key: keyof CommentPostConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generatePreview = () => {
    if (config.useAI) {
      setPreviewComment("Great insights! This really resonates with my experience in the industry. Thanks for sharing! 👍");
    } else {
      setPreviewComment(config.customComment || "Please enter a custom comment");
    }
  };

  useEffect(() => {
    generatePreview();
  }, [config.useAI, config.customComment, config.commentTone, config.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <MessageCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Comment on Post
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure how comments will be generated and posted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Configuration Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-purple-500" />
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Configure with AI
                </label>
              </div>
              <button
                onClick={() => handleConfigChange('useAI', !config.useAI)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.useAI ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.useAI ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Let AI generate engaging comments based on your guidelines
            </p>
          </div>

          {config.useAI ? (
            /* AI Configuration */
            <div className="space-y-6">
              {/* Comment Length */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Length
                </label>
                <select
                  value={config.length}
                  onChange={(e) => handleConfigChange('length', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="short(1 sentence)">Short (1 sentence)</option>
                  <option value="medium(2-3 sentences)">Medium (2-3 sentences)</option>
                  <option value="long(4+ sentences)">Long (4+ sentences)</option>
                </select>
              </div>

              {/* Comment Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Tone
                </label>
                <select
                  value={config.commentTone}
                  onChange={(e) => handleConfigChange('commentTone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="agreeable">Agreeable</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="thoughtful">Thoughtful</option>
                  <option value="supportive">Supportive</option>
                  <option value="curious">Curious</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Language
                </label>
                <select
                  value={config.language}
                  onChange={(e) => handleConfigChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                  <option value="italian">Italian</option>
                  <option value="portuguese">Portuguese</option>
                </select>
              </div>

              {/* Custom Guidelines */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Custom Guidelines
                </label>
                <textarea
                  value={config.customGuidelines}
                  onChange={(e) => handleConfigChange('customGuidelines', e.target.value)}
                  placeholder="Example: I want to acknowledge their insights and add value by sharing relevant experience. Focus on being supportive and constructive while maintaining a professional tone."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Provide specific instructions for how AI should generate comments
                </p>
              </div>
            </div>
          ) : (
            /* Manual Configuration */
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Custom Comment
              </label>
              <textarea
                value={config.customComment || ''}
                onChange={(e) => handleConfigChange('customComment', e.target.value)}
                placeholder="Write your custom comment here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This comment will be posted on the prospect's recent posts
              </p>
            </div>
          )}

          {/* Post Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Hash size={14} className="inline mr-1" />
                Number of Posts
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={config.postCount}
                onChange={(e) => handleConfigChange('postCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How many recent posts to comment on
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Clock size={14} className="inline mr-1" />
                Recent Post Within (days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={config.recentPostWithin}
                onChange={(e) => handleConfigChange('recentPostWithin', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only comment on the most recent post
              </p>
            </div>
          </div>

          {/* Comment Preview */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MessageCircle size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Comment Preview
              </span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  You
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {previewComment}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    2w • Edited
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CommentPostSettings;
