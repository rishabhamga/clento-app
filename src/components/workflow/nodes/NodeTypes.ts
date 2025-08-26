import { NodeTypes } from '@xyflow/react';
import ActionNode from './ActionNode';
import AddStepNode from './AddStepNode';

export const nodeTypes: NodeTypes = {
  action: ActionNode,
  addStep: AddStepNode,
};

export default nodeTypes;
