import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// ── Types ────────────────────────────────────────────────────────────────────
interface BracketData {
  groups: { [groupLetter: string]: { first: string; second: string } };
  r16: string[];
  qf: string[];
  sf: string[];
  final: string[];
  winner: string;
}

// ── WC 2026 group data (for validation) ──────────────────────────────────────
const WC2026_GROUPS: { [key: string]: string[] } = {
  A: ["USA", "Canada", "Mexico", "Jamaica"],
  B: ["Argentina", "Chile", "Peru", "Bolivia"],
  C: ["Brazil", "Colombia", "Ecuador", "Venezuela"],
  D: ["Uruguay", "Paraguay", "Panama", "Costa Rica"],
  E: ["England", "Germany", "Netherlands", "Belgium"],
  F: ["France", "Spain", "Portugal", "Italy"],
  G: ["Switzerland", "Denmark", "Sweden", "Norway"],
  H: ["Croatia", "Poland", "Czech Republic", "Austria"],
  I: ["Morocco", "Senegal", "Egypt", "Nigeria"],
  J: ["Cameroon", "Tunisia", "Ghana", "Ivory Coast"],
  K: ["Japan", "South Korea", "Australia", "Iran"],
  L: ["Saudi Arabia", "Qatar", "UAE", "Bahrain"],
};

const ALL_TEAMS = new Set(Object.values(WC2026_GROUPS).flat());
const GROUP_LETTERS = Object.keys(WC2026_GROUPS);

function validateBracket(b: unknown): { valid: boolean; error?: string } {
  if (!b || typeof b !== "object") return { valid: false, error: "bracket must be an object" };
  const bracket = b as Partial<BracketData>;

  // Validate groups
  if (!bracket.groups || typeof bracket.groups !== "object") {
    return { valid: false, error: "bracket.groups is required" };
  }
  for (const letter of GROUP_LETTERS) {
    const g = bracket.groups[letter];
    if (!g || typeof g.first !== "string" || typeof g.second !== "string") {
      return { valid: false, error: `Group ${letter}: first and second picks required` };
    }
    const teams = WC2026_GROUPS[letter];
    if (!teams.includes(g.first)) {
      return { valid: false, error: `Group ${letter}: "${g.first}" is not in that group` };
    }
    if (!teams.includes(g.second)) {
      return { valid: false, error: `Group ${letter}: "${g.second}" is not in that group` };
    }
    if (g.first === g.second) {
      return { valid: false, error: `Group ${letter}: first and second picks must be different` };
    }
  }

  // Validate knockout rounds
  const rounds: { key: keyof BracketData; count: number; label: string }[] = [
    { key: "r16",   count: 16, label: "r16"   },
    { key: "qf",    count: 8,  label: "qf"    },
    { key: "sf",    count: 4,  label: "sf"    },
    { key: "final", count: 2,  label: "final" },
  ];

  for (const round of rounds) {
    const arr = bracket[round.key] as string[] | undefined;
    if (!Array.isArray(arr) || arr.length !== round.count) {
      return { valid: false, error: `${round.label} must have exactly ${round.count} team names` };
    }
    for (const team of arr) {
      if (!ALL_TEAMS.has(team)) {
        return { valid: false, error: `${round.label}: "${team}" is not a valid WC 2026 team` };
      }
    }
  }

  if (typeof bracket.winner !== "string" || !ALL_TEAMS.has(bracket.winner)) {
    return { valid: false, error: "winner must be a valid WC 2026 team" };
  }

  return { valid: true };
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireAuth();

    const [bracketRes, resultsRes] = await Promise.all([
      query(
        `SELECT points, metadata, played_at FROM game_scores
         WHERE user_id = $1 AND game_type = 'bracket' AND reference_id = 1`,
        [user.userId]
      ),
      query(
        `SELECT stage, matchup, winner, recorded_at FROM bracket_results ORDER BY recorded_at ASC`
      ),
    ]);

    const results = resultsRes.rows as {
      stage: string;
      matchup: string;
      winner: string;
      recorded_at: string;
    }[];

    if (bracketRes.rows.length === 0) {
      return NextResponse.json({ submitted: false, results });
    }

    const row = bracketRes.rows[0];
    return NextResponse.json({
      submitted: true,
      points: row.points,
      submittedAt: row.played_at,
      bracket: row.metadata as BracketData,
      results,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json() as { bracket?: unknown };

    const validation = validateBracket(body.bracket);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bracket = body.bracket as BracketData;

    const insertRes = await query(
      `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
       VALUES ($1, 'bracket', 1, 0, $2, NOW())
       ON CONFLICT (user_id, game_type, reference_id) DO NOTHING
       RETURNING id`,
      [user.userId, JSON.stringify(bracket)]
    );

    if (insertRes.rowCount === 0) {
      return NextResponse.json(
        { error: "You have already submitted your bracket. It cannot be changed." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, message: "Bracket locked in successfully!" });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
