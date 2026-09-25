import React, { useEffect, useState } from 'react';
import { MedalStanding } from '../types';
import { fetchMedals } from '../api';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Asian Games 2026 Medal Table</h2>
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
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading medal standings...</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-850/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
                <tr>
                  <th className="py-3.5 px-4 font-semibold text-center w-14">Rank</th>
                  <th className="py-3.5 px-4 font-semibold">NOC / Country</th>
                  <th
                    onClick={() => setSortBy('gold')}
                    className={`py-3.5 px-4 font-bold text-center cursor-pointer transition ${
                      sortBy === 'gold' ? 'text-amber-400 bg-amber-400/10' : 'hover:text-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>🥇 Gold</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('silver')}
                    className={`py-3.5 px-4 font-bold text-center cursor-pointer transition ${
                      sortBy === 'silver' ? 'text-slate-200 bg-slate-400/10' : 'hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>🥈 Silver</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('bronze')}
                    className={`py-3.5 px-4 font-bold text-center cursor-pointer transition ${
                      sortBy === 'bronze' ? 'text-amber-600 bg-amber-600/10' : 'hover:text-amber-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>🥉 Bronze</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('total')}
                    className={`py-3.5 px-4 font-bold text-center cursor-pointer transition ${
                      sortBy === 'total' ? 'text-blue-400 bg-blue-500/10' : 'hover:text-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Total</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {sorted.map((item, idx) => {
                  const displayRank = idx + 1;
                  return (
                    <tr
                      key={item.code}
                      onClick={() => onSelectCountry && onSelectCountry(item.code)}
                      className={`hover:bg-slate-750/70 transition cursor-pointer ${
                        displayRank === 1
                          ? 'bg-amber-500/5'
                          : displayRank === 2
                          ? 'bg-slate-400/5'
                          : displayRank === 3
                          ? 'bg-amber-600/5'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        {displayRank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 text-xs font-black shadow">
                            1
                          </span>
                        ) : displayRank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs font-black shadow">
                            2
                          </span>
                        ) : displayRank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black shadow">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">{displayRank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.flag_url || '🏳️'}</span>
                          <div>
                            <span className="font-semibold text-slate-100 block">{item.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{item.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-400 text-base">
                        {item.gold}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-200 text-base">
                        {item.silver}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-amber-600 text-base">
                        {item.bronze}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-400 text-base">
                        {item.total}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCountry && onSelectCountry(item.code);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 font-medium transition"
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
