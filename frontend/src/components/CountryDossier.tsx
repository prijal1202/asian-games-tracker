import React from 'react';
import { CountryOverview } from '../types';
import { MatchCard } from './MatchCard';
import { Activity, ShieldCheck, Sparkles } from 'lucide-react';

interface CountryDossierProps {
  overview: CountryOverview;
}

export const CountryDossier: React.FC<CountryDossierProps> = ({ overview }) => {
  const { country, participating_sports } = overview;

  return (
    <div className="space-y-6">
      {/* Campaign Summary Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-800 to-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{country.flag_url || '🏳️'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{country.name}</h2>
                <span className="text-sm px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono rounded">
                  {country.code}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Participating across {participating_sports.length} sports disciplines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-700/60 px-5 py-3 rounded-xl">
            <div className="text-center">
              <span className="text-xs text-amber-400 font-semibold block">GOLD</span>
              <span className="text-xl font-bold text-white">{country.gold_medals}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <span className="text-xs text-slate-300 font-semibold block">SILVER</span>
              <span className="text-xl font-bold text-white">{country.silver_medals}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <span className="text-xs text-amber-600 font-semibold block">BRONZE</span>
              <span className="text-xl font-bold text-white">{country.bronze_medals}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="text-center">
              <span className="text-xs text-blue-400 font-semibold block">TOTAL</span>
              <span className="text-xl font-bold text-blue-400">
                {country.gold_medals + country.silver_medals + country.bronze_medals}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Participation Grid */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Participating Sports & Round Status
        </h3>

        {participating_sports.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
            No active sport fixtures found for {country.name}.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {participating_sports.map((sport) => {
              const isMedalContention =
                sport.current_stage.includes('Final') || sport.current_stage.includes('Semi-final');

              return (
                <div
                  key={sport.sport_slug}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                    <div>
                      <h4 className="font-bold text-white text-base">{sport.sport_name}</h4>
                      <span className="text-xs text-slate-400">{sport.sport_category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMedalContention ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-3.5 h-3.5" />
                          {sport.current_stage}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
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
