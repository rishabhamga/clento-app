import { EdgeTypes } from '@xyflow/react';
import CustomEdge from './CustomEdge';

export const edgeTypes: EdgeTypes = {
  buttonedge: CustomEdge,
  conditional: CustomEdge,
};

export default edgeTypes;
