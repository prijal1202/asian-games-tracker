import React from 'react';
import { Fixture } from '../types';
import { CountryFlag } from './CountryFlag';
import { Clock, MapPin, Trophy, Users } from 'lucide-react';

interface MatchCardProps {
  fixture: Fixture;
  highlightCountryCode?: string;
}

// Clean sport name / tag indicator
const getSportTag = (slug: string, eventName: string): string => {
  const s = (slug + ' ' + eventName).toLowerCase();
  if (s.includes('cricket') || s.includes('ckt')) return 'Cricket';
  if (s.includes('badminton') || s.includes('bmt') || s.includes('bdm')) return 'Badminton';
  if (s.includes('table-tennis') || s.includes('tte') || s.includes('table tennis')) return 'Table Tennis';
  if (s.includes('tennis') || s.includes('ten')) return 'Tennis';
  if (s.includes('archery') || s.includes('arc')) return 'Archery';
  if (s.includes('football') || s.includes('fbl') || s.includes('soccer')) return 'Football';
  if (s.includes('hockey') || s.includes('hoc')) return 'Hockey';
  if (s.includes('basketball') || s.includes('bkb') || s.includes('bk3')) return 'Basketball';
  if (s.includes('swim') || s.includes('aquatics') || s.includes('swm')) return 'Aquatics';
  if (s.includes('karate') || s.includes('judo') || s.includes('wrestling') || s.includes('box')) return 'Combat';
  return 'Sports';
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

  const sportLabel = getSportTag(fixture.sport_slug, fixture.event_name);
  const isCricket =
    fixture.sport_slug === 'ckt' ||
    fixture.sport_slug === 'cricket' ||
    fixture.event_name.toLowerCase().includes('cricket');

  const isRacquet = [
    'badminton', 'tennis', 'table-tennis', 'squash', 'bmt', 'bdm', 'tte', 'ten'
  ].some((s) => fixture.sport_slug.toLowerCase().includes(s));

  // Parse details string for athlete rosters and set/inning breakdowns
  const rawDetails = fixture.details || '';
  const detailParts = rawDetails ? rawDetails.split(' | ') : [];

  // Athlete names (e.g. "Athlete A vs Athlete B")
  const athletes = detailParts.find((p) => p.includes(' vs ') && !p.toLowerCase().includes('innings'));

  // Innings or sets details
  const inningsDetail = detailParts.find(
    (p) => p.toLowerCase().includes('innings') || (isCricket && p.includes(':'))
  );
  
  // Intelligent sets parser for badminton/tennis (e.g. "Sets: 21-19, 18-21" or raw "21-19, 18-21 (Set 3: 11-10)")
  const setsDetail = detailParts.find(
    (p) =>
      p.toLowerCase().startsWith('sets:') ||
      (isRacquet && (/^\d+-\d+/.test(p.trim()) || p.toLowerCase().includes('set')))
  );

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
      className={`rounded-2xl border transition-all duration-200 p-3.5 bg-white shadow-xs ${
        isLive
          ? 'border-red-300 ring-1 ring-red-400/30'
          : 'border-neutral-200/90 hover:border-neutral-300'
      }`}
    >
      {/* Top Header: Sport Tag, Event Discipline, Stage Round & Live Badge */}
      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2.5 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/60">
            {sportLabel}
          </span>
          {fixture.event_name && (
            <span
              className="font-semibold text-neutral-900 text-xs truncate max-w-[140px] sm:max-w-[190px]"
              title={fixture.event_name}
            >
              {fixture.event_name}
            </span>
          )}
          <span className="text-neutral-300">·</span>
          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider truncate">
            {fixture.stage_round}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-red-50 text-red-700 border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">
              Official
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-50 text-neutral-600 border border-neutral-200">
              <Clock className="w-3 h-3 text-neutral-400" />
              {new Date(fixture.scheduled_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Competitors & Scores Section (Clean, Compact, Balanced) */}
      <div className="space-y-1.5 mb-2.5">
        {/* Team A */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-xl border transition ${
            highlightCountryCode === fixture.team_a_code
              ? 'bg-neutral-100 border-neutral-300 font-semibold'
              : 'bg-neutral-50/70 border-neutral-100 hover:bg-neutral-50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CountryFlag
              code={fixture.team_a_code}
              name={fixture.team_a_name}
              fallbackEmoji={fixture.team_a_flag}
              size="md"
            />
            <div className="min-w-0 flex items-center gap-1.5">
              <span
                className={`text-xs sm:text-sm truncate ${
                  highlightCountryCode === fixture.team_a_code
                    ? 'text-neutral-950 font-bold'
                    : 'text-neutral-800 font-medium'
                }`}
              >
                {fixture.team_a_name || fixture.team_a_code}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-white text-neutral-500 font-mono font-medium rounded border border-neutral-200">
                {fixture.team_a_code}
              </span>
            </div>
            {fixture.winner_code === fixture.team_a_code && (
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1 stroke-[2.2]" />
            )}
          </div>

          {/* Team A Score */}
          <div className="text-right flex-shrink-0 ml-2">
            {isUpcoming ? (
              <span className="text-xs text-neutral-400 font-mono font-medium">-</span>
            ) : scoreA && scoreA !== '' ? (
              <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-neutral-900">
                {scoreA}
              </span>
            ) : (
              <span className="text-sm text-neutral-500 font-mono">0</span>
            )}
          </div>
        </div>

        {/* Team B (or Opponent TBD if unassigned) */}
        {fixture.team_b_code ? (
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl border transition ${
              highlightCountryCode === fixture.team_b_code
                ? 'bg-neutral-100 border-neutral-300 font-semibold'
                : 'bg-neutral-50/70 border-neutral-100 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CountryFlag
                code={fixture.team_b_code}
                name={fixture.team_b_name}
                fallbackEmoji={fixture.team_b_flag}
                size="md"
              />
              <div className="min-w-0 flex items-center gap-1.5">
                <span
                  className={`text-xs sm:text-sm truncate ${
                    highlightCountryCode === fixture.team_b_code
                      ? 'text-neutral-950 font-bold'
                      : 'text-neutral-800 font-medium'
                  }`}
                >
                  {fixture.team_b_name || fixture.team_b_code}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-white text-neutral-500 font-mono font-medium rounded border border-neutral-200">
                  {fixture.team_b_code}
                </span>
              </div>
              {fixture.winner_code === fixture.team_b_code && (
                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1 stroke-[2.2]" />
              )}
            </div>

            {/* Team B Score */}
            <div className="text-right flex-shrink-0 ml-2">
              {isUpcoming ? (
                <span className="text-xs text-neutral-400 font-mono font-medium">-</span>
              ) : scoreB && scoreB !== '' ? (
                <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-neutral-900">
                  {scoreB}
                </span>
              ) : (
                <span className="text-sm text-neutral-500 font-mono">0</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/40 text-neutral-400">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-4 rounded-xs bg-neutral-200/60 border border-neutral-300/40 flex items-center justify-center text-[10px] font-mono text-neutral-400">
                ?
              </div>
              <span className="text-xs font-medium text-neutral-400 italic">
                Opponent TBD / Qualifier
              </span>
            </div>
            <span className="text-xs text-neutral-400 font-mono">-</span>
          </div>
        )}
      </div>

      {/* Cricket Innings Scorecard Breakdown */}
      {isCricket && (inningsDetail || otherNotes.length > 0) && (
        <div className="mb-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs">
          <div className="text-neutral-700 font-bold mb-1 text-[11px] uppercase tracking-wider">
            Scorecard Summary
          </div>
          {inningsDetail && (
            <p className="text-neutral-700 font-mono text-[11px] leading-relaxed">
              {inningsDetail.replace(/^innings:\s*/i, '')}
            </p>
          )}
          {otherNotes.map((note, idx) => (
            <p key={idx} className="text-neutral-600 text-[11px] font-medium mt-0.5">
              {note}
            </p>
          ))}
        </div>
      )}

      {/* Racquet Sports Set-by-Set Pills */}
      {isRacquet && setChips.length > 0 && (
        <div className="mb-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Sets:</span>
          {setChips.map((set, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-neutral-100 text-neutral-700 border border-neutral-200 font-medium"
            >
              {set.includes(':') ? set : `Set ${idx + 1}: ${set}`}
            </span>
          ))}
        </div>
      )}

      {/* Athletes info if available */}
      {athletes && (
        <div className="mb-2 text-xs text-neutral-600 flex items-center gap-2 bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-200/60">
          <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="truncate text-[11px] font-medium">{athletes}</span>
        </div>
      )}

      {/* Bottom Info Bar: Event discipline & Venue */}
      <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-100 gap-2">
        <span className="truncate font-medium text-neutral-500 text-[11px] flex items-center gap-1">
          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
          <span className="truncate">{fixture.venue || 'Official Asian Games Venue'}</span>
        </span>
        {fixture.winner_code && (
          <span className="text-[10px] font-semibold text-neutral-700">
            Winner: {fixture.winner_code}
          </span>
        )}
      </div>
    </div>
  );
};
