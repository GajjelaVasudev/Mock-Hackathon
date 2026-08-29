import React from 'react';
import { BookOpen, FileText, ChevronRight } from 'lucide-react';
import { SourceCitation as SourceType } from '../types';

interface SourceCitationProps {
  sources: SourceType[];
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-box">
      <div className="sources-title">
        <BookOpen size={13} />
        Grounded Citations from BNHS Knowledge Base
      </div>
      <div className="sources-list">
        {sources.map((src, index) => (
          <div key={index} className="source-item">
            <FileText size={13} style={{ color: 'var(--color-emerald)' }} />
            <span>
              <strong>Page {src.page}</strong> — {src.section}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
