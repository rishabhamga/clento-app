import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { saveWorkflowToGCS, loadWorkflowFromGCS, deleteWorkflowFromGCS } from '@/lib/services/workflow-storage';
import { FlowData } from '@/components/workflow/types/WorkflowTypes';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Load workflow for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Get campaign and workflow file name
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, workflow_json_file, user_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if user owns the campaign
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user || campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If no workflow file, return null
    if (!campaign.workflow_json_file) {
      return NextResponse.json({ workflow: null });
    }

    // Extract flow ID from file name
    const flowId = campaign.workflow_json_file.replace('workflows/', '').replace('.json', '');

    // Load workflow from GCS
    const workflowData = await loadWorkflowFromGCS(flowId);

    if (!workflowData) {
      return NextResponse.json({ error: 'Workflow file not found' }, { status: 404 });
    }

    return NextResponse.json({ workflow: workflowData });

  } catch (error: any) {
    console.error('Error loading campaign workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save workflow for a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { workflow }: { workflow: FlowData } = body;

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow data is required' }, { status: 400 });
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id, workflow_json_file')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if user owns the campaign
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user || campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete old workflow file if exists
    if (campaign.workflow_json_file) {
      const oldFlowId = campaign.workflow_json_file.replace('workflows/', '').replace('.json', '');
      await deleteWorkflowFromGCS(oldFlowId);
    }

    // Save new workflow to GCS
    const storageResult = await saveWorkflowToGCS(workflow, campaignId);

    if (!storageResult.success) {
      return NextResponse.json(
        { error: storageResult.error || 'Failed to save workflow' },
        { status: 500 }
      );
    }

    // Update campaign with new workflow file name
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        workflow_json_file: storageResult.fileName,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating campaign with workflow file:', updateError);
      // Try to clean up the uploaded file
      if (storageResult.flowId) {
        await deleteWorkflowFromGCS(storageResult.flowId);
      }
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flowId: storageResult.flowId,
      fileName: storageResult.fileName,
      gcsUrl: storageResult.gcsUrl
    });

  } catch (error: any) {
    console.error('Error saving campaign workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete workflow for a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id, workflow_json_file')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if user owns the campaign
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user || campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete workflow file if exists
    if (campaign.workflow_json_file) {
      const flowId = campaign.workflow_json_file.replace('workflows/', '').replace('.json', '');
      await deleteWorkflowFromGCS(flowId);
    }

    // Update campaign to remove workflow file reference
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        workflow_json_file: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating campaign after workflow deletion:', updateError);
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting campaign workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
