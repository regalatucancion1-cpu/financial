"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import {
  CATEGORIES,
  BUSINESSES,
  autoTag,
  type CategoryDef,
} from "@/lib/categories";
import type { Scope, Business, Confidence } from "@/lib/types";

type Mode = "gasto" | "ingreso";

interface Props {
  recentMerchants: string[];
}

const QUICK = [
  "Mercadona",
  "Glovo",
  "Gasolinera",
  "Bar",
  "Uber",
  "Spotify",
];

export function CaptureForm({ recentMerchants }: Props) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [mode, setMode] = useState<Mode>("gasto");

  // Shared
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  // Gasto
  const [category, setCategory] = useState<string>("comida_super");
  const [scope, setScope] = useState<Scope>("personal");
  const [business, setBusiness] = useState<Business>("savage_party");
  const [confidence, setConfidence] = useState<Confidence>("auto");
  const [autoTagged, setAutoTagged] = useState(false);

  // Ingreso
  const [payer, setPayer] = useState("");
  const [incomeBusiness, setIncomeBusiness] = useState<Business>("savage_party");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Auto-tag when merchant changes
  useEffect(() => {
    if (mode !== "gasto") return;
    if (!merchant) {
      setAutoTagged(false);
      return;
    }
    const tag = autoTag(merchant);
    if (tag) {
      setCategory(tag.category);
      setScope(tag.scope);
      setConfidence(tag.confidence);
      setAutoTagged(true);
    } else {
      setAutoTagged(false);
      setConfidence("confirmed");
    }
  }, [merchant, mode]);

  const visibleCategories: CategoryDef[] = CATEGORIES.filter(
    (c) => c.scope === scope && c.id !== "transferencia_propia"
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function reset() {
    setAmount("");
    setMerchant("");
    setPayer("");
    setAutoTagged(false);
    setConfidence("auto");
  }

  async function save() {
    if (!amount || Number(amount) <= 0) {
      showToast("Falta el importe");
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showToast("Sesión caducada");
      setSaving(false);
      return;
    }

    if (mode === "gasto") {
      const amt = Number(amount);
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        date,
        amount: amt,
        currency: "EUR",
        fx_eur: amt,
        merchant: merchant || null,
        raw_input: null,
        category,
        scope,
        business: scope === "negocio" ? business : null,
        deductible: scope === "negocio",
        confidence,
      });
      if (error) {
        showToast("Error: " + error.message);
      } else {
        showToast(`Apuntado ${amt.toFixed(2).replace(".", ",")}€`);
        reset();
      }
    } else {
      const gross = Number(amount);
      const { error } = await supabase.from("income").insert({
        user_id: user.id,
        date,
        gross,
        currency: "EUR",
        payer: payer || null,
        business: incomeBusiness,
        net: gross,
      });
      if (error) {
        showToast("Error: " + error.message);
      } else {
        showToast(`Ingreso ${gross.toFixed(2).replace(".", ",")}€`);
        reset();
      }
    }
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("gasto")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
            mode === "gasto"
              ? "bg-stone-100 text-stone-950"
              : "bg-stone-900 text-stone-400 border border-stone-800"
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => setMode("ingreso")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
            mode === "ingreso"
              ? "bg-emerald-500 text-stone-950"
              : "bg-stone-900 text-stone-400 border border-stone-800"
          }`}
        >
          Ingreso
        </button>
      </div>

      <div>
        <label className="block text-xs text-stone-500 mb-1">Importe</label>
        <div className="relative">
          <input
            inputMode="decimal"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full bg-stone-900 border border-stone-800 rounded-2xl px-5 py-6 text-4xl font-bold text-center tabular-nums focus:outline-none focus:border-stone-500"
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl text-stone-500">
            €
          </span>
        </div>
      </div>

      {mode === "gasto" ? (
        <>
          <div>
            <label className="block text-xs text-stone-500 mb-1">
              ¿Dónde?
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Mercadona, Glovo, gasolinera..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 focus:outline-none focus:border-stone-500"
            />
            {(QUICK.length > 0 || recentMerchants.length > 0) && (
              <div className="flex gap-2 mt-2 overflow-x-auto -mx-4 px-4 pb-1">
                {[...new Set([...recentMerchants.slice(0, 4), ...QUICK])]
                  .slice(0, 8)
                  .map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMerchant(m)}
                      className="shrink-0 px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-full text-stone-300 hover:border-stone-600"
                    >
                      {m}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setScope("personal")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  scope === "personal"
                    ? "bg-stone-100 text-stone-950"
                    : "bg-stone-900 text-stone-400 border border-stone-800"
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => setScope("negocio")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  scope === "negocio"
                    ? "bg-amber-400 text-stone-950"
                    : "bg-stone-900 text-stone-400 border border-stone-800"
                }`}
              >
                Negocio (deducible)
              </button>
            </div>
            {autoTagged && (
              <p className="text-xs text-stone-500">
                Categoría asignada automáticamente
                {confidence === "soft" ? ", revisa al cierre" : ""}.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-2">
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategory(c.id);
                    setConfidence("confirmed");
                  }}
                  className={`px-2 py-3 rounded-xl text-xs font-semibold transition border ${
                    category === c.id
                      ? "bg-stone-100 text-stone-950 border-stone-100"
                      : "bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-600"
                  }`}
                >
                  <span className="block text-lg mb-0.5">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {scope === "negocio" && (
            <div>
              <label className="block text-xs text-stone-500 mb-2">
                ¿Qué negocio?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUSINESSES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBusiness(b.id)}
                    className={`px-2 py-2 rounded-lg text-xs font-semibold transition border ${
                      business === b.id
                        ? "bg-amber-400 text-stone-950 border-amber-400"
                        : "bg-stone-900 text-stone-300 border-stone-800"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs text-stone-500 mb-1">
              ¿Quién paga?
            </label>
            <input
              type="text"
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              placeholder="Cliente, agencia, boda..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 focus:outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-2">Negocio</label>
            <div className="grid grid-cols-3 gap-2">
              {BUSINESSES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setIncomeBusiness(b.id)}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition border ${
                    incomeBusiness === b.id
                      ? "bg-emerald-500 text-stone-950 border-emerald-500"
                      : "bg-stone-900 text-stone-300 border-stone-800"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs text-stone-500 mb-1">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 focus:outline-none focus:border-stone-500"
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className={`w-full py-5 rounded-2xl text-lg font-bold transition disabled:opacity-50 ${
          mode === "gasto"
            ? "bg-stone-100 text-stone-950"
            : "bg-emerald-500 text-stone-950"
        }`}
      >
        {saving ? "Guardando..." : mode === "gasto" ? "Apuntar gasto" : "Apuntar ingreso"}
      </button>

      {toast && (
        <div className="fixed bottom-28 inset-x-0 mx-auto max-w-md px-4">
          <div className="bg-stone-100 text-stone-950 px-4 py-3 rounded-xl text-center font-semibold shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
