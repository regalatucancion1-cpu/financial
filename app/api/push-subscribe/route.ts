import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const body = await request.json();
  const endpoint = body.endpoint as string;
  const p256dh = body.keys?.p256dh as string;
  const auth = body.keys?.auth as string;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }

  // upsert by endpoint
  const ua = request.headers.get("user-agent") ?? null;
  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint, p256dh, auth, user_agent: ua },
    { onConflict: "endpoint" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: "no endpoint" }, { status: 400 });
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
