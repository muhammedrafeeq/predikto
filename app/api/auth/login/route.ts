import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, pin } = body;

    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Phone number and PIN are required" },
        { status: 400 }
      );
    }

    const trimmedPhone = phone.trim();

    // Query database for the active user
    const res = await query(
      "SELECT * FROM users WHERE phone = $1 AND is_active = true LIMIT 1",
      [trimmedPhone]
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: "Invalid phone number or PIN" },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // Compare PIN
    const isMatch = await bcrypt.compare(pin, user.pin_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid phone number or PIN" },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
