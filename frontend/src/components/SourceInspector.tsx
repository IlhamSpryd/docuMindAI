import React from 'react';
import { X } from 'lucide-react';
import { CitationSource } from '../types';
import { Button } from './ui/button';

interface SourceInspectorProps {
  source: CitationSource | null;
  documentTitle: string;
  onClose: () => void;
}

export const SourceInspector: React.FC<SourceInspectorProps> = ({
  source,
  documentTitle,
  onClose,
}) => {
  if (!source) return null;

  const similarityPercent = Math.min(100, Math.round(source.similarityScore * 100));

  return (
    <aside
      aria-label="Source inspector"
      className="absolute inset-y-0 right-0 z-40 flex w-full flex-col border-l border-border bg-background p-5 sm:w-[380px]"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="font-semibold">Source</h3>
          <p className="text-[13px] text-muted-foreground">
            {source.citationOrder} · {documentTitle}, p. {source.pageNumber}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close source"
          onClick={onClose}
          className="grid size-11 place-items-center rounded-lg hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-4 text-[13px] text-muted-foreground">Similarity {similarityPercent}%</p>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border p-4 text-[13px] leading-relaxed">
        {source.snippet}
      </div>
      <Button type="button" variant="outline" className="mt-4 w-full" onClick={onClose}>
        Close
      </Button>
    </aside>
  );
};
