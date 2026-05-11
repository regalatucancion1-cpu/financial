"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("chrislogz0@gmail.com");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setStatus("sending");
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center space-y-6">
      <header>
        <p className="text-xs text-stone-500 uppercase tracking-widest">
          Control Financiero
        </p>
        <h1 className="text-3xl font-bold mt-1">Entrar</h1>
      </header>

      {status === "sent" ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
          <p className="font-semibold text-emerald-300">Mira el correo</p>
          <p className="text-sm text-stone-300 mt-1">
            Te he enviado un enlace mágico a {email}. Ábrelo desde el iPhone.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-stone-500"
          />
          <button
            type="button"
            onClick={send}
            disabled={status === "sending" || !email}
            className="w-full py-4 rounded-xl bg-stone-100 text-stone-950 font-bold disabled:opacity-50"
          >
            {status === "sending" ? "Enviando..." : "Mándame un enlace"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
