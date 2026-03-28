import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AnalyticsEventBody = {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: string;
  userAgent: string;
  url: string;
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as AnalyticsEventBody;

    // In production, you would:
    // 1. Send to your analytics service (Mixpanel, Amplitude, etc.)
    // 2. Store in database for custom dashboards
    // 3. Send to data warehouse

    // For now, just log
    console.log("[Analytics Event]", {
      event: body.event,
      properties: body.properties,
      timestamp: body.timestamp,
      url: body.url,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Analytics API] error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
