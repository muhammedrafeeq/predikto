import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET /api/admin/users
export async function GET() {
  try {
    const usersRes = await query(
      `SELECT 
        u.id, 
        u.name, 
        u.phone, 
        u.role, 
        u.is_active, 
        u.created_at,
        COUNT(DISTINCT p.id) as predictions_count,
        COALESCE(
          ROUND(
            (COUNT(DISTINCT CASE WHEN p.answer = r.correct_answer THEN p.id END) * 100.0) / 
            NULLIF(COUNT(DISTINCT CASE WHEN r.correct_answer IS NOT NULL THEN p.id END), 0)
          ), 0
        ) as win_rate
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      LEFT JOIN results r ON p.question_id = r.question_id AND p.match_id = r.match_id
      GROUP BY u.id, u.name, u.phone, u.role, u.is_active, u.created_at
      ORDER BY u.created_at DESC`
    );

    const users = usersRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      predictionsCount: parseInt(row.predictions_count, 10),
      winRate: parseInt(row.win_rate, 10),
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("GET Admin Users API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, pin, role } = body;

    if (!name || !phone || !pin) {
      return NextResponse.json(
        { error: "Name, phone number, and PIN are required" },
        { status: 400 }
      );
    }

    const trimmedPhone = phone.trim();

    // Check if phone number is already registered
    const existsRes = await query(
      "SELECT id FROM users WHERE phone = $1 LIMIT 1",
      [trimmedPhone]
    );

    if (existsRes.rowCount !== null && existsRes.rowCount > 0) {
      return NextResponse.json(
        { error: "Phone number is already registered" },
        { status: 400 }
      );
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);
    const userRole = role || "user";

    // Insert user
    const insertRes = await query(
      `INSERT INTO users (name, phone, pin_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, phone, role, is_active, created_at`,
      [name, trimmedPhone, pinHash, userRole]
    );

    const newUser = insertRes.rows[0];

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          isActive: newUser.is_active,
          createdAt: newUser.created_at,
          predictionsCount: 0,
          winRate: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Admin Users API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
