import { useEffect, useState } from 'react';
import { Country, CountryOverview, Fixture, ScraperStatus } from './types';
import { fetchCountries, fetchCountryOverview, fetchFixtures, fetchScraperStatus, triggerScraperSync } from './api';
import { CountrySelector } from './components/CountrySelector';
import { CountryDossier } from './components/CountryDossier';
import { SportMatrix } from './components/SportMatrix';
import { MedalTable } from './components/MedalTable';
import { MatchCard } from './components/MatchCard';
import { RefreshCw, Activity, Layers, Radio, Award, Flame } from 'lucide-react';

export const App = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('NEP');
  const [overview, setOverview] = useState<CountryOverview | null>(null);
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([]);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'country' | 'medals' | 'sports' | 'live'>('country');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCountryCode) {
      loadCountryOverview(selectedCountryCode);
    }
  }, [selectedCountryCode]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [cList, lFixtures, sStatus] = await Promise.all([
        fetchCountries(),
        fetchFixtures({ status: 'LIVE' }),
        fetchScraperStatus()
      ]);
      setCountries(cList);
      setLiveFixtures(lFixtures);
      setScraperStatus(sStatus);
      if (cList.length > 0 && !cList.some((c) => c.code === selectedCountryCode)) {
        setSelectedCountryCode(cList[0].code);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCountryOverview = async (code: string) => {
    try {
      const data = await fetchCountryOverview(code);
      setOverview(data);
    } catch (err) {
      console.error(`Error loading overview for ${code}:`, err);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await triggerScraperSync();
      await loadInitialData();
      if (selectedCountryCode) {
        await loadCountryOverview(selectedCountryCode);
      }
    } catch (err) {
      console.error('Error syncing data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectCountryFromMedals = (code: string) => {
    setSelectedCountryCode(code);
    setActiveTab('country');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Olympic Top Navbar */}
      <header className="bg-[#0b0e17]/90 border-b border-white/10 sticky top-0 z-30 backdrop-blur-xl shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-blue-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl text-white tracking-tight leading-tight">
                  Asian Games 2026
                </h1>
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-blue-500/15 text-sky-400 border border-blue-500/30">
                  Live Results
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Ingestion from results.asiangames2026.org
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-900/30 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Live'}
            </button>
            {scraperStatus?.last_sync && (
              <span className="hidden md:inline text-[11px] font-mono text-slate-400 bg-[#121826] px-3 py-1.5 rounded-xl border border-white/10">
                Synced {new Date(scraperStatus.last_sync).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs (Olympic Minimalist Bar) */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('country')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition whitespace-nowrap cursor-pointer border ${
              activeTab === 'country'
                ? 'bg-blue-600 border-blue-400/40 text-white shadow-lg shadow-blue-900/40'
                : 'bg-[#0e131f] text-slate-300 hover:text-white hover:bg-[#141b2a] border-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            Country Hub
          </button>

          <button
            onClick={() => setActiveTab('medals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition whitespace-nowrap cursor-pointer border ${
              activeTab === 'medals'
                ? 'bg-blue-600 border-blue-400/40 text-white shadow-lg shadow-blue-900/40'
                : 'bg-[#0e131f] text-slate-300 hover:text-white hover:bg-[#141b2a] border-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            Medal Standings
          </button>

          <button
            onClick={() => setActiveTab('sports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition whitespace-nowrap cursor-pointer border ${
              activeTab === 'sports'
                ? 'bg-blue-600 border-blue-400/40 text-white shadow-lg shadow-blue-900/40'
                : 'bg-[#0e131f] text-slate-300 hover:text-white hover:bg-[#141b2a] border-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            Sport Matrix
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition whitespace-nowrap cursor-pointer border ${
              activeTab === 'live'
                ? 'bg-red-600 border-red-400/40 text-white shadow-lg shadow-red-950/50'
                : 'bg-[#0e131f] text-slate-300 hover:text-white hover:bg-[#141b2a] border-white/5'
            }`}
          >
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            Live Competitions
          </button>
        </div>

        {/* Tab 1: Country Hub */}
        {activeTab === 'country' && (
          <div className="space-y-6">
            {loading ? (
              <div className="p-16 text-center text-slate-400">Loading countries...</div>
            ) : (
              <>
                <CountrySelector
                  countries={countries}
                  selectedCode={selectedCountryCode}
                  onSelect={(code) => setSelectedCountryCode(code)}
                />

                {overview ? (
                  <CountryDossier overview={overview} />
                ) : (
                  <div className="p-16 text-center text-slate-400">Loading country campaign...</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Medal Standings */}
        {activeTab === 'medals' && (
          <div className="space-y-6">
            <MedalTable onSelectCountry={handleSelectCountryFromMedals} />
          </div>
        )}

        {/* Tab 3: Sport Matrix */}
        {activeTab === 'sports' && (
          <div className="space-y-6">
            <SportMatrix />
          </div>
        )}

        {/* Tab 4: Live Now */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400" />
                Live Competitions Across Sports
              </h3>
              <span className="text-xs px-3 py-1 bg-red-950/80 text-red-400 border border-red-700/80 rounded-full font-bold uppercase tracking-wider">
                {liveFixtures.length} Ongoing
              </span>
            </div>

            {liveFixtures.length === 0 ? (
              <div className="bg-[#0e131f]/70 border border-white/10 rounded-3xl p-16 text-center space-y-2">
                <p className="text-white font-semibold">No matches are currently in progress right now.</p>
                <p className="text-xs text-slate-400">Check the Country Hub or Sport Matrix for upcoming fixtures.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveFixtures.map((fixture) => (
                  <MatchCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
