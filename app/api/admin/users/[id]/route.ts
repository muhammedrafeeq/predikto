import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive, name, phone, role } = body;

    const fields: string[] = [];
    const values: unknown[] = [];
    let valIndex = 1;

    if (isActive !== undefined) {
      fields.push(`is_active = $${valIndex++}`);
      values.push(isActive);
    }
    if (name !== undefined) {
      fields.push(`name = $${valIndex++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      fields.push(`phone = $${valIndex++}`);
      values.push(phone);
    }
    if (role !== undefined) {
      fields.push(`role = $${valIndex++}`);
      values.push(role);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update" },
        { status: 400 }
      );
    }

    // Add ID as the final parameter
    values.push(id);
    const updateQuery = `
      UPDATE users 
      SET ${fields.join(", ")} 
      WHERE id = $${valIndex} 
      RETURNING id, name, phone, role, is_active as "isActive", created_at as "createdAt"
    `;

    const res = await query(updateQuery, values);

    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: res.rows[0],
    });
  } catch (error) {
    console.error("PATCH Admin User API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
