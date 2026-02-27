import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { respondent_id, termination_point, data } = await req.json();

    if (!respondent_id || !termination_point) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      ...data,
      completion_status: 'terminated',
      termination_point,
      end_timestamp: new Date().toISOString(),
    };

    // Compute duration
    const { data: respondent } = await supabaseAdmin
      .from('respondents')
      .select('start_timestamp')
      .eq('respondent_id', respondent_id)
      .single();

    if (respondent) {
      const start = new Date(respondent.start_timestamp).getTime();
      const end = Date.now();
      updateData.duration_seconds = Math.round((end - start) / 1000);
    }

    const { error } = await supabaseAdmin
      .from('respondents')
      .update(updateData)
      .eq('respondent_id', respondent_id);

    if (error) {
      console.error('Terminate error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Terminate error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
