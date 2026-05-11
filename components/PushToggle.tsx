"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "unsupported" | "off" | "on";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setError(null);
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register("/sw.js"));
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setError("Permiso denegado");
        return;
      }
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        setError("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const res = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        setError("No se pudo registrar la suscripción");
        return;
      }
      setState("on");
    } catch (e) {
      setError(String(e));
    }
  }

  async function disable() {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push-subscribe", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setState("off");
  }

  if (state === "loading") return <p className="text-sm text-stone-500">Cargando...</p>;
  if (state === "unsupported")
    return (
      <p className="text-sm text-amber-300">
        Tu navegador no soporta notificaciones push. Instala la app desde Safari (Compartir → Añadir a pantalla de inicio) y vuelve a entrar.
      </p>
    );

  return (
    <div className="space-y-2">
      {state === "on" ? (
        <button
          type="button"
          onClick={disable}
          className="w-full py-3 rounded-xl bg-stone-800 text-stone-200 font-semibold"
        >
          Desactivar recordatorio
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          className="w-full py-3 rounded-xl bg-stone-100 text-stone-950 font-semibold"
        >
          Activar recordatorio diario
        </button>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
