import React from 'react';
import { Wine } from 'lucide-react';

export const BarHeader: React.FC = () => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2
        className="text-primary text-xl sm:text-2xl md:text-3xl font-bold"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Bar & Lounge
      </h2>
      <p className="text-muted text-xs sm:text-sm mt-1">Cocktails premium & service bar</p>
    </div>
    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
      <Wine size={24} className="text-black" />
    </div>
  </div>
);