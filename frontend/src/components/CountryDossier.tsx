import React, { useState, useMemo } from 'react';
import { CountryOverview } from '../types';
import { MatchCard } from './MatchCard';
import { CountryFlag } from './CountryFlag';
import { Activity, ShieldCheck, Sparkles, Filter } from 'lucide-react';

interface CountryDossierProps {
  overview: CountryOverview;
}

export const CountryDossier: React.FC<CountryDossierProps> = ({ overview }) => {
  const { country, participating_sports } = overview;
  const [selectedSportSlug, setSelectedSportSlug] = useState<string>('all');

  const filteredSports = useMemo(() => {
    if (selectedSportSlug === 'all') return participating_sports;
    return participating_sports.filter((s) => s.sport_slug === selectedSportSlug);
  }, [participating_sports, selectedSportSlug]);

  const totalFixtures = useMemo(
    () => participating_sports.reduce((sum, s) => sum + s.fixtures.length, 0),
    [participating_sports]
  );

  return (
    <div className="space-y-5">
      {/* Editorial Campaign Summary Card (Reference 2.png style) */}
      <div className="bg-white dark:bg-[#0d121c] border border-neutral-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <CountryFlag
              code={country.code}
              name={country.name}
              fallbackEmoji={country.flag_url}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#141b2a] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                  {country.code} Delegation
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-slate-500 font-mono">
                  Asian Games 2026
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
                {country.name}: National Campaign
              </h1>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                Active tracking across{' '}
                <span className="text-neutral-900 dark:text-white font-semibold">{participating_sports.length}</span>{' '}
                sports disciplines and {totalFixtures} tournament fixtures at Aichi-Nagoya 2026.
              </p>
            </div>
          </div>

          {/* Minimalist Hairline Medal Tally Box */}
          <div className="flex items-center justify-around sm:justify-end gap-3 sm:gap-4 bg-neutral-50 dark:bg-[#121826] border border-neutral-200/80 dark:border-white/10 px-4 py-2.5 rounded-xl flex-shrink-0">
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 dark:text-slate-400 font-bold tracking-wider block">GOLD</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-amber-400 font-mono">
                {country.gold_medals}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200 dark:bg-white/10"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 dark:text-slate-400 font-bold tracking-wider block">SILVER</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-slate-200 font-mono">
                {country.silver_medals}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200 dark:bg-white/10"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 dark:text-slate-400 font-bold tracking-wider block">BRONZE</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-amber-600 font-mono">
                {country.bronze_medals}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200 dark:bg-white/10"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-900 dark:text-white font-black tracking-wider block">TOTAL</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-sky-400 font-mono">
                {country.gold_medals + country.silver_medals + country.bronze_medals}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Filter Bar & Fixtures Showcase */}
      <div className="space-y-4">
        {/* Header & Discipline Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-neutral-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
              Tournament Fixtures & Status
            </h2>
            <span className="text-xs font-mono text-neutral-400 dark:text-slate-500">
              ({totalFixtures} matches)
            </span>
          </div>

          {/* Quick Sport Filter Pills */}
          {participating_sports.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <Filter className="w-3 h-3 text-neutral-400 dark:text-slate-500 flex-shrink-0 hidden sm:inline" />
              <button
                type="button"
                onClick={() => setSelectedSportSlug('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedSportSlug === 'all'
                    ? 'bg-black dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                    : 'bg-neutral-100 dark:bg-[#141b2a] text-neutral-600 dark:text-slate-300 hover:bg-neutral-200 dark:hover:bg-[#1c263c]'
                }`}
              >
                All Sports ({totalFixtures})
              </button>
              {participating_sports.map((sport) => {
                const isSelected = sport.sport_slug === selectedSportSlug;
                return (
                  <button
                    key={sport.sport_slug}
                    type="button"
                    onClick={() => setSelectedSportSlug(sport.sport_slug)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-black dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                        : 'bg-neutral-100 dark:bg-[#141b2a] text-neutral-600 dark:text-slate-300 hover:bg-neutral-200 dark:hover:bg-[#1c263c]'
                    }`}
                  >
                    {sport.sport_name} ({sport.fixtures.length})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty State */}
        {participating_sports.length === 0 ? (
          <div className="bg-white dark:bg-[#0d121c] border border-neutral-200 dark:border-white/10 rounded-2xl p-10 text-center text-neutral-400 dark:text-slate-500 text-sm shadow-xs">
            No active sport fixtures scheduled for {country.name}.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSports.map((sport) => {
              const isMedalContention =
                sport.current_stage.includes('Final') || sport.current_stage.includes('Semi-final');

              return (
                <div key={sport.sport_slug} className="space-y-3">
                  {/* Sport Discipline Subheader */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base">
                        {sport.sport_name}
                      </h3>
                      <span className="text-[11px] text-neutral-400 dark:text-slate-400 font-mono">
                        {sport.sport_category} · {sport.fixtures.length}{' '}
                        {sport.fixtures.length === 1 ? 'match' : 'matches'}
                      </span>
                    </div>

                    <div>
                      {isMedalContention ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900 dark:bg-amber-500/20 text-white dark:text-amber-300 border border-transparent dark:border-amber-500/30">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {sport.current_stage}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-[#141b2a] text-neutral-700 dark:text-slate-300 border border-neutral-200 dark:border-white/10">
                          <ShieldCheck className="w-3 h-3 text-neutral-400 dark:text-slate-400" />
                          {sport.current_stage}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Responsive Match Card Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sport.fixtures.map((fixture) => (
                      <MatchCard
                        key={fixture.id}
                        fixture={fixture}
                        highlightCountryCode={country.code}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
