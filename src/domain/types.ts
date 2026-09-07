export type Tour = "ATP" | "WTA";
export type Surface = "hard" | "clay" | "grass" | "carpet" | "unknown";
export type MatchStatus = "scheduled" | "live" | "completed" | "cancelled" | "postponed";
export type EventType = "singles" | "doubles";

export interface PlayerRef {
  id: string;
  name: string;
  tour: Tour;
  countryCode?: string;
  ranking?: number;
  seed?: number;
}

export interface SetScore {
  home: number;
  away: number;
  tiebreakHome?: number;
  tiebreakAway?: number;
}

export interface TennisMatch {
  id: string;
  tournamentId: string;
  tournamentName: string;
  tour: Tour;
  eventType: EventType;
  round?: string;
  surface: Surface;
  scheduledAt: string;
  status: MatchStatus;
  home: PlayerRef;
  away: PlayerRef;
  sets: SetScore[];
  winnerPlayerId?: string;
  currentGame?: string;
  serverPlayerId?: string;
  court?: string;
}

export interface Tournament {
  id: string;
  name: string;
  tour: Tour | "BOTH";
  level?: string;
  location?: string;
  surface: Surface;
  startsOn: string;
  endsOn: string;
}

export interface PlayerProfile extends PlayerRef {
  birthDate?: string;
  handedness?: "right" | "left" | "unknown";
  highestRanking?: number;
  rankingMovement?: number;
}

export interface PersonalState {
  followedPlayerIds: string[];
  followedTournamentIds: string[];
  starredMatchIds: string[];
  watchMatchIds: string[];
  watchedMatchIds: string[];
  globalSpoilerMode: boolean;
}