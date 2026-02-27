import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { segment } = await req.json();

    if (!segment) {
      return NextResponse.json({ error: 'Missing segment' }, { status: 400 });
    }

    // Atomic check and increment via RPC function
    const { data, error } = await supabaseAdmin
      .rpc('check_and_increment_quota', { target_segment: segment });

    if (error) {
      console.error('Quota check error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // data is true if admitted, false if quota full
    return NextResponse.json({ admitted: data });
  } catch (err) {
    console.error('Quota check error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
