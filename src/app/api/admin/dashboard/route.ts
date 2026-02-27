import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

function isAuthenticated(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === 'authenticated';
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Quota fill status
    const { data: quotas } = await supabaseAdmin
      .from('segment_quotas')
      .select('*');

    // 2. Completion metrics
    const { data: respondents } = await supabaseAdmin
      .from('respondents')
      .select('completion_status, termination_point, segment, device_type, income_band_collapsed, age_cohort_collapsed, duration_seconds, qc_speeder, qc_straightliner_k1, qc_straightliner_k2, qc_gibberish_nps, qc_gibberish_l1a, qc_gibberish_l2a');

    if (!respondents) {
      return NextResponse.json({ quotas, metrics: {}, demographics: {}, qcFlags: {} });
    }

    // Completion metrics
    const total = respondents.length;
    const complete = respondents.filter((r) => r.completion_status === 'complete').length;
    const terminated = respondents.filter((r) => r.completion_status === 'terminated').length;
    const inProgress = respondents.filter((r) => r.completion_status === 'in_progress').length;

    // Termination breakdown
    const termBreakdown: Record<string, number> = {};
    respondents
      .filter((r) => r.completion_status === 'terminated')
      .forEach((r) => {
        const point = r.termination_point || 'unknown';
        termBreakdown[point] = (termBreakdown[point] || 0) + 1;
      });

    // Segment distribution
    const segmentCounts: Record<string, number> = {};
    respondents
      .filter((r) => r.segment)
      .forEach((r) => {
        segmentCounts[r.segment] = (segmentCounts[r.segment] || 0) + 1;
      });

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    respondents.forEach((r) => {
      const d = r.device_type || 'unknown';
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
    });

    // Demographics (income + age for completed)
    const completedRespondents = respondents.filter((r) => r.completion_status === 'complete');
    const incomeCounts: Record<string, number> = {};
    const ageCounts: Record<string, number> = {};
    completedRespondents.forEach((r) => {
      if (r.income_band_collapsed) {
        incomeCounts[r.income_band_collapsed] = (incomeCounts[r.income_band_collapsed] || 0) + 1;
      }
      if (r.age_cohort_collapsed) {
        ageCounts[r.age_cohort_collapsed] = (ageCounts[r.age_cohort_collapsed] || 0) + 1;
      }
    });

    // Average duration
    const durations = completedRespondents
      .filter((r) => r.duration_seconds)
      .map((r) => r.duration_seconds as number);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    // QC flags summary
    const qcFlagCounts = {
      speeder: completedRespondents.filter((r) => r.qc_speeder === 1).length,
      straightliner_k1: completedRespondents.filter((r) => r.qc_straightliner_k1 === 1).length,
      straightliner_k2: completedRespondents.filter((r) => r.qc_straightliner_k2 === 1).length,
      gibberish_nps: completedRespondents.filter((r) => r.qc_gibberish_nps === 1).length,
      gibberish_l1a: completedRespondents.filter((r) => r.qc_gibberish_l1a === 1).length,
      gibberish_l2a: completedRespondents.filter((r) => r.qc_gibberish_l2a === 1).length,
    };

    // 3. Retailer fill counts
    const { data: fillCounts } = await supabaseAdmin
      .from('retailer_fill_counts')
      .select('*')
      .order('count', { ascending: true });

    return NextResponse.json({
      quotas,
      fillCounts,
      metrics: {
        total,
        complete,
        terminated,
        inProgress,
        avgDuration,
        termBreakdown,
        segmentCounts,
        deviceCounts,
      },
      demographics: {
        incomeCounts,
        ageCounts,
      },
      qcFlags: qcFlagCounts,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
