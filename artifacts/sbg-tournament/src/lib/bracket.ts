/**
 * Bracket generation — Single Elimination (KO format)
 * Handles byes for non-power-of-2 team counts.
 * Standard tournament seeding (1 vs N, 2 vs N-1, etc.)
 */
import type { TournamentTeam, TournamentMatch, BracketRound, TournamentBracket } from './types';

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export function getRoundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return '🏆 Grand Final';
  if (fromEnd === 1) return 'Semi-Final';
  if (fromEnd === 2) return 'Quarter-Final';
  const size = Math.pow(2, fromEnd + 1);
  return `Round of ${size}`;
}

/** Standard seeding positions (1-indexed) for a bracket of `slots` */
function seedPositions(slots: number): number[] {
  if (slots === 2) return [1, 2];
  const half = slots / 2;
  const prev = seedPositions(half);
  const result: number[] = [];
  for (const p of prev) {
    result.push(p);
    result.push(slots + 1 - p);
  }
  return result;
}

export function generateSingleElimination(
  teams: TournamentTeam[],
  tournamentId: string,
): TournamentBracket {
  const n = teams.length;
  if (n < 2) throw new Error('Need at least 2 teams to generate a bracket.');

  const slots = nextPow2(n);
  const totalRounds = Math.log2(slots);
  const byes = slots - n;

  // Sort teams by seed (lower = higher seed); unseeded at end
  const sorted = [...teams].sort((a, b) => {
    if (a.seed != null && b.seed != null) return a.seed - b.seed;
    if (a.seed != null) return -1;
    if (b.seed != null) return 1;
    return 0;
  });

  // Place teams into seeded positions
  const positions = seedPositions(slots); // positions[0] = seed 1 slot, etc.
  const slotMap = new Map<number, TournamentTeam | null>();
  for (let i = 0; i < slots; i++) {
    slotMap.set(positions[i], i < n ? sorted[i] : null); // null = bye
  }

  const now = Date.now();
  const rounds: BracketRound[] = [];

  // ── Round 1 ───────────────────────────────────────────────────────────────
  const round1Matches: TournamentMatch[] = [];
  let matchPos = 1;

  for (let i = 1; i <= slots; i += 2) {
    const t1 = slotMap.get(i) ?? null;
    const t2 = slotMap.get(i + 1) ?? null;
    const isBye = (t1 !== null && t2 === null) || (t1 === null && t2 !== null);

    const match: TournamentMatch = {
      id: `match_${tournamentId}_1_${matchPos}`,
      tournamentId,
      round: 1,
      matchNumber: Math.ceil(i / 2),
      position: matchPos,
      team1Id: t1?.id ?? null,
      team2Id: t2?.id ?? null,
      status: isBye ? 'bye' : 'pending',
      winnerId: isBye ? (t1?.id ?? t2?.id ?? null) : undefined,
      isBye,
      createdAt: now,
    };
    round1Matches.push(match);
    matchPos++;
  }

  rounds.push({
    round: 1,
    label: byes > 0 ? `Round of ${slots} (with byes)` : getRoundLabel(1, totalRounds),
    matches: round1Matches,
  });

  // ── Subsequent rounds ─────────────────────────────────────────────────────
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = slots / Math.pow(2, r);
    const rMatches: TournamentMatch[] = [];

    for (let m = 1; m <= matchCount; m++) {
      rMatches.push({
        id: `match_${tournamentId}_${r}_${m}`,
        tournamentId,
        round: r,
        matchNumber: m,
        position: matchPos++,
        team1Id: null,   // filled as match results come in
        team2Id: null,
        status: 'pending',
        createdAt: now,
      });
    }

    rounds.push({
      round: r,
      label: getRoundLabel(r, totalRounds),
      matches: rMatches,
    });
  }

  // Auto-advance byes in round 1
  for (const match of round1Matches) {
    if (match.isBye && match.winnerId) {
      advanceWinner(rounds, match, match.winnerId);
    }
  }

  return { tournamentId, rounds, generatedAt: now };
}

/** After a match result, place winner into next round's match slot */
export function advanceWinner(
  rounds: BracketRound[],
  completedMatch: TournamentMatch,
  winnerId: string,
): void {
  const nextRound = completedMatch.round + 1;
  const nextRoundData = rounds.find(r => r.round === nextRound);
  if (!nextRoundData) return;

  const nextMatchNumber = Math.ceil(completedMatch.matchNumber / 2);
  const nextMatch = nextRoundData.matches.find(m => m.matchNumber === nextMatchNumber);
  if (!nextMatch) return;

  // Odd match → team1 slot, even match → team2 slot
  if (completedMatch.matchNumber % 2 === 1) {
    nextMatch.team1Id = winnerId;
  } else {
    nextMatch.team2Id = winnerId;
  }
}

/** Flatten all matches from a bracket */
export function flattenMatches(bracket: TournamentBracket): TournamentMatch[] {
  return bracket.rounds.flatMap(r => r.matches);
}

/** Generate round-robin schedule for N teams */
export function generateRoundRobin(
  teams: TournamentTeam[],
  tournamentId: string,
): TournamentBracket {
  const n = teams.length;
  const now = Date.now();
  const allMatches: TournamentMatch[] = [];
  let pos = 1;

  // Round-robin algorithm: each team plays every other team once
  const list = [...teams];
  if (n % 2 === 1) list.push({ id: 'BYE', name: 'BYE' } as TournamentTeam);

  const rounds: BracketRound[] = [];
  const totalRounds = list.length - 1;

  for (let r = 0; r < totalRounds; r++) {
    const rMatches: TournamentMatch[] = [];
    for (let i = 0; i < list.length / 2; i++) {
      const t1 = list[i];
      const t2 = list[list.length - 1 - i];
      const isBye = t1.id === 'BYE' || t2.id === 'BYE';
      if (!isBye) {
        const m: TournamentMatch = {
          id: `match_${tournamentId}_${r + 1}_${i + 1}`,
          tournamentId,
          round: r + 1,
          matchNumber: i + 1,
          position: pos++,
          team1Id: t1.id,
          team2Id: t2.id,
          status: 'pending',
          isBye: false,
          createdAt: now,
        };
        rMatches.push(m);
        allMatches.push(m);
      }
    }

    rounds.push({ round: r + 1, label: `Round ${r + 1}`, matches: rMatches });

    // Rotate (fix first element, rotate rest)
    const last = list.pop()!;
    list.splice(1, 0, last);
  }

  return { tournamentId, rounds, generatedAt: now };
}
