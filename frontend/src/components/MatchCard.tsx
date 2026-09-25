import React from 'react';
import { Fixture } from '../types';
import { CountryFlag } from './CountryFlag';
import { Clock, MapPin, Trophy, Users } from 'lucide-react';

interface MatchCardProps {
  fixture: Fixture;
  highlightCountryCode?: string;
}

// Sport-specific emoji indicator
const getSportEmoji = (slug: string, eventName: string): string => {
  const s = (slug + ' ' + eventName).toLowerCase();
  if (s.includes('cricket') || s.includes('ckt')) return '🏏';
  if (s.includes('badminton') || s.includes('bmt')) return '🏸';
  if (s.includes('table-tennis') || s.includes('tte') || s.includes('table tennis')) return '🏓';
  if (s.includes('tennis') || s.includes('ten')) return '🎾';
  if (s.includes('archery') || s.includes('arc')) return '🏹';
  if (s.includes('football') || s.includes('fbl') || s.includes('soccer')) return '⚽';
  if (s.includes('hockey') || s.includes('hoc')) return '🏑';
  if (s.includes('basketball') || s.includes('bkb')) return '🏀';
  if (s.includes('swim') || s.includes('aquatics') || s.includes('swm')) return '🏊';
  if (s.includes('karate') || s.includes('judo') || s.includes('wrestling') || s.includes('box')) return '🥋';
  return '🏆';
};

// Clean up cricket scores (e.g. "102 - 7" -> "102/7")
const formatCricketScore = (score: string): string => {
  if (!score || score.trim() === '' || score === '0') return '';
  return score.replace(/(\d+)\s*-\s*(\d+)/g, '$1/$2').trim();
};

