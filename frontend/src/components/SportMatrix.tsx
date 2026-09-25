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
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
              }`}
            >
              {sport.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading sport brackets...</div>
      ) : Object.keys(stageGroups).length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
          No matches found for this sport.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(stageGroups).map(([stage, stageFixtures]) => (
            <div key={stage} className="space-y-3">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                {stage} ({stageFixtures.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageFixtures.map((fixture) => (
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
