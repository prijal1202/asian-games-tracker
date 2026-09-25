import React from 'react';
import { CountryOverview } from '../types';
import { MatchCard } from './MatchCard';
import { CountryFlag } from './CountryFlag';
import { Activity, ShieldCheck, Sparkles } from 'lucide-react';

interface CountryDossierProps {
  overview: CountryOverview;
}

export const CountryDossier: React.FC<CountryDossierProps> = ({ overview }) => {
  const { country, participating_sports } = overview;

  return (
    <div className="space-y-6">
      {/* Editorial Campaign Summary Card (Reference 2.png style) */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <CountryFlag
              code={country.code}
              name={country.name}
              fallbackEmoji={country.flag_url}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {country.code} Delegation
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  Asian Games 2026
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {country.name}: National Campaign & Tournament Fixtures
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-2xl leading-relaxed">
                Active tracking across{' '}
                <span className="text-neutral-900 font-semibold">{participating_sports.length}</span>{' '}
                participating sports disciplines, stage brackets, and live medal contention in Aichi-Nagoya.
              </p>
            </div>
          </div>

          {/* Minimalist Hairline Medal Tally Box */}
          <div className="flex items-center justify-around sm:justify-end gap-3 sm:gap-5 bg-neutral-50 border border-neutral-200/80 px-5 py-3 rounded-2xl">
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 font-bold tracking-wider block">GOLD</span>
              <span className="text-lg sm:text-xl font-black text-neutral-900 font-mono">
                {country.gold_medals}
              </span>
            </div>
            <div className="w-px h-7 bg-neutral-200"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 font-bold tracking-wider block">SILVER</span>
              <span className="text-lg sm:text-xl font-black text-neutral-900 font-mono">
                {country.silver_medals}
              </span>
            </div>
            <div className="w-px h-7 bg-neutral-200"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-400 font-bold tracking-wider block">BRONZE</span>
              <span className="text-lg sm:text-xl font-black text-neutral-900 font-mono">
                {country.bronze_medals}
              </span>
            </div>
            <div className="w-px h-7 bg-neutral-200"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-neutral-900 font-black tracking-wider block">TOTAL</span>
              <span className="text-lg sm:text-xl font-black text-neutral-900 font-mono">
                {country.gold_medals + country.silver_medals + country.bronze_medals}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Participation & Fixtures */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-500" />
            Participating Sports & Round Status
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            {participating_sports.length} Active Sports
          </span>
        </div>

        {participating_sports.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center text-neutral-400 text-sm">
            No active sport fixtures scheduled for {country.name}.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {participating_sports.map((sport) => {
              const isMedalContention =
                sport.current_stage.includes('Final') || sport.current_stage.includes('Semi-final');

              return (
                <div
                  key={sport.sport_slug}
                  className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <h3 className="font-bold text-neutral-900 text-base">
                        {sport.sport_name}
                      </h3>
                      <span className="text-[11px] text-neutral-400 font-medium tracking-wide">
                        {sport.sport_category}
                      </span>
                    </div>

                    <div>
                      {isMedalContention ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white">
                          <Sparkles className="w-3.5 h-3.5" />
                          {sport.current_stage}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                          {sport.current_stage}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
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
