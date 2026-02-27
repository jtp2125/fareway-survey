import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { respondent_id, stores_last_3m, primary_store, segment } = await req.json();

    if (!respondent_id || !stores_last_3m || !primary_store || !segment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // R1: Always primary store
    const r1 = primary_store;
    let remaining: string[] = stores_last_3m.filter((s: string) => s !== r1);

    // R2: Fareway if secondary shopper, else least-fill
    let r2: string | null = null;
    if (segment === 'secondary_shopper' && remaining.includes('fareway')) {
      r2 = 'fareway';
      remaining = remaining.filter((s: string) => s !== 'fareway');

      // Still increment Fareway's count for tracking
      await supabaseAdmin.rpc('least_fill_select', { eligible_stores: ['fareway'] });
    } else if (remaining.length > 0) {
      const { data, error } = await supabaseAdmin
        .rpc('least_fill_select', { eligible_stores: remaining });
      if (error) {
        console.error('Least fill error for R2:', error);
      } else {
        r2 = data;
        remaining = remaining.filter((s: string) => s !== r2);
      }
    }

    // R3: Least-fill from remaining
    let r3: string | null = null;
    if (remaining.length > 0) {
      const { data, error } = await supabaseAdmin
        .rpc('least_fill_select', { eligible_stores: remaining });
      if (error) {
        console.error('Least fill error for R3:', error);
      } else {
        r3 = data;
      }
    }

    // Also increment R1's count
    await supabaseAdmin.rpc('least_fill_select', { eligible_stores: [r1] });

    // Save assignments to respondent
    const { error: updateError } = await supabaseAdmin
      .from('respondents')
      .update({
        nps_r1_store: r1,
        nps_r2_store: r2,
        nps_r3_store: r3,
      })
      .eq('respondent_id', respondent_id);

    if (updateError) {
      console.error('Update retailers error:', updateError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ r1, r2, r3 });
  } catch (err) {
    console.error('Assign retailers error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
