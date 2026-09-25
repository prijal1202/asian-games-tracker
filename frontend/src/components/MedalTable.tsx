import React, { useEffect, useState } from 'react';
import { MedalStanding } from '../types';
import { fetchMedals } from '../api';
import { CountryFlag } from './CountryFlag';
import { Trophy, Search, ArrowUpDown, ChevronRight } from 'lucide-react';

interface MedalTableProps {
  onSelectCountry?: (code: string) => void;
}

export const MedalTable: React.FC<MedalTableProps> = ({ onSelectCountry }) => {
  const [standings, setStandings] = useState<MedalStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'gold' | 'silver' | 'bronze' | 'total'>('gold');

  useEffect(() => {
    fetchMedals()
      .then((data) => setStandings(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = standings.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'gold') {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    }
    if (sortBy === 'silver') return b.silver - a.silver;
    if (sortBy === 'bronze') return b.bronze - a.bronze;
    return b.total - a.total;
  });

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c101a]/90 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-950/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Asian Games 2026 Medal Table
            </h2>
            <p className="text-xs text-slate-400">Official Standings & Country Rankings</p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search country (e.g. Nepal, Japan)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#121826] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading medal standings...</div>
      ) : (
        <div className="bg-[#0c101a]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121826]/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-4 px-4 font-bold text-center w-16">Rank</th>
                  <th className="py-4 px-4 font-bold">NOC / Country</th>
                  <th
                    onClick={() => setSortBy('gold')}
                    className={`py-4 px-4 font-bold text-center cursor-pointer transition select-none ${
                      sortBy === 'gold' ? 'text-amber-400 bg-amber-400/10' : 'hover:text-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span>🥇 Gold</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('silver')}
                    className={`py-4 px-4 font-bold text-center cursor-pointer transition select-none ${
                      sortBy === 'silver' ? 'text-slate-200 bg-slate-400/10' : 'hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span>🥈 Silver</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('bronze')}
                    className={`py-4 px-4 font-bold text-center cursor-pointer transition select-none ${
                      sortBy === 'bronze' ? 'text-amber-600 bg-amber-600/10' : 'hover:text-amber-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span>🥉 Bronze</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('total')}
                    className={`py-4 px-4 font-bold text-center cursor-pointer transition select-none ${
                      sortBy === 'total' ? 'text-sky-400 bg-sky-400/10' : 'hover:text-sky-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span>Total</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map((item, index) => {
                  const displayRank = index + 1;
                  return (
                    <tr
                      key={item.code}
                      onClick={() => onSelectCountry && onSelectCountry(item.code)}
                      className={`hover:bg-[#161f31]/70 transition cursor-pointer ${
                        displayRank === 1
                          ? 'bg-amber-500/[0.04]'
                          : displayRank === 2
                          ? 'bg-slate-400/[0.03]'
                          : displayRank === 3
                          ? 'bg-amber-600/[0.03]'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        {displayRank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/30">
                            1
                          </span>
                        ) : displayRank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950 text-xs font-black shadow-md shadow-slate-400/20">
                            2
                          </span>
                        ) : displayRank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white text-xs font-black shadow-md shadow-amber-700/20">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono font-medium">{displayRank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <CountryFlag
                            code={item.code}
                            name={item.name}
                            fallbackEmoji={item.flag_url}
                            size="md"
                          />
                          <div>
                            <span className="font-semibold text-white block">{item.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{item.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-amber-400 text-base font-mono">
                        {item.gold}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200 text-base font-mono">
                        {item.silver}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600 text-base font-mono">
                        {item.bronze}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-sky-400 text-base font-mono">
                        {item.total}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCountry && onSelectCountry(item.code);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 font-medium transition"
                        >
                          View Hub
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
