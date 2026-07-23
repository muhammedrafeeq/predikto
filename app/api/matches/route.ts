import { NextResponse } from "next/server";
import { fetchLiveMatches } from "@/lib/espn";

export async function GET() {
  try {
    const matches = await fetchLiveMatches();
    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error("GET Matches API Error:", error);
    return NextResponse.json({ success: false, matches: [] }, { status: 500 });
  }
}
