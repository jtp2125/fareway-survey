import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { zip_code } = await req.json();

    if (!zip_code || !/^\d{5}$/.test(zip_code)) {
      return NextResponse.json({ valid: false, error: 'Invalid ZIP format' });
    }

    const { data, error } = await supabaseAdmin
      .from('zip_lookup')
      .select('zip_code, dma, state')
      .eq('zip_code', zip_code)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, dma: data.dma, state: data.state });
  } catch (err) {
    console.error('ZIP lookup error:', err);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}
