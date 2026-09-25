import { Country, CountryOverview, Sport, Fixture, ScraperStatus, MedalStanding } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(`${API_BASE}/countries`);
  if (!res.ok) throw new Error('Failed to load countries');
  return res.json();
}

export async function fetchMedals(): Promise<MedalStanding[]> {
  const res = await fetch(`${API_BASE}/medals`);
  if (!res.ok) throw new Error('Failed to load medal standings');
  return res.json();
}

export async function fetchCountryOverview(code: string): Promise<CountryOverview> {
  const res = await fetch(`${API_BASE}/countries/${code}/overview`);
  if (!res.ok) throw new Error(`Failed to load overview for ${code}`);
  return res.json();
}

export async function fetchSports(): Promise<Sport[]> {
  const res = await fetch(`${API_BASE}/sports`);
  if (!res.ok) throw new Error('Failed to load sports');
  return res.json();
}

export async function fetchFixtures(filters?: {
  country?: string;
  sport?: string;
  status?: string;
  round?: string;
}): Promise<Fixture[]> {
  const params = new URLSearchParams();
  if (filters?.country) params.set('country', filters.country);
  if (filters?.sport) params.set('sport', filters.sport);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.round) params.set('round', filters.round);

  const url = `${API_BASE}/fixtures${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load fixtures');
  return res.json();
}

export async function triggerScraperSync(): Promise<{ status: string; synced_fixtures: number }> {
  const res = await fetch(`${API_BASE}/scraper/sync`, { method: 'POST' });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}

export async function fetchScraperStatus(): Promise<ScraperStatus> {
  const res = await fetch(`${API_BASE}/scraper/status`);
  if (!res.ok) throw new Error('Failed to fetch scraper status');
  return res.json();
}
