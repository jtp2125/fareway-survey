import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import Papa from 'papaparse';
import { CSV_COLUMN_ORDER } from '@/lib/constants';

function isAuthenticated(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all respondents
    const { data: respondents, error } = await supabaseAdmin
      .from('respondents')
      .select('*')
      .order('start_timestamp', { ascending: true });

    if (error) {
      console.error('Export error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Map to CSV column order
    const rows = (respondents || []).map((r) => {
      const row: Record<string, unknown> = {};
      CSV_COLUMN_ORDER.forEach((col) => {
        row[col] = r[col] ?? '';
      });
      return row;
    });

    const csv = Papa.unparse(rows, {
      columns: CSV_COLUMN_ORDER as unknown as string[],
    });

    // UTF-8 BOM + CSV content
    const bom = '\uFEFF';
    const body = bom + csv;

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fareway_survey_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
