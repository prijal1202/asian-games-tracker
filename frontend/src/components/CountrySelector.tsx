import React, { useState } from 'react';
import { Country } from '../types';
import { Search } from 'lucide-react';

interface CountrySelectorProps {
  countries: Country[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCode,
  onSelect,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.code.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter country (e.g. India, Japan, CHN)..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {filtered.map((country) => {
          const isSelected = country.code === selectedCode;
          return (
            <button
              key={country.code}
              onClick={() => onSelect(country.code)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:border-slate-600'
              }`}
            >
              <span className="text-2xl mb-1">{country.flag_url || '🏳️'}</span>
              <span className="font-semibold text-xs tracking-wide">{country.code}</span>
              <span className="text-[10px] text-slate-400 truncate w-full">{country.name}</span>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400 font-medium">
                <span>🥇 {country.gold_medals}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
