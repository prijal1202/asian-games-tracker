import { useEffect, useState } from 'react';
import { Country, CountryOverview, Fixture, ScraperStatus } from './types';
import { fetchCountries, fetchCountryOverview, fetchFixtures, fetchScraperStatus, triggerScraperSync } from './api';
import { CountrySelector } from './components/CountrySelector';
import { CountryDossier } from './components/CountryDossier';
import { SportMatrix } from './components/SportMatrix';
import { MedalTable } from './components/MedalTable';
import { MatchCard } from './components/MatchCard';
import { RefreshCw, Activity, Layers, Radio, Award, Flame, Sun, Moon } from 'lucide-react';

export const App = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('NEP');
  const [overview, setOverview] = useState<CountryOverview | null>(null);
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([]);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'country' | 'medals' | 'sports' | 'live'>('country');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Theme state: default to system preference or saved localStorage, fallback to light
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#07090e] text-neutral-900 dark:text-slate-100 flex flex-col antialiased selection:bg-black selection:text-white dark:selection:bg-blue-600 dark:selection:text-white transition-colors duration-200">
      {/* Editorial Top Navbar */}
      <header className="bg-white/95 dark:bg-[#0b0e17]/95 border-b border-neutral-200 dark:border-white/10 sticky top-0 z-30 backdrop-blur-md shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 text-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white tracking-tight leading-tight">
                  Asian Games 2026
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-blue-500/15 text-neutral-800 dark:text-sky-400 border border-neutral-200 dark:border-blue-500/30">
                  Live Results
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-slate-400">
                Official Ingestion from results.asiangames2026.org
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark Mode"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121826] text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-[#1a2337] hover:text-black dark:hover:text-white transition shadow-xs cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-600" />
              )}
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase bg-black hover:bg-neutral-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
              <span className="sm:hidden">{isSyncing ? '...' : 'Sync'}</span>
            </button>

            {scraperStatus?.last_sync && (
              <span className="hidden md:inline text-[11px] font-mono text-neutral-500 dark:text-slate-400 bg-neutral-100 dark:bg-[#121826] px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10">
                Synced {new Date(scraperStatus.last_sync).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs (Solid Black Editorial Bar) */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-white/10 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('country')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition whitespace-nowrap cursor-pointer border ${
              activeTab === 'country'
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm'
                : 'bg-white dark:bg-[#0e131f] text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-[#141b2a] border-neutral-200 dark:border-white/10'
            }`}
          >
            <Activity className="w-4 h-4" />
            Country Hub
          </button>

          <button
            onClick={() => setActiveTab('medals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition whitespace-nowrap cursor-pointer border ${
              activeTab === 'medals'
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm'
                : 'bg-white dark:bg-[#0e131f] text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-[#141b2a] border-neutral-200 dark:border-white/10'
            }`}
          >
            <Award className="w-4 h-4" />
            Medal Standings
          </button>

          <button
            onClick={() => setActiveTab('sports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition whitespace-nowrap cursor-pointer border ${
              activeTab === 'sports'
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm'
                : 'bg-white dark:bg-[#0e131f] text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-[#141b2a] border-neutral-200 dark:border-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            Sport Matrix
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition whitespace-nowrap cursor-pointer border ${
              activeTab === 'live'
                ? 'bg-black dark:bg-red-600 text-white border-black dark:border-red-500 shadow-sm'
                : 'bg-white dark:bg-[#0e131f] text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-[#141b2a] border-neutral-200 dark:border-white/10'
            }`}
          >
            <Radio className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
            Live Competitions
            {liveFixtures.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 rounded-full">
                {liveFixtures.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Country Hub (Desktop-First Two-Column Layout) */}
        {activeTab === 'country' && (
          <div>
            {loading ? (
              <div className="p-16 text-center text-neutral-400 dark:text-slate-500">Loading countries...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Country Directory (Reference 1.png) */}
                <aside className="lg:col-span-4 xl:col-span-4 sticky lg:top-20">
                  <CountrySelector
                    countries={countries}
                    selectedCode={selectedCountryCode}
                    onSelect={(code) => setSelectedCountryCode(code)}
                  />
                </aside>

                {/* Right Column: Country Campaign Dossier (Reference 2.png) */}
                <section className="lg:col-span-8 xl:col-span-8 min-w-0">
                  {overview ? (
                    <CountryDossier overview={overview} />
                  ) : (
                    <div className="p-16 text-center text-neutral-400 dark:text-slate-500">Loading country campaign...</div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Medal Standings */}
        {activeTab === 'medals' && (
          <div>
            <MedalTable onSelectCountry={handleSelectCountryFromMedals} />
          </div>
        )}

        {/* Tab 3: Sport Matrix */}
        {activeTab === 'sports' && (
          <div>
            <SportMatrix />
          </div>
        )}

        {/* Tab 4: Live Now */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
                Live Competitions Across Sports
              </h2>
              <span className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 rounded-full font-bold uppercase tracking-wider">
                {liveFixtures.length} Ongoing
              </span>
            </div>

            {liveFixtures.length === 0 ? (
              <div className="bg-white dark:bg-[#0e131f] border border-neutral-200 dark:border-white/10 rounded-2xl p-16 text-center space-y-2 shadow-sm">
                <p className="text-neutral-900 dark:text-white font-semibold">No matches are currently in progress right now.</p>
                <p className="text-xs text-neutral-400 dark:text-slate-400">Check the Country Hub or Sport Matrix for upcoming fixtures.</p>
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
