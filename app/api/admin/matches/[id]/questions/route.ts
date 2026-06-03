import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/admin/matches/[id]/questions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = parseInt(id, 10);

    const questionsRes = await query(
      "SELECT id, type, label, points FROM questions WHERE match_id = $1 ORDER BY id ASC",
      [matchId]
    );

    return NextResponse.json({
      success: true,
      questions: questionsRes.rows,
    });
  } catch (error) {
    console.error("GET Admin Match Questions Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/matches/[id]/questions
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = parseInt(id, 10);
    const body = await request.json();
    const { questions } = body;

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Questions must be an array" },
        { status: 400 }
      );
    }

    for (const q of questions) {
      const qId = parseInt(q.id, 10);
      const points = parseInt(q.points, 10);
      const label = q.label;

      if (isNaN(qId) || isNaN(points) || !label) {
        return NextResponse.json(
          { error: "Invalid question data format" },
          { status: 400 }
        );
      }

      await query(
        `UPDATE questions 
         SET label = $1, points = $2 
         WHERE id = $3 AND match_id = $4`,
        [label, points, qId, matchId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT Admin Match Questions Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
