import React, { useState, useRef, useEffect } from 'react';
import { Country } from '../types';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';

interface CountrySelectorProps {
  countries: Country[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

// Popular / representative countries for instant 1-click access
const QUICK_CODES = ['IND', 'CHN', 'JPN', 'KOR', 'NEP', 'THA', 'IRI', 'PAK'];

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCode,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = countries.find((c) => c.code === selectedCode) || countries[0];

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      // Auto-focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickCountries = QUICK_CODES.map((code) =>
    countries.find((c) => c.code === code)
  ).filter((c): c is Country => Boolean(c));

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        {/* Dropdown Trigger Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 rounded-xl text-left transition shadow-sm w-full md:w-80 group cursor-pointer"
            aria-expanded={isOpen}
            aria-label="Select Country"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0" role="img" aria-label={selected?.name}>
                {selected?.flag_url || '🏳️'}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white text-sm truncate">
                    {selected?.name}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 font-mono font-medium rounded">
                    {selected?.code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>🥇 {selected?.gold_medals}</span>
                  <span>🥈 {selected?.silver_medals}</span>
                  <span>🥉 {selected?.bronze_medals}</span>
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 flex-shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-2 w-full md:w-88 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Search Bar */}
              <div className="p-2.5 bg-slate-900/90">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search country or code (e.g. Nepal, NEP)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 text-xs"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Country List */}
              <div className="max-h-64 overflow-y-auto p-1 divide-y divide-slate-800/40 scrollbar-thin scrollbar-thumb-slate-700">
                {filtered.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No country matches "{searchQuery}"
                  </div>
                ) : (
                  filtered.map((country) => {
                    const isCurrent = country.code === selectedCode;
                    return (
                      <button
                        key={country.code}
                        onClick={() => {
                          onSelect(country.code);
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs transition cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600/20 text-blue-300 font-semibold'
                            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl flex-shrink-0">{country.flag_url || '🏳️'}</span>
                          <span className="truncate text-slate-200">{country.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {country.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-[10px] text-amber-400 font-medium">
                            🥇 {country.gold_medals}
                          </span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Minimalist Quick-Access Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mr-1 hidden sm:flex">
            <Globe className="w-3 h-3 text-slate-500" />
            <span>Quick:</span>
          </div>
          {quickCountries.map((c) => {
            const isCurrent = c.code === selectedCode;
            return (
              <button
                key={c.code}
                onClick={() => onSelect(c.code)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition border cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:text-white hover:border-slate-600'
                }`}
                title={c.name}
              >
                <span>{c.flag_url}</span>
                <span className="font-mono text-[11px]">{c.code}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
