import { uploadFlowToGCS, deleteFlowFromGCS, flowExistsInGCS, downloadFlowJsonFromGCS } from '@/utils/gcsUtil';
import { FlowData, FlowDataWithMetadata } from '@/components/workflow/types/WorkflowTypes';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowStorageResult {
  success: boolean;
  flowId?: string;
  fileName?: string;
  gcsUrl?: string;
  error?: string;
}

/**
 * Save workflow JSON to Google Cloud Storage
 * @param flowData - The workflow data to save (in sample-flow.json format)
 * @param campaignId - Associated campaign ID
 * @returns Promise with storage result
 */
export async function saveWorkflowToGCS(
  flowData: FlowData,
  campaignId?: string
): Promise<WorkflowStorageResult> {
  try {
    // Generate unique flow ID
    const flowId = uuidv4();
    const fileName = `${flowId}.json`;
    
    // Ensure the workflow data matches sample-flow.json format exactly
    const workflowToSave: FlowData = {
      nodes: flowData.nodes,
      edges: flowData.edges,
      timestamp: flowData.timestamp || new Date().toISOString()
    };

    // Convert to JSON buffer (matching sample-flow.json format)
    const jsonContent = JSON.stringify(workflowToSave, null, 2);
    const buffer = Buffer.from(jsonContent, 'utf-8');

    console.log('🔄 Saving workflow to flow bucket:', {
      flowId,
      fileName,
      campaignId,
      nodeCount: workflowToSave.nodes.length,
      edgeCount: workflowToSave.edges.length,
      timestamp: workflowToSave.timestamp,
      format: 'sample-flow.json compatible'
    });

    // Upload to dedicated flow bucket in workflows folder
    const uploadResult = await uploadFlowToGCS(
      buffer,
      fileName,
      'workflows'
    );

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload workflow to GCS');
    }

    console.log('✅ Workflow saved successfully to flow bucket:', uploadResult.fileName);

    return {
      success: true,
      flowId,
      fileName: uploadResult.fileName,
      gcsUrl: uploadResult.url
    };

  } catch (error: any) {
    console.error('❌ Error saving workflow to flow bucket:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while saving workflow'
    };
  }
}

/**
 * Load workflow JSON from Google Cloud Storage
 * @param flowId - The flow ID to load
 * @returns Promise with workflow data
 */
export async function loadWorkflowFromGCS(flowId: string): Promise<FlowData | null> {
  try {
    const fileName = `workflows/${flowId}.json`;
    
    console.log('🔄 Loading workflow from flow bucket:', { flowId, fileName });

    // Download and parse JSON file from flow bucket
    const workflowData = await downloadFlowJsonFromGCS<FlowData>(fileName);
    
    if (!workflowData) {
      console.warn('⚠️ Workflow file not found or invalid in flow bucket:', fileName);
      return null;
    }

    console.log('✅ Workflow loaded successfully from flow bucket:', {
      flowId,
      nodeCount: workflowData.nodes.length,
      edgeCount: workflowData.edges.length,
      timestamp: workflowData.timestamp
    });

    return workflowData;

  } catch (error: any) {
    console.error('❌ Error loading workflow from flow bucket:', error);
    return null;
  }
}

/**
 * Delete workflow JSON from Google Cloud Storage
 * @param flowId - The flow ID to delete
 * @returns Promise with deletion result
 */
export async function deleteWorkflowFromGCS(flowId: string): Promise<boolean> {
  try {
    const fileName = `workflows/${flowId}.json`;
    
    console.log('🗑️ Deleting workflow from flow bucket:', { flowId, fileName });

    const result = await deleteFlowFromGCS(fileName);
    
    if (result) {
      console.log('✅ Workflow deleted successfully from flow bucket');
    } else {
      console.warn('⚠️ Failed to delete workflow from flow bucket');
    }

    return result;

  } catch (error: any) {
    console.error('❌ Error deleting workflow from flow bucket:', error);
    return false;
  }
}

/**
 * Generate workflow file name from flow ID
 * @param flowId - The flow ID
 * @returns The GCS file name
 */
export function generateWorkflowFileName(flowId: string): string {
  return `workflows/${flowId}.json`;
}

/**
 * Extract flow ID from workflow file name
 * @param fileName - The GCS file name
 * @returns The flow ID
 */
export function extractFlowIdFromFileName(fileName: string): string | null {
  const match = fileName.match(/workflows\/(.+)\.json$/);
  return match ? match[1] : null;
}
