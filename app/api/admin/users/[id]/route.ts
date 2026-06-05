import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/gameAuth";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { isActive, name, phone, role, pin } = body;

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
    if (pin !== undefined) {
      const hashed = await bcrypt.hash(String(pin), 10);
      fields.push(`pin_hash = $${valIndex++}`);
      values.push(hashed);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update" },
        { status: 400 }
      );
    }

    values.push(id);
    const updateQuery = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${valIndex}
      RETURNING id, name, phone, role, is_active as "isActive", created_at as "createdAt"
    `;

    const res = await query(updateQuery, values);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error) {
    console.error("PATCH Admin User API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Delete cascading data then the user
    await query("DELETE FROM scores WHERE user_id = $1", [id]);
    await query("DELETE FROM predictions WHERE user_id = $1", [id]);
    await query("DELETE FROM notifications WHERE user_id = $1", [id]).catch(() => {});
    await query("DELETE FROM push_subscriptions WHERE user_id = $1", [id]).catch(() => {});

    const res = await query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Admin User API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
