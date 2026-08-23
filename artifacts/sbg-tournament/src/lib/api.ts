/**
 * API client — talks to the shared api-server at /api
 * Collections used:
 *   tnmt_tournaments  — Tournament[]
 *   tnmt_teams        — TournamentTeam[]
 *   tnmt_matches      — TournamentMatch[]
 *   tnmt_brackets     — TournamentBracket[]
 *   tnmt_settings     — TnmtSettings (single object wrapped in array)
 */
import type {
  Tournament, TournamentTeam, TournamentMatch, TournamentBracket,
  TnmtSettings, RegistrationPayload, ScorePayload,
} from './types';

const BASE = '/api';

// ── Auth helpers ──────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return sessionStorage.getItem('tnmt_admin_token');
}
function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// ── Generic collection helpers ─────────────────────────────────────────────

async function getCol<T>(name: string): Promise<T[]> {
  const res = await fetch(`${BASE}/db/${name}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function saveCol<T>(name: string, data: T[]): Promise<void> {
  await fetch(`${BASE}/db/${name}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

// ── Admin auth ────────────────────────────────────────────────────────────────

export async function adminLogin(password: string): Promise<{ token: string; role: string } | null> {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return null;
  return res.json();
}

// ── Tournaments ───────────────────────────────────────────────────────────────

export async function getTournaments(): Promise<Tournament[]> {
  return getCol<Tournament>('tnmt_tournaments');
}

export async function saveTournaments(list: Tournament[]): Promise<void> {
  return saveCol('tnmt_tournaments', list);
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export async function getTeams(): Promise<TournamentTeam[]> {
  return getCol<TournamentTeam>('tnmt_teams');
}

export async function saveTeams(list: TournamentTeam[]): Promise<void> {
  return saveCol('tnmt_teams', list);
}

// ── Matches ───────────────────────────────────────────────────────────────────

export async function getMatches(): Promise<TournamentMatch[]> {
  return getCol<TournamentMatch>('tnmt_matches');
}

export async function saveMatches(list: TournamentMatch[]): Promise<void> {
  return saveCol('tnmt_matches', list);
}

// ── Brackets ──────────────────────────────────────────────────────────────────

export async function getBrackets(): Promise<TournamentBracket[]> {
  return getCol<TournamentBracket>('tnmt_brackets');
}

export async function saveBrackets(list: TournamentBracket[]): Promise<void> {
  return saveCol('tnmt_brackets', list);
}

export async function getBracketForTournament(tournamentId: string): Promise<TournamentBracket | null> {
  const all = await getBrackets();
  return all.find(b => b.tournamentId === tournamentId) ?? null;
}

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: TnmtSettings = {
  organizationName: 'SBG ARMY ENTREPRENEUR',
  tagline: 'COMPETE. CONQUER. CHAMPION.',
  primaryColor: '#e8192c',
  footerText: 'Built for Champions.',
};

export async function getSettings(): Promise<TnmtSettings> {
  const arr = await getCol<TnmtSettings>('tnmt_settings');
  return arr[0] ?? DEFAULT_SETTINGS;
}

export async function saveSettings(s: TnmtSettings): Promise<void> {
  return saveCol('tnmt_settings', [s]);
}

// ── Public registration ───────────────────────────────────────────────────────

export async function registerTeam(payload: RegistrationPayload): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${BASE}/tnmt/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({ message: 'Server error' }));
  return { ok: res.ok, message: body.message ?? (res.ok ? 'Success' : 'Failed') };
}

// ── Score update (admin) ──────────────────────────────────────────────────────

export async function updateMatchScore(
  brackets: TournamentBracket[],
  tournamentId: string,
  matchId: string,
  payload: ScorePayload,
): Promise<TournamentBracket[]> {
  const { advanceWinner } = await import('./bracket');

  const updated = brackets.map(b => {
    if (b.tournamentId !== tournamentId) return b;
    const newRounds = b.rounds.map(r => ({
      ...r,
      matches: r.matches.map(m => {
        if (m.id !== matchId) return m;
        const updated = { ...m, ...payload, status: 'completed' as const };
        return updated;
      }),
    }));
    // Advance winner
    const match = newRounds.flatMap(r => r.matches).find(m => m.id === matchId);
    if (match && payload.winnerId) advanceWinner(newRounds, match, payload.winnerId);
    return { ...b, rounds: newRounds };
  });

  await saveBrackets(updated);
  return updated;
}

// ── Leaderboard computation ───────────────────────────────────────────────────

export function computeLeaderboard(
  tournaments: Tournament[],
  brackets: TournamentBracket[],
  teams: TournamentTeam[],
) {
  const entries: Record<string, {
    teamId: string; teamName: string; tournamentId: string; tournamentTitle: string;
    wins: number; losses: number; kills: number; points: number;
  }> = {};

  for (const bracket of brackets) {
    const t = tournaments.find(x => x.id === bracket.tournamentId);
    if (!t) continue;
    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        if (match.status !== 'completed' || match.isBye) continue;
        const ids = [match.team1Id, match.team2Id].filter(Boolean) as string[];
        for (const id of ids) {
          if (!entries[id]) {
            const team = teams.find(x => x.id === id);
            entries[id] = { teamId: id, teamName: team?.name ?? id, tournamentId: t.id, tournamentTitle: t.title, wins: 0, losses: 0, kills: 0, points: 0 };
          }
          const isWinner = match.winnerId === id;
          const kills = id === match.team1Id ? (match.killScore1 ?? 0) : (match.killScore2 ?? 0);
          entries[id].wins += isWinner ? 1 : 0;
          entries[id].losses += isWinner ? 0 : 1;
          entries[id].kills += kills;
          entries[id].points += isWinner ? 3 : 0;
          entries[id].points += kills;
        }
      }
    }
  }

  return Object.values(entries).sort((a, b) => b.points - a.points || b.wins - a.wins);
}