export const MatchCard: React.FC<MatchCardProps> = ({ fixture, highlightCountryCode }) => {
  const isLive = fixture.status === 'LIVE';
  const isCompleted = fixture.status === 'COMPLETED';
  const isUpcoming = fixture.status === 'UPCOMING';

  const sportEmoji = getSportEmoji(fixture.sport_slug, fixture.event_name);
  const isCricket =
    fixture.sport_slug === 'ckt' ||
    fixture.sport_slug === 'cricket' ||
    fixture.event_name.toLowerCase().includes('cricket');

  const isRacquet = ['badminton', 'tennis', 'table-tennis', 'squash', 'bmt', 'tte', 'ten'].some((s) =>
    fixture.sport_slug.toLowerCase().includes(s)
  );

  // Parse details string for athlete rosters and set/inning breakdowns
  const rawDetails = fixture.details || '';
  const detailParts = rawDetails ? rawDetails.split(' | ') : [];

  // Athlete names (e.g. "Athlete A vs Athlete B")
  const athletes = detailParts.find((p) => p.includes(' vs ') && !p.toLowerCase().includes('innings'));

  // Innings or sets details
  const inningsDetail = detailParts.find(
    (p) => p.toLowerCase().includes('innings') || (isCricket && p.includes(':'))
  );
  const setsDetail = detailParts.find((p) => p.toLowerCase().startsWith('sets:'));

  // Other commentary notes
  const otherNotes = detailParts.filter(
    (p) => p !== athletes && p !== inningsDetail && p !== setsDetail
  );

  // Process cricket scores
  const scoreA = isCricket ? formatCricketScore(fixture.team_a_score) : fixture.team_a_score;
  const scoreB = isCricket ? formatCricketScore(fixture.team_b_score) : fixture.team_b_score;

  // Split sets if racquet sport
  const setChips: string[] = [];
  if (setsDetail) {
    const rawSets = setsDetail.replace(/^sets:\s*/i, '');
    rawSets.split(',').forEach((s) => {
      const trimmed = s.trim();
      if (trimmed) setChips.push(trimmed);
    });
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-4 shadow-lg backdrop-blur-md ${
        isLive
          ? 'bg-[#0f1422] border-red-500/50 shadow-red-950/30 ring-1 ring-red-500/30'
          : 'bg-[#0e131f] hover:bg-[#131929] border-white/10 hover:border-white/20 shadow-black/40'
      }`}
    >
      {/* Top Header: Sport, Stage Round & Live Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0" role="img" aria-label="sport">
            {sportEmoji}
          </span>
          <span className="font-bold text-sky-400 uppercase tracking-widest text-[10px] truncate">
            {fixture.stage_round}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-red-950/90 text-red-400 border border-red-700/80 animate-pulse shadow-sm shadow-red-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-[#161d2d] text-slate-300 border border-white/10">
              Official
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-[#161d2d] text-slate-400 border border-white/10">
              <Clock className="w-3 h-3 text-slate-500" />
              {new Date(fixture.scheduled_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Competitors & Scores Section (Adaptive) */}
      <div className="space-y-2 mb-3">
        {/* Team A */}
        <div
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition ${
            highlightCountryCode === fixture.team_a_code
              ? 'bg-blue-950/60 border-blue-500/50 shadow-sm'
              : 'bg-[#141b2a] border-white/5'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <CountryFlag
              code={fixture.team_a_code}
              name={fixture.team_a_name}
              fallbackEmoji={fixture.team_a_flag}
              size="md"
            />
            <div className="min-w-0 flex items-center gap-1.5">
              <span
                className={`text-sm font-semibold truncate ${
                  highlightCountryCode === fixture.team_a_code ? 'text-white font-bold' : 'text-slate-200'
                }`}
              >
                {fixture.team_a_name || fixture.team_a_code}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#090d16] text-slate-400 font-mono font-bold rounded border border-white/10">
                {fixture.team_a_code}
              </span>
            </div>
            {fixture.winner_code === fixture.team_a_code && (
              <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0 ml-1" />
            )}
          </div>

          {/* Team A Score */}
          <div className="text-right flex-shrink-0 ml-2">
            {scoreA ? (
              <span className="text-lg sm:text-xl font-extrabold font-mono tracking-tight text-white">
                {scoreA}
              </span>
            ) : isUpcoming ? (
              <span className="text-xs text-slate-500 font-mono">-</span>
            ) : (
              <span className="text-sm text-slate-400 font-mono">0</span>
            )}
          </div>
        </div>

        {/* Team B */}
        {fixture.team_b_code && (
          <div
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition ${
              highlightCountryCode === fixture.team_b_code
                ? 'bg-blue-950/60 border-blue-500/50 shadow-sm'
                : 'bg-[#141b2a] border-white/5'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <CountryFlag
                code={fixture.team_b_code}
                name={fixture.team_b_name}
                fallbackEmoji={fixture.team_b_flag}
                size="md"
              />
              <div className="min-w-0 flex items-center gap-1.5">
                <span
                  className={`text-sm font-semibold truncate ${
                    highlightCountryCode === fixture.team_b_code ? 'text-white font-bold' : 'text-slate-200'
                  }`}
                >
                  {fixture.team_b_name || fixture.team_b_code}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#090d16] text-slate-400 font-mono font-bold rounded border border-white/10">
                  {fixture.team_b_code}
                </span>
              </div>
              {fixture.winner_code === fixture.team_b_code && (
                <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0 ml-1" />
              )}
            </div>

            {/* Team B Score */}
            <div className="text-right flex-shrink-0 ml-2">
              {scoreB ? (
                <span className="text-lg sm:text-xl font-extrabold font-mono tracking-tight text-white">
                  {scoreB}
                </span>
              ) : isUpcoming ? (
                <span className="text-xs text-slate-500 font-mono">-</span>
              ) : (
                <span className="text-sm text-slate-400 font-mono">0</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cricket Innings Scorecard Breakdown */}
      {isCricket && (inningsDetail || otherNotes.length > 0) && (
        <div className="mb-2.5 p-2.5 rounded-xl bg-[#080b12] border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">
            <span>🏏 Scorecard:</span>
          </div>
          {inningsDetail && (
            <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
              {inningsDetail.replace(/^innings:\s*/i, '')}
            </p>
          )}
          {otherNotes.map((note, idx) => (
            <p key={idx} className="text-emerald-400 text-[11px] font-medium mt-0.5">
              {note}
            </p>
          ))}
        </div>
      )}

      {/* Racquet Sports Set-by-Set Pills */}
      {isRacquet && setChips.length > 0 && (
        <div className="mb-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sets:</span>
          {setChips.map((set, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#141b2a] text-slate-200 border border-white/10"
            >
              Set {idx + 1}: {set}
            </span>
          ))}
        </div>
      )}

      {/* Athletes info if available */}
      {athletes && (
        <div className="mb-2.5 text-xs text-slate-300 flex items-center gap-2 bg-[#121826] px-3 py-1.5 rounded-xl border border-white/5">
          <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate text-[11px]">{athletes}</span>
        </div>
      )}

      {/* Bottom Info Bar: Event discipline & Venue */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-white/5 gap-2">
        <span className="truncate font-semibold text-slate-300 text-[11px]">
          {fixture.event_name}
        </span>
        {fixture.venue && (
          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[200px] text-[11px]">
            <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
            <span className="truncate">{fixture.venue}</span>
          </span>
        )}
      </div>

      {/* Other commentary for non-cricket sports */}
      {!isCricket && otherNotes.length > 0 && (
        <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-950/20 border border-amber-900/30 px-2.5 py-1 rounded-lg">
          {otherNotes.join(' | ')}
        </div>
      )}
    </div>
  );
};
