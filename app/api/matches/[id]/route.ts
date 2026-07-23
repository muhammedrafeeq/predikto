import { NextResponse } from "next/server";
import { fetchEspnMatchDetail } from "@/lib/espn";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
    }

    const detail = await fetchEspnMatchDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Match details not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      match: detail.match,
      venue: detail.venue,
      stats: detail.stats,
      keyEvents: detail.keyEvents,
      commentary: detail.commentary,
      rosters: detail.rosters,
      news: detail.news,
      h2h: detail.h2h,
    });
  } catch (error) {
    console.error("GET Match Detail API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
