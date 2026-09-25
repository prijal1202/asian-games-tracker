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
      {/* Olympic Campaign Summary Banner */}
      <div className="bg-gradient-to-br from-[#0c101a] via-[#0e1422] to-[#12192b] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <CountryFlag
              code={country.code}
              name={country.name}
              fallbackEmoji={country.flag_url}
              size="xl"
              className="shadow-md shadow-black/50"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {country.name}
                </h2>
                <span className="text-xs px-2 py-0.5 bg-blue-500/15 text-blue-400 font-mono font-bold rounded-lg border border-blue-500/30">
                  {country.code}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Participating across{' '}
                <span className="text-white font-bold">{participating_sports.length}</span>{' '}
                sports disciplines in Asian Games 2026
              </p>
            </div>
          </div>

          {/* Olympic Metallic Medal Tally Display */}
          <div className="flex items-center justify-around sm:justify-end gap-3 sm:gap-4 bg-[#080b12]/90 border border-white/10 px-5 py-3 rounded-2xl shadow-inner">
            <div className="text-center px-1">
              <span className="text-[10px] text-amber-400 font-black tracking-wider block">GOLD</span>
              <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                {country.gold_medals}
              </span>
            </div>
            <div className="w-px h-7 bg-white/10"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-slate-300 font-black tracking-wider block">SILVER</span>
              <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                {country.silver_medals}
              </span>
            </div>
            <div className="w-px h-7 bg-white/10"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-amber-600 font-black tracking-wider block">BRONZE</span>
              <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                {country.bronze_medals}
              </span>
            </div>
            <div className="w-px h-7 bg-white/10"></div>
            <div className="text-center px-1">
              <span className="text-[10px] text-sky-400 font-black tracking-wider block">TOTAL</span>
              <span className="text-lg sm:text-xl font-extrabold text-sky-400 font-mono">
                {country.gold_medals + country.silver_medals + country.bronze_medals}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Participation & Fixtures */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          Participating Sports & Round Status
        </h3>

        {participating_sports.length === 0 ? (
          <div className="bg-[#0e131f]/70 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
            No active sport fixtures scheduled for {country.name}.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {participating_sports.map((sport) => {
              const isMedalContention =
                sport.current_stage.includes('Final') || sport.current_stage.includes('Semi-final');

              return (
                <div
                  key={sport.sport_slug}
                  className="bg-[#0c101a]/90 border border-white/10 rounded-3xl p-5 shadow-xl shadow-black/30 space-y-4 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h4 className="font-extrabold text-white text-sm sm:text-base">
                        {sport.sport_name}
                      </h4>
                      <span className="text-[11px] text-slate-400 tracking-wide">
                        {sport.sport_category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMedalContention ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-950/20">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {sport.current_stage}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-sky-400 border border-blue-500/20">
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
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
