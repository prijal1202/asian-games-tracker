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
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
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
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {country.code} Delegation
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  Asian Games 2026
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {country.name}: National Campaign
              </h1>
              <p className="text-xs text-neutral-500 mt-1 max-w-xl leading-relaxed">
                Active tracking across{' '}
                <span className="text-neutral-900 font-semibold">{participating_sports.length}</span>{' '}
                sports disciplines and {totalFixtures} tournament fixtures at Aichi-Nagoya 2026.
              </p>
            </div>
          </div>

          {/* Minimalist Hairline Medal Tally Box */}
          <div className="flex items-center justify-around sm:justify-end gap-3 sm:gap-4 bg-neutral-50 border border-neutral-200/80 px-4 py-2.5 rounded-xl flex-shrink-0">
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 font-bold tracking-wider block">GOLD</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 font-mono">
                {country.gold_medals}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 font-bold tracking-wider block">SILVER</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 font-mono">
                {country.silver_medals}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 font-bold tracking-wider block">BRONZE</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 font-mono">
                {country.bronze_medals}
              </span>
            </div>
            <div className="w-px h-6 bg-neutral-200"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-900 font-black tracking-wider block">TOTAL</span>
              <span className="text-base sm:text-lg font-black text-neutral-900 font-mono">
                {country.gold_medals + country.silver_medals + country.bronze_medals}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Filter Bar & Fixtures Showcase */}
      <div className="space-y-4">
        {/* Header & Discipline Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-600" />
            <h2 className="text-sm sm:text-base font-bold text-neutral-900">
              Tournament Fixtures & Status
            </h2>
            <span className="text-xs font-mono text-neutral-400">
              ({totalFixtures} matches)
            </span>
          </div>

          {/* Quick Sport Filter Pills */}
          {participating_sports.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <Filter className="w-3 h-3 text-neutral-400 flex-shrink-0 hidden sm:inline" />
              <button
                type="button"
                onClick={() => setSelectedSportSlug('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedSportSlug === 'all'
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-neutral-400 text-sm shadow-xs">
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
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                        {sport.sport_name}
                      </h3>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {sport.sport_category} · {sport.fixtures.length}{' '}
                        {sport.fixtures.length === 1 ? 'match' : 'matches'}
                      </span>
                    </div>

                    <div>
                      {isMedalContention ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900 text-white">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {sport.current_stage}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                          <ShieldCheck className="w-3 h-3 text-neutral-400" />
                          {sport.current_stage}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Responsive Match Card Grid (balanced layout without vertical white space) */}
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
