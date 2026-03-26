import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getSupabaseBusinessId, getSupabaseClientsTable } from "@/core/config/supabaseEnv";
import { clientFromRow, type ClientRow } from "@/core/storage/supabase/mappers";
import type { Client } from "@/core/types/client";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שמירת לקוחות אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשה לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בשמירת הלקוח. נסו שוב.";

function parseNewStudent(
  raw: unknown,
): Omit<Client, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const fullName = typeof o.fullName === "string" ? o.fullName.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const notes = typeof o.notes === "string" ? o.notes.trim() : "";
  const customFields =
    o.customFields && typeof o.customFields === "object" && !Array.isArray(o.customFields)
      ? (o.customFields as Record<string, unknown>)
      : {};
  if (fullName.length < 2) return null;
  return {
    id: typeof o.id === "string" ? o.id.trim() : undefined,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    fullName,
    phone,
    notes,
    customFields,
  };
}

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const table = getSupabaseClientsTable();
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("business_id", businessId)
      .order("full_name", { ascending: true });

    if (error) {
      console.error("[students/get]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const students: Client[] = [];
    for (const row of data ?? []) {
      const parsed = clientFromRow(row as unknown as ClientRow);
      if (parsed) students.push(parsed);
    }
    return NextResponse.json({ ok: true as const, students });
  } catch (e) {
    console.error("[students/get]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }
  const parsed = parseNewStudent(raw);
  if (!parsed) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = parsed.id && parsed.id.length > 0 ? parsed.id : randomUUID();
  const createdAt = parsed.createdAt ?? now;
  const updatedAt = parsed.updatedAt ?? now;

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const table = getSupabaseClientsTable();

    const { error } = await supabase.from(table).insert({
      id,
      business_id: businessId,
      full_name: parsed.fullName,
      phone: parsed.phone,
      notes: parsed.notes,
      custom_fields: parsed.customFields,
      created_at: createdAt,
      updated_at: updatedAt,
    });
    if (error) {
      console.error("[students/post]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    return NextResponse.json({
      ok: true as const,
      student: {
        id,
        fullName: parsed.fullName,
        phone: parsed.phone,
        notes: parsed.notes,
        customFields: parsed.customFields,
        createdAt,
        updatedAt,
      } satisfies Client,
    });
  } catch (e) {
    console.error("[students/post]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
