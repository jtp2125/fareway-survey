'use client';

import type { QuestionDef } from './constants/blocks';
import type { Respondent } from './types';
import FrequencyTable from './tables/FrequencyTable';
import FunnelMatrix from './tables/FunnelMatrix';
import SOWTable from './tables/SOWTable';
import StoreFreqTable from './tables/StoreFreqTable';
import NPSSummary from './tables/NPSSummary';
import NPSVerbatimSample from './tables/NPSVerbatimSample';
import KPCImportance from './tables/KPCImportance';
import KPCPerformance from './tables/KPCPerformance';
import SOWDirection from './tables/SOWDirection';
import TradedownTable from './tables/TradedownTable';
import BestValueTable from './tables/BestValueTable';
import PriceRankTable from './tables/PriceRankTable';
import OverviewSummary from './tables/OverviewSummary';
import CompletionFunnel from './tables/CompletionFunnel';
import QCFlags from './tables/QCFlags';

interface Props {
  question: QuestionDef;
  data: Respondent[];
  allData: Respondent[];
}

export default function QuestionRenderer({ question, data, allData }: Props) {
  switch (question.type) {
    case 'custom_overview': return <OverviewSummary data={data} />;
    case 'custom_completion': return <CompletionFunnel data={data} />;
    case 'custom_qc': return <QCFlags data={data} />;
    case 'categorical': return <FrequencyTable data={data} field={question.field!} labels={question.labels ?? null} />;
    case 'funnel_matrix': return <FunnelMatrix data={data} />;
    case 'custom_sow': return <SOWTable data={data} />;
    case 'custom_store_freq': return <StoreFreqTable data={data} />;
    case 'custom_nps': return <NPSSummary data={data} />;
    case 'custom_nps_verbatim': return <NPSVerbatimSample data={data} />;
    case 'custom_kpc_importance': return <KPCImportance data={data} />;
    case 'custom_kpc_performance': return <KPCPerformance data={data} />;
    case 'custom_sow_direction': return <SOWDirection data={data} dirField={question.dirField!} />;
    case 'custom_tradedown': return <TradedownTable data={data} />;
    case 'custom_best_value': return <BestValueTable data={data} />;
    case 'custom_price_rank': return <PriceRankTable data={data} />;
    default: return <p className="text-[#94a3b8]">No renderer for type: {question.type}</p>;
  }
}
