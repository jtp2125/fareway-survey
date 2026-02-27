import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { respondent_id, block, data, current_block } = await req.json();

    if (!respondent_id || !block) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build update object — merge block data + update current_block
    const updateData: Record<string, unknown> = {
      ...data,
    };
    if (current_block) {
      updateData.current_block = current_block;
    }

    const { error } = await supabaseAdmin
      .from('respondents')
      .update(updateData)
      .eq('respondent_id', respondent_id);

    if (error) {
      console.error('Submit block error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
