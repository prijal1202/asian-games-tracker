export interface Country {
  code: string;
  name: string;
  flag_url: string;
  gold_medals: number;
  silver_medals: number;
  bronze_medals: number;
  total_medals: number;
  total_sports: number;
}

export interface MedalStanding {
  rank: number;
  code: string;
  name: string;
  flag_url: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export interface Sport {
  slug: string;
  name: string;
  category: string;
  icon: string;
  fixture_count?: number;
}

export interface Fixture {
  id: string;
  sport_slug: string;
  sport_name?: string;
  sport_icon?: string;
  event_name: string;
  stage_round: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'POSTPONED';
  scheduled_at: string;
  venue: string;
  team_a_code: string;
  team_a_name?: string;
  team_a_flag?: string;
  team_b_code?: string;
  team_b_name?: string;
  team_b_flag?: string;
  team_a_score: string;
  team_b_score: string;
  details: string;
  winner_code?: string;
}

export interface ParticipatingSport {
  sport_slug: string;
  sport_name: string;
  sport_category: string;
  sport_icon: string;
  current_stage: string;
  active_status: string;
  fixtures: Fixture[];
}

export interface CountryOverview {
  country: Country;
  participating_sports: ParticipatingSport[];
}

export interface ScraperStatus {
  status: string;
  last_sync: string | null;
  items_synced: number;
  message: string;
  total_fixtures: number;
}
