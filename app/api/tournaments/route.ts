import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// GET /api/tournaments - Get all active/upcoming tournaments
export async function GET() {
  try {
    await requireAuth();

    const result = await query(
      `SELECT id, name, description, type, status, created_at as "createdAt"
       FROM tournaments
       WHERE status != 'completed'
       ORDER BY id ASC`
    );

    return NextResponse.json({ success: true, tournaments: result.rows });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

// POST /api/tournaments - Create a tournament (Admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json() as { name?: string; description?: string; type?: string };
    const { name, description, type } = body;

    if (!name) {
      return NextResponse.json({ error: "Tournament name is required" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO tournaments (name, description, type, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, name, description, type, status, created_at as "createdAt"`,
      [name, description || "", type || "league"]
    );

    return NextResponse.json({ success: true, tournament: result.rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
