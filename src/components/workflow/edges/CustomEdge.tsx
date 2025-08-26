import React, { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { FlowEdge } from '../types/WorkflowTypes';
import { FlowUtils } from '../utils/FlowUtils';

const CustomEdge = memo(({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition,
  data,
  selected
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate center position for delay label
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  const delayData = data?.delayData as { delay: number; unit: 'd' | 'm' | 'h' } | undefined;
  const isConditional = data?.isConditionalPath;
  const isPositive = data?.isPositive;

  // Edge styling based on type
  const getEdgeColor = () => {
    if (isConditional) {
      return isPositive ? '#10B981' : '#EF4444'; // Green for accepted, red for not accepted
    }
    return '#10B981'; // Default green for main flow
  };

  const getEdgeStyle = () => ({
    stroke: getEdgeColor(),
    strokeWidth: selected ? 4 : 3,
    strokeDasharray: isConditional ? (isPositive ? '8,4' : '4,4') : 'none',
    strokeLinecap: 'round' as const,
    filter: selected ? 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' : 'none',
  });

  const handleDelayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Emit custom event to edit delay
    window.dispatchEvent(new CustomEvent('editEdgeDelay', { 
      detail: { edgeId: id, currentDelay: delayData } 
    }));
  };

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={getEdgeStyle()}
        markerEnd="url(#arrowhead)"
      />
      
      {/* Delay Label */}
      <EdgeLabelRenderer>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute pointer-events-auto z-10"
          style={{
            left: centerX,
            top: centerY,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <button
            onClick={handleDelayClick}
            className={`
              flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
              bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-all
              ${selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
            `}
            style={{
              borderColor: getEdgeColor(),
              color: getEdgeColor()
            }}
          >
            <Clock size={10} />
            <span>{delayData ? FlowUtils.formatDelay(delayData) : '0m'}</span>
          </button>
        </motion.div>
      </EdgeLabelRenderer>

      {/* Path Type Label for Conditional Edges */}
      {isConditional && (
        <EdgeLabelRenderer>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none z-10"
            style={{
              left: centerX,
              top: centerY - 25,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={`
              px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border-2
              ${isPositive 
                ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700' 
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700'
              }
            `}>
              {isPositive ? '✓ Accepted' : '✗ Not Accepted'}
            </div>
          </motion.div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';

export default CustomEdge;
