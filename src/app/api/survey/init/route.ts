import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { detectDevice } from '@/lib/device-detect';

export async function POST(req: NextRequest) {
  try {
    const { rid, src, phase } = await req.json();

    if (!rid || !phase) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('respondents')
      .select('id')
      .eq('respondent_id', rid)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 });
    }

    // Detect device from User-Agent
    const ua = req.headers.get('user-agent') || '';
    const deviceType = detectDevice(ua);

    // Create respondent record
    const { error } = await supabaseAdmin
      .from('respondents')
      .insert({
        respondent_id: rid,
        panel_source: src || 'direct',
        phase: phase,
        device_type: deviceType,
        current_block: 'consent',
      });

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ error: 'duplicate' }, { status: 409 });
      }
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Init error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
