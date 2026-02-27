'use client';

import type { BlockDef } from './constants/blocks';

interface Props {
  blocks: BlockDef[];
  activeBlock: string;
  setActiveBlock: (id: string) => void;
}

export default function BlockTabs({ blocks, activeBlock, setActiveBlock }: Props) {
  return (
    <div className="border-b border-[#1e293b] bg-[#0f1219] flex overflow-x-auto shrink-0 px-3">
      {blocks.map(block => {
        const isActive = activeBlock === block.id;
        return (
          <button key={block.id} onClick={() => setActiveBlock(block.id)}
            className="py-2.5 px-4 bg-transparent border-none cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 text-[12px]"
            style={{
              borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
              color: isActive ? '#e2e8f0' : '#64748b',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            <span className="text-[14px]">{block.icon}</span>
            {block.label}
          </button>
        );
      })}
    </div>
  );
}
