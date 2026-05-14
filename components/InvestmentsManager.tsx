"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { INVESTMENT_KINDS, type Investment, type InvestmentKind } from "@/lib/types";

interface Props {
  initial: Investment[];
}

function eur(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function kindLabel(k: InvestmentKind) {
  return INVESTMENT_KINDS.find((x) => x.id === k)?.label ?? k;
}

const EMPTY = {
  name: "",
  kind: "accion_etf" as InvestmentKind,
  invested: "",
  current_value: "",
};

export function InvestmentsManager({ initial }: Props) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [list, setList] = useState<Investment[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalInvested = list.reduce((s, i) => s + Number(i.invested), 0);
  const totalValue = list.reduce((s, i) => s + Number(i.current_value), 0);
  const delta = totalValue - totalInvested;
  const deltaPct = totalInvested > 0 ? (delta / totalInvested) * 100 : 0;

  function openAdd() {
    setForm(EMPTY);
    setEditingId(null);
    setAdding(true);
    setError(null);
  }

  function openEdit(inv: Investment) {
    setForm({
      name: inv.name,
      kind: inv.kind,
      invested: String(inv.invested),
      current_value: String(inv.current_value),
    });
    setAdding(false);
    setEditingId(inv.id);
    setError(null);
  }

  function closeForm() {
    setAdding(false);
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  }

  async function save() {
    const invested = Number(form.invested || 0);
    const current = Number(form.current_value || form.invested || 0);
    if (!form.name.trim()) {
      setError("Ponle un nombre");
      return;
    }
    setBusy(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión caducada, recarga la página");
      setBusy(false);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);

    if (editingId) {
      const { data, error } = await supabase
        .from("investments")
        .update({
          name: form.name.trim(),
          kind: form.kind,
          invested,
          current_value: current,
          value_updated_at: today,
        })
        .eq("id", editingId)
        .select()
        .single();
      if (error) {
        setError(error.message);
      } else {
        setList((l) => l.map((i) => (i.id === editingId ? (data as Investment) : i)));
        closeForm();
      }
    } else {
      const { data, error } = await supabase
        .from("investments")
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          kind: form.kind,
          invested,
          current_value: current,
          value_updated_at: today,
        })
        .select()
        .single();
      if (error) {
        setError(error.message);
      } else {
        setList((l) => [data as Investment, ...l]);
        closeForm();
      }
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar esta inversión?")) return;
    setBusy(true);
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (!error) {
      setList((l) => l.filter((i) => i.id !== id));
      closeForm();
    } else {
      setError(error.message);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <p className="text-xs text-stone-500 uppercase tracking-wider">
            Invertido
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {eur(totalInvested)}
          </p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <p className="text-xs text-stone-500 uppercase tracking-wider">
            Valor actual
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {eur(totalValue)}
          </p>
        </div>
        <div className="col-span-2 bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <p className="text-xs text-stone-500 uppercase tracking-wider">
            Ganancia / pérdida
          </p>
          <p
            className={`text-2xl font-bold tabular-nums mt-1 ${
              delta >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {eur(delta)}
            {totalInvested > 0 && (
              <span className="text-base ml-2">
                ({delta >= 0 ? "+" : ""}
                {deltaPct.toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
      </div>

      {!adding && !editingId && (
        <button
          type="button"
          onClick={openAdd}
          className="w-full py-4 rounded-2xl bg-stone-100 text-stone-950 font-bold"
        >
          + Añadir inversión
        </button>
      )}

      {(adding || editingId) && (
        <div className="bg-stone-900 border border-stone-700 rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold">
            {editingId ? "Editar inversión" : "Nueva inversión"}
          </h2>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="S&P 500, plan de pensiones..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Tipo</label>
            <div className="flex gap-2">
              {INVESTMENT_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setForm({ ...form, kind: k.id })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border ${
                    form.kind === k.id
                      ? "bg-stone-100 text-stone-950 border-stone-100"
                      : "bg-stone-950 text-stone-300 border-stone-800"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">
                Invertido
              </label>
              <input
                inputMode="decimal"
                type="number"
                step="0.01"
                value={form.invested}
                onChange={(e) => setForm({ ...form, invested: e.target.value })}
                placeholder="0,00"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-3 tabular-nums focus:outline-none focus:border-stone-500"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">
                Valor actual
              </label>
              <input
                inputMode="decimal"
                type="number"
                step="0.01"
                value={form.current_value}
                onChange={(e) =>
                  setForm({ ...form, current_value: e.target.value })
                }
                placeholder="0,00"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-3 tabular-nums focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Si dejas el valor actual vacío, se usa el invertido.
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-950 font-bold disabled:opacity-50"
            >
              {busy ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={busy}
              className="px-4 py-3 rounded-xl bg-stone-800 text-stone-300 font-semibold"
            >
              Cancelar
            </button>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => remove(editingId)}
              disabled={busy}
              className="w-full py-2 text-sm text-red-400"
            >
              Borrar inversión
            </button>
          )}
        </div>
      )}

      {list.length === 0 && !adding ? (
        <p className="text-stone-500 text-sm">
          Aún no has añadido ninguna inversión.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((inv) => {
            const d = Number(inv.current_value) - Number(inv.invested);
            const dPct =
              Number(inv.invested) > 0
                ? (d / Number(inv.invested)) * 100
                : 0;
            return (
              <li key={inv.id}>
                <button
                  type="button"
                  onClick={() => openEdit(inv)}
                  className="w-full text-left bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-stone-600 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{inv.name}</p>
                      <p className="text-xs text-stone-500">
                        {kindLabel(inv.kind)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold tabular-nums">
                        {eur(Number(inv.current_value))}
                      </p>
                      <p
                        className={`text-xs tabular-nums ${
                          d >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {d >= 0 ? "+" : ""}
                        {eur(d)} ({d >= 0 ? "+" : ""}
                        {dPct.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    Invertido {eur(Number(inv.invested))}
                    {inv.value_updated_at
                      ? ` · actualizado ${new Date(
                          inv.value_updated_at
                        ).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}`
                      : ""}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
