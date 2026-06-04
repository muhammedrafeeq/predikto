import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, pin } = body;

    // Validate required fields
    if (!name || !phone || !pin) {
      return NextResponse.json(
        { error: "Name, phone number, and password are required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // Validate name
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Validate phone (digits only, 7–15 chars)
    if (!/^\d{7,15}$/.test(trimmedPhone.replace(/[\s\-\(\)]/g, ""))) {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
        { status: 400 }
      );
    }

    // Validate 6-digit numeric PIN
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "Password must be exactly 6 digits" },
        { status: 400 }
      );
    }

    // Check if phone already registered
    const existing = await query(
      "SELECT id FROM users WHERE phone = $1 LIMIT 1",
      [trimmedPhone]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        { error: "This phone number is already registered" },
        { status: 409 }
      );
    }

    // Hash the PIN
    const pin_hash = await bcrypt.hash(pin, 10);

    // Insert new user with role 'user'
    const result = await query(
      `INSERT INTO users (name, phone, pin_hash, role, is_active)
       VALUES ($1, $2, $3, 'user', true)
       RETURNING id, name, phone, role`,
      [trimmedName, trimmedPhone, pin_hash]
    );

    const newUser = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful! You can now log in.",
        user: {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
