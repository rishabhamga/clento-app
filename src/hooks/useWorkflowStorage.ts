import { useState, useCallback } from 'react';
import { FlowData } from '@/components/workflow/types/WorkflowTypes';

export interface UseWorkflowStorageResult {
  loading: boolean;
  error: string | null;
  saveWorkflow: (campaignId: string, workflow: FlowData) => Promise<boolean>;
  loadWorkflow: (campaignId: string) => Promise<FlowData | null>;
  deleteWorkflow: (campaignId: string) => Promise<boolean>;
}

export function useWorkflowStorage(): UseWorkflowStorageResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveWorkflow = useCallback(async (campaignId: string, workflow: FlowData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Saving workflow for campaign:', campaignId);

      const response = await fetch(`/api/campaigns/${campaignId}/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflow }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workflow');
      }

      const result = await response.json();
      console.log('✅ Workflow saved successfully:', result);

      return true;
    } catch (err: any) {
      console.error('❌ Error saving workflow:', err);
      setError(err.message || 'Failed to save workflow');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkflow = useCallback(async (campaignId: string): Promise<FlowData | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading workflow for campaign:', campaignId);

      const response = await fetch(`/api/campaigns/${campaignId}/workflow`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No workflow found for campaign:', campaignId);
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load workflow');
      }

      const result = await response.json();
      console.log('✅ Workflow loaded successfully:', result.workflow?.id);

      return result.workflow;
    } catch (err: any) {
      console.error('❌ Error loading workflow:', err);
      setError(err.message || 'Failed to load workflow');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWorkflow = useCallback(async (campaignId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ Deleting workflow for campaign:', campaignId);

      const response = await fetch(`/api/campaigns/${campaignId}/workflow`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workflow');
      }

      console.log('✅ Workflow deleted successfully');
      return true;
    } catch (err: any) {
      console.error('❌ Error deleting workflow:', err);
      setError(err.message || 'Failed to delete workflow');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
  };
}
