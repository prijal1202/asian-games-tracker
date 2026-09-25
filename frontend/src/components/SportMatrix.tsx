import React, { useEffect, useState } from 'react';
import { Sport, Fixture } from '../types';
import { fetchSports, fetchFixtures } from '../api';
import { MatchCard } from './MatchCard';
import { Layers } from 'lucide-react';

export const SportMatrix: React.FC = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('badminton');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSports().then((sList) => {
      setSports(sList);
      if (sList.length > 0 && !sList.some((s) => s.slug === selectedSport)) {
        setSelectedSport(sList[0].slug);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedSport) {
      setLoading(true);
      fetchFixtures({ sport: selectedSport })
        .then((f) => setFixtures(f))
        .finally(() => setLoading(false));
    }
  }, [selectedSport]);

  // Group fixtures by stage/round
  const stageGroups = fixtures.reduce<Record<string, Fixture[]>>((acc, f) => {
    if (!acc[f.stage_round]) acc[f.stage_round] = [];
    acc[f.stage_round].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Sport Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {sports.map((sport) => {
          const isSelected = sport.slug === selectedSport;
          return (
            <button
              key={sport.slug}
              onClick={() => setSelectedSport(sport.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border-blue-400/40'
                  : 'bg-[#0e131f] text-slate-300 hover:bg-[#151c2d] hover:text-white border-white/10'
              }`}
            >
              {sport.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading tournament fixtures...</div>
      ) : Object.keys(stageGroups).length === 0 ? (
        <div className="bg-[#0e131f]/70 border border-white/10 rounded-3xl p-12 text-center text-slate-400">
          No scheduled fixtures found for this discipline.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(stageGroups).map(([stage, fList]) => (
            <div key={stage} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight uppercase">
                  {stage}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
                  {fList.length} matches
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fList.map((fixture) => (
                  <MatchCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
