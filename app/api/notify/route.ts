import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    return NextResponse.json({ error: "vapid not configured" }, { status: 500 });
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, user_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const kind = new URL(request.url).searchParams.get("kind");
  let payloadObj: { title: string; body: string; url: string };
  if (kind === "capital") {
    payloadObj = {
      title: "Actualiza tu capital",
      body: "Es 1 de mes. Mete el valor actual de tus inversiones.",
      url: "/inversiones",
    };
  } else if (kind === "snapshot") {
    payloadObj = {
      title: "Snapshot mensual",
      body: "Es 1 de mes. Apunta los saldos de tus cuentas en /sistema.",
      url: "/sistema",
    };
  } else {
    payloadObj = {
      title: "Hora de apuntar los gastos",
      body: "Antes de dormir, dile a la app dónde se ha ido el día.",
      url: "/",
    };
  }
  const payload = JSON.stringify(payloadObj);

  const results = await Promise.allSettled(
    (subs ?? []).map((s) =>
      webpush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        payload
      )
    )
  );

  // Clean up gone subscriptions (404/410).
  const toDelete: string[] = [];
  results.forEach((r, i) => {
    if (
      r.status === "rejected" &&
      typeof r.reason === "object" &&
      r.reason !== null &&
      "statusCode" in r.reason &&
      (r.reason.statusCode === 404 || r.reason.statusCode === 410)
    ) {
      toDelete.push(subs![i].id);
    }
  });
  if (toDelete.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", toDelete);
  }

  const ok = results.filter((r) => r.status === "fulfilled").length;
  const fail = results.length - ok;
  return NextResponse.json({ sent: ok, failed: fail, cleaned: toDelete.length });
}
