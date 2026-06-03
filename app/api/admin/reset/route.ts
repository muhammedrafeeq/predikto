import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  try {
    await query("TRUNCATE predictions, results, scores RESTART IDENTITY CASCADE");
    await query("UPDATE matches SET status = 'upcoming' WHERE status = 'resulted'");
    return NextResponse.json({ success: true, message: "All predictions, results and scores cleared" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
