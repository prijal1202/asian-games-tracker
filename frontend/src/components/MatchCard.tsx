import React from 'react';
import { Fixture } from '../types';
import { Clock, MapPin, Trophy } from 'lucide-react';

interface MatchCardProps {
  fixture: Fixture;
  highlightCountryCode?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ fixture, highlightCountryCode }) => {
  const isLive = fixture.status === 'LIVE';
  const isCompleted = fixture.status === 'COMPLETED';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm hover:border-slate-600 transition">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span className="font-semibold text-blue-400 uppercase tracking-wider">{fixture.stage_round}</span>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950/80 text-red-400 border border-red-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">Final</span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700/60 text-slate-300">
              <Clock className="w-3 h-3" />
              {new Date(fixture.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className={`flex items-center justify-between p-2 rounded-lg ${highlightCountryCode === fixture.team_a_code ? 'bg-blue-950/40 border border-blue-900/50' : 'bg-slate-850'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{fixture.team_a_flag || '🏳️'}</span>
            <span className="font-medium text-slate-200">{fixture.team_a_name || fixture.team_a_code}</span>
            {fixture.winner_code === fixture.team_a_code && <Trophy className="w-4 h-4 text-amber-400" />}
          </div>
          <span className="text-lg font-bold text-slate-100">{fixture.team_a_score}</span>
        </div>

        {fixture.team_b_code && (
          <div className={`flex items-center justify-between p-2 rounded-lg ${highlightCountryCode === fixture.team_b_code ? 'bg-blue-950/40 border border-blue-900/50' : 'bg-slate-850'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{fixture.team_b_flag || '🏳️'}</span>
              <span className="font-medium text-slate-200">{fixture.team_b_name || fixture.team_b_code}</span>
              {fixture.winner_code === fixture.team_b_code && <Trophy className="w-4 h-4 text-amber-400" />}
            </div>
            <span className="text-lg font-bold text-slate-100">{fixture.team_b_score}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
        <span className="truncate">{fixture.event_name}</span>
        {fixture.venue && (
          <span className="flex items-center gap-1 text-slate-500 truncate max-w-[150px]">
            <MapPin className="w-3 h-3 shrink-0" />
            {fixture.venue}
          </span>
        )}
      </div>
      {fixture.details && (
        <div className="mt-2 text-xs text-amber-300/80 bg-amber-950/20 px-2 py-1 rounded">
          {fixture.details}
        </div>
      )}
    </div>
  );
};
