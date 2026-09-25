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
      {/* Sport Selector Minimalist Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sports.map((sport) => {
          const isSelected = sport.slug === selectedSport;
          return (
            <button
              key={sport.slug}
              onClick={() => setSelectedSport(sport.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                isSelected
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-200'
              }`}
            >
              {sport.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 text-center text-neutral-400">Loading tournament fixtures...</div>
      ) : Object.keys(stageGroups).length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 text-sm">
          No scheduled fixtures found for this discipline.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(stageGroups).map(([stage, fList]) => (
            <div key={stage} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neutral-400" />
                  <h3 className="font-bold text-neutral-900 text-sm sm:text-base tracking-tight uppercase">
                    {stage}
                  </h3>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-mono border border-neutral-200">
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
