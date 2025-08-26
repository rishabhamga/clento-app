import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { AddStepNodeData } from '../types/WorkflowTypes';
import ButtonHandle from '../handles/ButtonHandle';

interface AddStepNodeProps {
  id: string;
  data: AddStepNodeData;
}

const AddStepNode = memo(({ id, data }: AddStepNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleAddStepClick = () => {
    // Emit custom event to show action selection modal
    window.dispatchEvent(new CustomEvent('showActionSelection', { 
      detail: { 
        sourceNodeId: id,
        pathType: data.pathType,
        replaceAddStep: true
      } 
    }));
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  return (
    <>
      {/* Input Handle */}
      <ButtonHandle
        type="target"
        position={Position.Top}
        handleClassName="w-4 h-4 border-2 border-white bg-gray-400 hover:bg-gray-600 transition-colors"
        style={{ 
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
        showButton={false}
      />

      <motion.div
        className="relative flex items-center justify-center w-[220px] h-[40px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.button
          variants={isHovered ? buttonVariants : pulseVariants}
          initial="initial"
          animate={isHovered ? "hover" : "animate"}
          whileTap="tap"
          onClick={handleAddStepClick}
          className={`
            flex items-center justify-center space-x-2 px-4 py-2 rounded-full
            bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
            text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300
            border border-white/20 backdrop-blur-sm
            ${data.pathType ? 'ring-2 ring-offset-2 ' + 
              (data.pathType === 'accepted' ? 'ring-green-400' : 'ring-red-400') : ''}
          `}
        >
          <Plus size={16} />
          <span className="text-sm">Add Step</span>
        </motion.button>

        {/* Path Type Indicator */}
        {data.pathType && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <div className={`
              px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
              ${data.pathType === 'accepted' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }
            `}>
              {data.pathType === 'accepted' ? 'Accepted Path' : 'Not Accepted Path'}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
});

AddStepNode.displayName = 'AddStepNode';

export default AddStepNode;
