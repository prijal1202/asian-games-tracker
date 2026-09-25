import React from 'react';
import { Fixture } from '../types';
import { Clock, MapPin, Trophy, Users } from 'lucide-react';

interface MatchCardProps {
  fixture: Fixture;
  highlightCountryCode?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ fixture, highlightCountryCode }) => {
  const isLive = fixture.status === 'LIVE';
  const isCompleted = fixture.status === 'COMPLETED';

  // Parse details if it contains athlete names and set splits
  const detailParts = fixture.details ? fixture.details.split(' | ') : [];
  const athletes = detailParts.find((p) => p.includes(' vs '));
  const otherDetails = detailParts.filter((p) => !p.includes(' vs '));

  return (
    <div className={`bg-slate-800 border rounded-2xl p-4.5 shadow-sm transition hover:shadow-md ${
      isLive ? 'border-red-600/40 shadow-red-950/20' : 'border-slate-700/80 hover:border-slate-600'
    }`}>
      {/* Top Bar: Round & Status */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span className="font-semibold text-blue-400 uppercase tracking-wider">{fixture.stage_round}</span>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-400 border border-red-700/80 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="px-2 py-0.5 rounded text-xs bg-slate-750 text-slate-300 font-medium">Final</span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs bg-slate-750 text-slate-300">
              <Clock className="w-3 h-3" />
              {new Date(fixture.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Teams & Scores */}
      <div className="space-y-2 mb-3">
        <div className={`flex items-center justify-between p-2.5 rounded-xl transition ${
          highlightCountryCode === fixture.team_a_code
            ? 'bg-blue-950/60 border border-blue-800/60 shadow-sm'
            : 'bg-slate-850/80 border border-slate-750/50'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{fixture.team_a_flag || '🏳️'}</span>
            <span className="font-semibold text-slate-200 text-sm">{fixture.team_a_name || fixture.team_a_code}</span>
            {fixture.winner_code === fixture.team_a_code && <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20" />}
          </div>
          <span className="text-xl font-bold text-white font-mono">{fixture.team_a_score}</span>
        </div>

        {fixture.team_b_code && (
          <div className={`flex items-center justify-between p-2.5 rounded-xl transition ${
            highlightCountryCode === fixture.team_b_code
              ? 'bg-blue-950/60 border border-blue-800/60 shadow-sm'
              : 'bg-slate-850/80 border border-slate-750/50'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{fixture.team_b_flag || '🏳️'}</span>
              <span className="font-semibold text-slate-200 text-sm">{fixture.team_b_name || fixture.team_b_code}</span>
              {fixture.winner_code === fixture.team_b_code && <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20" />}
            </div>
            <span className="text-xl font-bold text-white font-mono">{fixture.team_b_score}</span>
          </div>
        )}
      </div>

      {/* Athletes info if available */}
      {athletes && (
        <div className="mb-2 text-xs text-slate-300 flex items-center gap-1.5 bg-slate-850/60 px-2.5 py-1.5 rounded-lg border border-slate-750/60">
          <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">{athletes}</span>
        </div>
      )}

      {/* Bottom Info: Event discipline & venue */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
        <span className="truncate font-medium text-slate-300">{fixture.event_name}</span>
        {fixture.venue && (
          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[170px]">
            <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
            {fixture.venue}
          </span>
        )}
      </div>

      {/* Set Splits or Match Commentary */}
      {otherDetails.length > 0 && (
        <div className="mt-2 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-900/40 px-2.5 py-1.5 rounded-lg">
          {otherDetails.join(' | ')}
        </div>
      )}
    </div>
  );
};
