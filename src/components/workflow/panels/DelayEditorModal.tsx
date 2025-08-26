import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Check, AlertTriangle } from 'lucide-react';

interface DelayData {
  delay: number;
  unit: 'd' | 'm' | 'h';
}

interface DelayEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (delay: DelayData) => void;
  currentDelay?: DelayData;
  edgeId?: string;
}

const DelayEditorModal: React.FC<DelayEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentDelay,
  edgeId
}) => {
  const [delay, setDelay] = useState(currentDelay?.delay || 15);
  const [unit, setUnit] = useState<'d' | 'm' | 'h'>(currentDelay?.unit || 'm');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (currentDelay) {
      setDelay(currentDelay.delay);
      setUnit(currentDelay.unit);
    }
  }, [currentDelay]);

  // Convert delay to minutes for validation
  const convertToMinutes = (delayValue: number, unitValue: 'd' | 'm' | 'h'): number => {
    switch (unitValue) {
      case 'm': return delayValue;
      case 'h': return delayValue * 60;
      case 'd': return delayValue * 24 * 60;
      default: return delayValue;
    }
  };

  // Validate delay constraints
  const validateDelay = (delayValue: number, unitValue: 'd' | 'm' | 'h'): string => {
    const totalMinutes = convertToMinutes(delayValue, unitValue);
    const minMinutes = 15; // 15 minutes minimum
    const maxMinutes = 7 * 24 * 60; // 7 days maximum

    if (totalMinutes < minMinutes) {
      return 'Minimum delay is 15 minutes';
    }
    if (totalMinutes > maxMinutes) {
      return 'Maximum delay is 7 days';
    }
    return '';
  };

  // Handle delay change with validation
  const handleDelayChange = (newDelay: number) => {
    setDelay(newDelay);
    const validationError = validateDelay(newDelay, unit);
    setError(validationError);
  };

  // Handle unit change with validation
  const handleUnitChange = (newUnit: 'd' | 'm' | 'h') => {
    setUnit(newUnit);
    const validationError = validateDelay(delay, newUnit);
    setError(validationError);
  };

  const handleSave = () => {
    const validationError = validateDelay(delay, unit);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave({ delay, unit });
    onClose();
  };

  const unitLabels = {
    'm': 'Minutes',
    'h': 'Hours', 
    'd': 'Days'
  };

  const formatPreview = () => {
    if (delay === 1) {
      return `${delay} ${unitLabels[unit].slice(0, -1)}`;
    }
    return `${delay} ${unitLabels[unit]}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Set Delay
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure the time delay for this step
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Delay Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Delay Amount
                </label>
                <input
                  type="number"
                  min="1"
                  max="10080" // 7 days in minutes
                  value={delay}
                  onChange={(e) => handleDelayChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`
                    w-full px-4 py-3 rounded-xl transition-all
                    ${error 
                      ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }
                    focus:ring-4 focus:outline-none
                    bg-white/50 backdrop-blur-sm text-gray-900 dark:text-white
                  `}
                  placeholder="Enter delay amount"
                />
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-red-600 text-sm"
                  >
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Unit Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Time Unit
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(unitLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleUnitChange(key as 'd' | 'm' | 'h')}
                      className={`
                        px-4 py-3 rounded-xl border-2 transition-all font-medium
                        ${unit === key
                          ? 'border-blue-500 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                        }
                      `}
                      style={{
                        background: unit === key 
                          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                          : 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl" style={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Wait {formatPreview()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/20">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-white/10 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!!error}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-xl transition-all font-medium
                  ${error 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'text-white hover:shadow-lg transform hover:scale-105'
                  }
                `}
                style={{
                  background: error 
                    ? '#9CA3AF' 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: error 
                    ? 'none' 
                    : '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
              >
                <Check size={16} />
                <span>Save Delay</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DelayEditorModal;
