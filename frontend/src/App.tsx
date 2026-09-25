import React, { useEffect, useState } from 'react';
import { Country, CountryOverview, Fixture, ScraperStatus } from './types';
import {
  fetchCountries,
  fetchCountryOverview,
  fetchFixtures,
  triggerScraperSync,
  fetchScraperStatus,
} from './api';
import { CountrySelector } from './components/CountrySelector';
import { CountryDossier } from './components/CountryDossier';
import { MatchCard } from './components/MatchCard';
import { RefreshCw, Radio, Trophy, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('IND');
  const [overview, setOverview] = useState<CountryOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'country' | 'live' | 'all'>('country');
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([]);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cList, statusData] = await Promise.all([
        fetchCountries(),
        fetchScraperStatus().catch(() => null),
      ]);
      setCountries(cList);
      if (statusData) setScraperStatus(statusData);

      if (cList.length > 0 && !cList.some((c) => c.code === selectedCountryCode)) {
        setSelectedCountryCode(cList[0].code);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCountryCode) {
      fetchCountryOverview(selectedCountryCode)
        .then((data) => setOverview(data))
        .catch(console.error);
    }
  }, [selectedCountryCode]);

  useEffect(() => {
    if (activeTab === 'live') {
      fetchFixtures({ status: 'LIVE' })
        .then((fixtures) => setLiveFixtures(fixtures))
        .catch(console.error);
    }
  }, [activeTab]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerScraperSync();
      await loadData();
      if (selectedCountryCode) {
        const updatedOverview = await fetchCountryOverview(selectedCountryCode);
        setOverview(updatedOverview);
      }
      if (activeTab === 'live') {
        const fixtures = await fetchFixtures({ status: 'LIVE' });
        setLiveFixtures(fixtures);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-850 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">Asian Games Tracker</h1>
              <p className="text-[11px] text-slate-400">Country & Sports Round Status</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            {scraperStatus?.last_sync && (
              <span className="hidden sm:inline text-[11px] text-slate-500">
                Synced {new Date(scraperStatus.last_sync).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('country')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'country'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Country Hub
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'live'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            Live Now
          </button>
        </div>

        {/* Tab 1: Country Hub */}
        {activeTab === 'country' && (
          <div className="space-y-6">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading countries...</div>
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
                  <div className="p-12 text-center text-slate-400">Loading country campaign...</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Live Now */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400" />
                Live Competitions Across Sports
              </h3>
              <span className="text-xs px-2.5 py-1 bg-red-950/80 text-red-400 border border-red-800 rounded-full font-medium">
                {liveFixtures.length} Ongoing
              </span>
            </div>

            {liveFixtures.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center space-y-2">
                <p className="text-slate-300 font-medium">No games are currently live right now.</p>
                <p className="text-xs text-slate-500">Check the Country Hub for upcoming fixtures.</p>
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
