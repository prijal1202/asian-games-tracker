import React, { useEffect, useState } from 'react';
import { MedalStanding } from '../types';
import { fetchMedals } from '../api';
import { CountryFlag } from './CountryFlag';
import { Award, Search, ArrowUpDown, ChevronRight } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101a] border border-neutral-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-[#141b2a] border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-900 dark:text-amber-400 shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Asian Games 2026 Medal Standings
            </h2>
            <p className="text-xs text-neutral-500 dark:text-slate-400">Official Standings & NOC Delegation Rankings</p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search country or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-[#121826] hover:bg-neutral-100/90 dark:hover:bg-[#161f31] focus:bg-white dark:focus:bg-[#090d16] border border-transparent focus:border-neutral-300 dark:focus:border-white/20 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none transition shadow-inner shadow-black/5"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-neutral-400 dark:text-slate-500">Loading medal standings...</div>
      ) : (
        <div className="bg-white dark:bg-[#0c101a] border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-[#121826] text-[11px] uppercase tracking-wider text-neutral-500 dark:text-slate-400 border-b border-neutral-200 dark:border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-center w-16">Rank</th>
                  <th className="py-3.5 px-4 font-bold">NOC Delegation</th>
                  <th
                    onClick={() => setSortBy('gold')}
                    className={`py-3.5 px-4 font-bold text-center cursor-pointer transition select-none ${
                      sortBy === 'gold'
                        ? 'text-neutral-900 dark:text-amber-400 bg-neutral-100 dark:bg-amber-400/10'
                        : 'hover:text-neutral-900 dark:hover:text-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span>Gold</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('silver')}
                    className={`py-3.5 px-4 font-bold text-center cursor-pointer transition select-none ${
                      sortBy === 'silver'
                        ? 'text-neutral-900 dark:text-slate-200 bg-neutral-100 dark:bg-white/10'
                        : 'hover:text-neutral-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span>Silver</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('bronze')}
                    className={`py-3.5 px-4 font-bold text-center cursor-pointer transition select-none ${
                      sortBy === 'bronze'
                        ? 'text-neutral-900 dark:text-amber-600 bg-neutral-100 dark:bg-amber-600/10'
                        : 'hover:text-neutral-900 dark:hover:text-amber-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span>Bronze</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSortBy('total')}
                    className={`py-3.5 px-4 font-bold text-center cursor-pointer transition select-none ${
                      sortBy === 'total'
                        ? 'text-neutral-900 dark:text-sky-400 bg-neutral-100 dark:bg-sky-400/10'
                        : 'hover:text-neutral-900 dark:hover:text-sky-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span>Total</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {sorted.map((item, index) => {
                  const displayRank = index + 1;
                  return (
                    <tr
                      key={item.code}
                      onClick={() => onSelectCountry && onSelectCountry(item.code)}
                      className={`hover:bg-neutral-50 dark:hover:bg-[#161f31] transition cursor-pointer ${
                        displayRank === 1
                          ? 'bg-amber-50/20 dark:bg-amber-500/[0.04]'
                          : displayRank === 2
                          ? 'bg-neutral-50/50 dark:bg-white/[0.02]'
                          : displayRank === 3
                          ? 'bg-amber-50/10 dark:bg-amber-600/[0.03]'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold">
                        {displayRank === 1 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500 text-amber-900 dark:text-black text-xs font-bold border border-amber-300 dark:border-amber-400">
                            1
                          </span>
                        ) : displayRank === 2 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-200 dark:bg-slate-300 text-neutral-800 dark:text-black text-xs font-bold border border-neutral-300 dark:border-slate-400">
                            2
                          </span>
                        ) : displayRank === 3 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-900/10 dark:bg-amber-700 text-amber-900 dark:text-white text-xs font-bold border border-amber-900/20 dark:border-amber-600">
                            3
                          </span>
                        ) : (
                          <span className="text-neutral-400 dark:text-slate-500 text-xs font-mono font-medium">{displayRank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <CountryFlag
                            code={item.code}
                            name={item.name}
                            fallbackEmoji={item.flag_url}
                            size="md"
                          />
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-white block">{item.name}</span>
                            <span className="text-[11px] text-neutral-400 dark:text-slate-500 font-mono">{item.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-neutral-900 dark:text-amber-400 text-base font-mono">
                        {item.gold}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-neutral-700 dark:text-slate-200 text-base font-mono">
                        {item.silver}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-neutral-700 dark:text-amber-600 text-base font-mono">
                        {item.bronze}
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-neutral-950 dark:text-sky-400 text-base font-mono">
                        {item.total}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCountry && onSelectCountry(item.code);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-slate-400 hover:text-black dark:hover:text-sky-400 font-semibold transition cursor-pointer"
                        >
                          View Dossier
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
