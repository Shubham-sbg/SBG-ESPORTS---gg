// ── Tournament Types ──────────────────────────────────────────────────────────

export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin';
export type TournamentStatus = 'draft' | 'registration' | 'ongoing' | 'completed' | 'cancelled';
export type GameMode = 'solo' | 'duo' | 'squad' | 'trio';
export type TeamStatus = 'pending' | 'approved' | 'rejected';
export type MatchStatus = 'pending' | 'live' | 'completed' | 'bye';

export interface Prize {
  rank: number;
  label: string;        // "🥇 1st Place", "🎯 MVP"
  amount: string;       // "₹10,000", "Free Entry"
  highlight?: boolean;
}

export interface Tournament {
  id: string;
  title: string;
  subtitle?: string;
  game: string;
  gameMode: GameMode;
  format: TournamentFormat;
  status: TournamentStatus;
  banner?: string;
  startDate: string;    // ISO date
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  entryFee: number;     // 0 = free
  prizePool: string;    // display string, e.g. "₹50,000"
  prizes: Prize[];
  rules: string[];
  description: string;
  contactWhatsApp?: string;
  streamUrl?: string;
  featured?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TeamPlayer {
  name: string;
  gameId: string;       // in-game ID / UID
  role?: string;        // IGL, Support, etc.
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  name: string;
  captain: string;
  captainContact: string; // WhatsApp number
  captainEmail?: string;
  players: TeamPlayer[];
  status: TeamStatus;
  seed?: number;
  note?: string;          // admin note on rejection
  createdAt: number;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;          // 1-indexed
  matchNumber: number;    // within the round
  position: number;       // absolute bracket position
  team1Id: string | null; // null = TBD / bye
  team2Id: string | null;
  score1?: number;
  score2?: number;
  killScore1?: number;    // for point-based formats
  killScore2?: number;
  winnerId?: string | null;
  status: MatchStatus;
  scheduledAt?: string;
  scheduledTime?: string;
  isBye?: boolean;
  createdAt: number;
}

export interface TournamentBracket {
  tournamentId: string;
  rounds: BracketRound[];
  generatedAt: number;
}

export interface BracketRound {
  round: number;
  label: string;          // "Round of 16", "Quarter-Final", "Semi-Final", "Final"
  matches: TournamentMatch[];
}

export interface TnmtSettings {
  organizationName: string;
  tagline: string;
  logo?: string;
  contactWhatsApp?: string;
  contactEmail?: string;
  socialDiscord?: string;
  socialYoutube?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  primaryColor: string;
  footerText?: string;
  announcementText?: string;
  announcementEnabled?: boolean;
}

// ── API shapes ────────────────────────────────────────────────────────────────

export interface RegistrationPayload {
  tournamentId: string;
  teamName: string;
  captain: string;
  captainContact: string;
  captainEmail?: string;
  players: TeamPlayer[];
}

export interface ScorePayload {
  score1: number;
  score2: number;
  killScore1?: number;
  killScore2?: number;
  winnerId: string;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  tournamentId: string;
  tournamentTitle: string;
  wins: number;
  losses: number;
  kills: number;
  placement?: number;
  points: number;
}
