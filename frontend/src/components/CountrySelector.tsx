import React, { useState, useMemo } from 'react';
import { Country } from '../types';
import { CountryFlag } from './CountryFlag';
import { Search, ChevronDown, Check, Globe, SlidersHorizontal } from 'lucide-react';

interface CountrySelectorProps {
  countries: Country[];
  selectedCode: string;
  onSelect: (code: string) => void;
  className?: string;
}

// Popular / representative countries for instant 1-click access
const QUICK_CODES = ['IND', 'CHN', 'JPN', 'KOR', 'NEP', 'THA', 'IRI', 'PAK'];

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCode,
  onSelect,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const selected = useMemo(
    () => countries.find((c) => c.code === selectedCode) || countries[0],
    [countries, selectedCode]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countries, searchQuery]);

  const quickCountries = useMemo(
    () =>
      QUICK_CODES.map((code) => countries.find((c) => c.code === code)).filter(
        (c): c is Country => Boolean(c)
      ),
    [countries]
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mobile/Tablet Compact Header with Expand Toggle */}
      <div className="lg:hidden bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CountryFlag
            code={selected?.code}
            name={selected?.name}
            fallbackEmoji={selected?.flag_url}
            size="lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-neutral-900 text-sm truncate">
                {selected?.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-700 font-mono font-semibold rounded border border-neutral-200">
                {selected?.code}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5 font-medium">
              <span>Gold {selected?.gold_medals}</span>
              <span className="text-neutral-300">·</span>
              <span>Silver {selected?.silver_medals}</span>
              <span className="text-neutral-300">·</span>
              <span>Bronze {selected?.bronze_medals}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileExpanded((prev) => !prev)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition cursor-pointer flex-shrink-0"
          aria-expanded={isMobileExpanded}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isMobileExpanded ? 'Hide' : 'Change'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${isMobileExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Main Directory Card (Always visible on Desktop, collapsible on Mobile) */}
      <div
        className={`${
          isMobileExpanded ? 'block' : 'hidden'
        } lg:block bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 space-y-3.5`}
      >
        {/* Editorial Title / Header */}
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Select Delegation
          </h2>
          <span className="text-[11px] font-mono text-neutral-400 font-medium">
            {filtered.length} of {countries.length}
          </span>
        </div>

        {/* Soft-gray Search Input (Reference 1.png style) */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Select Your Country to Support"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-neutral-100 hover:bg-neutral-100/90 focus:bg-white border border-transparent focus:border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition shadow-inner shadow-black/5"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 text-xs px-1.5 py-0.5"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Access Chips */}
        <div className="pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Globe className="w-3 h-3 text-neutral-400 flex-shrink-0 hidden sm:inline" />
            {quickCountries.map((c) => {
              const isCurrent = c.code === selectedCode;
              return (
                <button
                  key={c.code}
                  onClick={() => {
                    onSelect(c.code);
                    setIsMobileExpanded(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex-shrink-0 ${
                    isCurrent
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                  title={c.name}
                >
                  <CountryFlag
                    code={c.code}
                    name={c.name}
                    fallbackEmoji={c.flag_url}
                    size="sm"
                  />
                  <span className="font-mono text-[11px] font-semibold">{c.code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hairline Divided Country List (Reference 1.png style) */}
        <div className="max-h-[480px] overflow-y-auto divide-y divide-neutral-100 pr-1 -mr-1 scrollbar-thin scrollbar-thumb-neutral-200">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No country matches "{searchQuery}"
            </div>
          ) : (
            filtered.map((country) => {
              const isCurrent = country.code === selectedCode;
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onSelect(country.code);
                    setIsMobileExpanded(false);
                  }}
                  className={`w-full flex items-center justify-between py-2.5 px-2.5 text-left rounded-xl transition cursor-pointer ${
                    isCurrent
                      ? 'bg-neutral-100 font-semibold text-neutral-950'
                      : 'hover:bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CountryFlag
                      code={country.code}
                      name={country.name}
                      fallbackEmoji={country.flag_url}
                      size="md"
                    />
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span
                        className={`text-sm truncate ${
                          isCurrent ? 'font-bold text-black' : 'font-medium text-neutral-900'
                        }`}
                      >
                        {country.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 font-medium">
                        {country.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-800">{country.gold_medals}G</span>
                      <span>{country.silver_medals}S</span>
                      <span>{country.bronze_medals}B</span>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-black ml-1" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Action Button (Reference 1.png GET STARTED style) */}
        <div className="pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setIsMobileExpanded(false)}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer text-center"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};
