import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const adjectives = ["Swift", "Bold", "Fierce", "Sharp", "Epic", "Wild", "Brave", "Clutch", "Solid", "Elite", "Prime", "Rapid", "Ace", "Flash", "Turbo"];
const nouns = ["Eagle", "Hawk", "Tiger", "Wolf", "Lion", "Fox", "Bear", "Striker", "Wizard", "Falcon", "Rocket", "Blaze", "Storm", "Viper", "Puma"];

function randomGuestName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
}

function randomPhone() {
  // 12-digit starting with "0000" — not a real phone format, unique enough
  const suffix = Math.floor(10000000 + Math.random() * 90000000).toString();
  return "0000" + suffix;
}

function randomPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST() {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    let name = "";
    let phone = "";
    let pin = "";
    let userId = 0;

    for (let attempt = 0; attempt < 5; attempt++) {
      name = randomGuestName();
      phone = randomPhone();
      pin = randomPin();

      const pin_hash = await bcrypt.hash(pin, 10);

      try {
        const result = await query(
          `INSERT INTO users (name, phone, pin_hash, role, is_active)
           VALUES ($1, $2, $3, 'guest', true)
           RETURNING id`,
          [name, phone, pin_hash]
        );
        userId = result.rows[0].id;
        break;
      } catch (err: unknown) {
        if ((err as { code?: string }).code === "23505") continue; // phone collision, retry
        throw err;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Could not create guest account" }, { status: 500 });
    }

    const token = jwt.sign(
      { userId, name, role: "guest" },
      jwtSecret,
      { expiresIn: "7d" }
    );

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: { id: userId, name, role: "guest" },
      credentials: { phone, pin },
    });
  } catch (error) {
    console.error("Guest API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
