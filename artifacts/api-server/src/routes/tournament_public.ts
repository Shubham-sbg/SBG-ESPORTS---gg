/**
 * tournament_public.ts
 * Public-facing tournament endpoint — no admin auth required.
 * POST /api/tnmt/register — submits a team registration for review.
 */
import { Router, Request, Response } from 'express';
import { readCol, writeCol } from '../lib/store.js';

const router = Router();

interface TeamPlayer { name: string; gameId: string; role?: string; }
interface RegPayload {
  tournamentId: string;
  teamName: string;
  captain: string;
  captainContact: string;
  captainEmail?: string;
  players: TeamPlayer[];
}

router.post('/register', async (req: Request, res: Response) => {
  const body = req.body as RegPayload;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!body.tournamentId || typeof body.tournamentId !== 'string') {
    res.status(400).json({ message: 'tournamentId is required.' }); return;
  }
  if (!body.teamName?.trim()) {
    res.status(400).json({ message: 'Team name is required.' }); return;
  }
  if (!body.captain?.trim()) {
    res.status(400).json({ message: 'Captain name is required.' }); return;
  }
  if (!body.captainContact?.trim()) {
    res.status(400).json({ message: 'Captain WhatsApp contact is required.' }); return;
  }
  if (!Array.isArray(body.players) || body.players.length === 0) {
    res.status(400).json({ message: 'At least one player is required.' }); return;
  }
  for (const p of body.players) {
    if (!p.name?.trim() || !p.gameId?.trim()) {
      res.status(400).json({ message: 'Each player must have a name and game ID.' }); return;
    }
  }

  // ── Check tournament exists and is open ────────────────────────────────────
  const tournaments = (await readCol('tnmt_tournaments') as any[]) ?? [];
  const tnmt = tournaments.find((t: any) => t.id === body.tournamentId);
  if (!tnmt) {
    res.status(404).json({ message: 'Tournament not found.' }); return;
  }
  if (tnmt.status !== 'registration') {
    res.status(400).json({ message: 'This tournament is not accepting registrations.' }); return;
  }

  // ── Check for duplicate team name ─────────────────────────────────────────
  const existing = (await readCol('tnmt_teams') as any[]) ?? [];
  const duplicate = existing.some(
    (t: any) => t.tournamentId === body.tournamentId &&
      t.name.toLowerCase() === body.teamName.trim().toLowerCase() &&
      t.status !== 'rejected'
  );
  if (duplicate) {
    res.status(409).json({ message: 'A team with this name is already registered for this tournament.' }); return;
  }

  // ── Check max teams not exceeded ──────────────────────────────────────────
  const approvedCount = existing.filter(
    (t: any) => t.tournamentId === body.tournamentId && t.status === 'approved'
  ).length;
  if (tnmt.maxTeams && approvedCount >= tnmt.maxTeams) {
    res.status(400).json({ message: 'This tournament has reached its maximum team limit.' }); return;
  }

  // ── Save registration ──────────────────────────────────────────────────────
  const now = Date.now();
  const team = {
    id: `team_${now}_${Math.random().toString(36).slice(2, 8)}`,
    tournamentId: body.tournamentId,
    name: body.teamName.trim(),
    captain: body.captain.trim(),
    captainContact: body.captainContact.trim(),
    captainEmail: body.captainEmail?.trim() ?? '',
    players: body.players.map((p: TeamPlayer) => ({
      name: p.name.trim(),
      gameId: p.gameId.trim(),
      role: p.role?.trim() ?? '',
    })),
    status: 'pending',
    createdAt: now,
  };

  const updated = [...existing, team];
  await writeCol('tnmt_teams', updated);

  res.status(201).json({ message: 'Registration submitted successfully! Pending admin approval.', teamId: team.id });
});

export default router;
