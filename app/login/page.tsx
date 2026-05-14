"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("chrislogz0@gmail.com");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setStatus("loading");
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({ email });
    setStatus("idle");
    if (error) {
      setError(error.message);
    } else {
      setStep("code");
    }
  }

  async function verify() {
    setStatus("loading");
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setStatus("idle");
      setError(error.message);
      return;
    }
    window.location.href = "/";
  }

  return (
    <div className="min-h-[80vh] flex flex-col justify-center space-y-6">
      <header>
        <p className="text-xs text-stone-500 uppercase tracking-widest">
          Control Financiero
        </p>
        <h1 className="text-3xl font-bold mt-1">Entrar</h1>
      </header>

      {step === "email" ? (
        <div className="space-y-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-stone-500"
          />
          <button
            type="button"
            onClick={sendCode}
            disabled={status === "loading" || !email}
            className="w-full py-4 rounded-xl bg-stone-100 text-stone-950 font-bold disabled:opacity-50"
          >
            {status === "loading" ? "Enviando..." : "Mándame un código"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-stone-300">
            Te mandé un código de 6 dígitos a {email}. Míralo en el correo y
            escríbelo aquí.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="------"
            maxLength={6}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-4 text-2xl tracking-[0.5em] text-center focus:outline-none focus:border-stone-500"
          />
          <button
            type="button"
            onClick={verify}
            disabled={status === "loading" || code.length < 6}
            className="w-full py-4 rounded-xl bg-stone-100 text-stone-950 font-bold disabled:opacity-50"
          >
            {status === "loading" ? "Comprobando..." : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="w-full py-2 text-sm text-stone-500"
          >
            Usar otro email
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
