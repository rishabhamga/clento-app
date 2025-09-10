import React from 'react';
import { Handle, Position, HandleProps } from '@xyflow/react';
import { motion } from 'framer-motion';

interface ButtonHandleProps extends Omit<HandleProps, 'children'> {
  children?: React.ReactNode;
  showButton?: boolean;
  buttonClassName?: string;
  handleClassName?: string;
}

const ButtonHandle: React.FC<ButtonHandleProps> = ({
  children,
  showButton = true,
  buttonClassName = '',
  handleClassName = '',
  className,
  style,
  ...handleProps
}) => {
  return (
    <Handle
      className={`${handleClassName} ${className || ''}`}
      style={style}
      {...handleProps}
    >
      {showButton && children && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`absolute inset-0 flex items-center justify-center ${buttonClassName}`}
          style={{
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
          }}
        >
          {children}
        </motion.div>
      )}
    </Handle>
  );
};

export default ButtonHandle;
