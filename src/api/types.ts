/** A sports league as returned by TheSportsDB `all_leagues.php`. */
export interface League {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strLeagueAlternate: string;
}

/** A season entry as returned by `search_all_seasons.php?badge=1`. */
export interface Season {
  strSeason: string;
  strBadge: string;
}

/** Extra detail for a single league, from `lookupleague.php`. */
export interface LeagueDetail {
  idLeague: string;
  strLeague: string;
  strLeagueAlternate: string;
  strDescriptionEN: string | null;
}

// Raw shapes of the API envelopes, used only at the client boundary.
// `search_all_leagues.php` nests its league array under a "countries" key.
export interface SearchLeaguesResponse {
  countries: League[] | null;
}

export interface AllSeasonsResponse {
  seasons: Season[] | null;
}

export interface LookupLeagueResponse {
  leagues: LeagueDetail[] | null;
}
