import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { computeQualityFlags } from '@/lib/quality-flags';

export async function POST(req: NextRequest) {
  try {
    const { respondent_id, data } = await req.json();

    if (!respondent_id) {
      return NextResponse.json({ error: 'Missing respondent_id' }, { status: 400 });
    }

    // First save any final block data
    if (data && Object.keys(data).length > 0) {
      await supabaseAdmin
        .from('respondents')
        .update(data)
        .eq('respondent_id', respondent_id);
    }

    // Fetch full respondent record for QC computation
    const { data: respondent, error: fetchError } = await supabaseAdmin
      .from('respondents')
      .select('*')
      .eq('respondent_id', respondent_id)
      .single();

    if (fetchError || !respondent) {
      return NextResponse.json({ error: 'Respondent not found' }, { status: 404 });
    }

    // Compute duration
    const start = new Date(respondent.start_timestamp).getTime();
    const end = Date.now();
    const duration = Math.round((end - start) / 1000);

    // Compute QC flags
    const respondentWithDuration = { ...respondent, duration_seconds: duration };
    const qcFlags = computeQualityFlags(respondentWithDuration);

    // Final update
    const { error: updateError } = await supabaseAdmin
      .from('respondents')
      .update({
        completion_status: 'complete',
        end_timestamp: new Date().toISOString(),
        duration_seconds: duration,
        current_block: 'complete',
        ...qcFlags,
      })
      .eq('respondent_id', respondent_id);

    if (updateError) {
      console.error('Complete update error:', updateError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, duration });
  } catch (err) {
    console.error('Complete error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
