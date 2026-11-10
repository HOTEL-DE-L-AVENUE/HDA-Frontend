import React from 'react';
import { Wine } from 'lucide-react';

interface BarHeaderProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const BarHeader: React.FC<BarHeaderProps> = ({
  title = 'Bar & Lounge',
  subtitle = 'Cocktails premium & service bar',
  compact = false,
}) => (
  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${compact ? 'gap-1 sm:gap-2' : 'gap-3'}`}>
    <div>
      <h2
        className={`text-primary font-bold ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {title}
      </h2>
      <p className={`text-muted mt-1 ${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}`}>{subtitle}</p>
    </div>
    <div className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-accent ${compact ? 'h-8 w-8' : 'h-12 w-12'}`}>
      <Wine size={compact ? 17 : 24} className="text-black" />
    </div>
  </div>
);
