import { NextResponse } from "next/server";

import { getSupabaseBusinessId, getSupabaseClientsTable } from "@/core/config/supabaseEnv";
import type { Client } from "@/core/types/client";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שמירת לקוחות אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשה לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בעדכון הלקוח. נסו שוב.";

function parsePatch(raw: unknown): Partial<Omit<Client, "id" | "createdAt">> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const next: Partial<Omit<Client, "id" | "createdAt">> = {};

  if ("fullName" in o) {
    if (typeof o.fullName !== "string" || o.fullName.trim().length < 2) return null;
    next.fullName = o.fullName.trim();
  }
  if ("phone" in o) {
    if (typeof o.phone !== "string") return null;
    next.phone = o.phone.trim();
  }
  if ("notes" in o) {
    if (typeof o.notes !== "string") return null;
    next.notes = o.notes.trim();
  }
  if ("customFields" in o) {
    if (!o.customFields || typeof o.customFields !== "object" || Array.isArray(o.customFields)) {
      return null;
    }
    next.customFields = o.customFields as Record<string, unknown>;
  }

  return next;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }
  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }
  const patch = parsePatch(raw);
  if (!patch) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const businessId = getSupabaseBusinessId();
    const table = getSupabaseClientsTable();
    const supabase = getSupabaseAdminClient();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.fullName !== undefined) payload.full_name = patch.fullName;
    if (patch.phone !== undefined) payload.phone = patch.phone;
    if (patch.notes !== undefined) payload.notes = patch.notes;
    if (patch.customFields !== undefined) payload.custom_fields = patch.customFields;

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .eq("business_id", businessId);
    if (error) {
      console.error("[students/put]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[students/put]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }
  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const businessId = getSupabaseBusinessId();
    const table = getSupabaseClientsTable();
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);
    if (error) {
      console.error("[students/delete]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[students/delete]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
