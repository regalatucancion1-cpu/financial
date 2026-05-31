"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { SNAPSHOT_ACCOUNTS, type MonthlySnapshot } from "@/lib/types";

interface Props {
  initial: MonthlySnapshot[];
}

function eur(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function firstOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function monthLabel(iso: string) {
  const [y, m] = iso.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

const NUM_FIELDS = [
  ...SNAPSHOT_ACCOUNTS.map((a) => a.id),
  "pendiente_cobrar_neto",
  "iva_pendiente",
  "irpf_pendiente",
] as const;

type NumField = (typeof NUM_FIELDS)[number];

function emptyForm(month: string) {
  const base: Record<string, string> = { snapshot_month: month, notes: "" };
  for (const f of NUM_FIELDS) base[f] = "";
  return base;
}

function netWorth(s: Partial<Record<NumField, number>>) {
  const assets =
    (s.bbva_trabajo ?? 0) +
    (s.bbva_personal ?? 0) +
    (s.bbva_impuestos ?? 0) +
    (s.trade_republic ?? 0) +
    (s.myinvestor ?? 0) +
    (s.acciones ?? 0) +
    (s.revolut ?? 0) +
    (s.conjunta ?? 0) +
    (s.cash_b ?? 0) +
    (s.pendiente_cobrar_neto ?? 0);
  const liabilities = (s.iva_pendiente ?? 0) + (s.irpf_pendiente ?? 0);
  return assets - liabilities;
}

export function SnapshotManager({ initial }: Props) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [list, setList] = useState<MonthlySnapshot[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(emptyForm(firstOfMonth()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...list].sort((a, b) => b.snapshot_month.localeCompare(a.snapshot_month));
  const latest = sorted[0];
  const previous = sorted[1];

  const latestNet = latest ? netWorth(latest) : 0;
  const previousNet = previous ? netWorth(previous) : 0;
  const delta = latest && previous ? latestNet - previousNet : null;

  function openAdd() {
    setForm(emptyForm(firstOfMonth()));
    setEditingId(null);
    setAdding(true);
    setError(null);
  }

  function openEdit(s: MonthlySnapshot) {
    const f: Record<string, string> = {
      snapshot_month: s.snapshot_month,
      notes: s.notes ?? "",
    };
    for (const k of NUM_FIELDS) f[k] = String(s[k] ?? "");
    setForm(f);
    setAdding(false);
    setEditingId(s.id);
    setError(null);
  }

  function closeForm() {
    setAdding(false);
    setEditingId(null);
    setForm(emptyForm(firstOfMonth()));
    setError(null);
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function preview() {
    const data: Partial<Record<NumField, number>> = {};
    for (const f of NUM_FIELDS) data[f] = Number(form[f] || 0);
    return netWorth(data);
  }

  async function save() {
    if (!form.snapshot_month) {
      setError("Pon una fecha");
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

    const payload: Record<string, unknown> = {
      snapshot_month: form.snapshot_month,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    for (const f of NUM_FIELDS) payload[f] = Number(form[f] || 0);

    if (editingId) {
      const { data, error } = await supabase
        .from("monthly_snapshots")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (error) {
        setError(error.message);
      } else {
        setList((l) => l.map((s) => (s.id === editingId ? (data as MonthlySnapshot) : s)));
        closeForm();
      }
    } else {
      const { data, error } = await supabase
        .from("monthly_snapshots")
        .insert({ user_id: user.id, ...payload })
        .select()
        .single();
      if (error) {
        setError(error.message);
      } else {
        setList((l) => [data as MonthlySnapshot, ...l]);
        closeForm();
      }
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar este snapshot?")) return;
    setBusy(true);
    const { error } = await supabase.from("monthly_snapshots").delete().eq("id", id);
    if (!error) {
      setList((l) => l.filter((s) => s.id !== id));
      closeForm();
    } else {
      setError(error.message);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {latest && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <p className="text-xs text-stone-500 uppercase tracking-wider">
            Patrimonio neto real
          </p>
          <p className="text-3xl font-bold tabular-nums mt-1">{eur(latestNet)}</p>
          <p className="text-xs text-stone-500 mt-1 capitalize">
            {monthLabel(latest.snapshot_month)}
          </p>
          {delta !== null && (
            <p
              className={`text-sm tabular-nums mt-2 ${
                delta >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {eur(delta)} vs mes anterior
            </p>
          )}
        </div>
      )}

      {!adding && !editingId && (
        <button
          type="button"
          onClick={openAdd}
          className="w-full py-4 rounded-2xl bg-stone-100 text-stone-950 font-bold"
        >
          + Nuevo snapshot mensual
        </button>
      )}

      {(adding || editingId) && (
        <div className="bg-stone-900 border border-stone-700 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-baseline gap-3">
            <h3 className="font-semibold">
              {editingId ? "Editar snapshot" : "Nuevo snapshot"}
            </h3>
            <div className="text-right">
              <p className="text-xs text-stone-500">Patrimonio neto</p>
              <p className="text-lg font-bold tabular-nums">{eur(preview())}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Mes</label>
            <input
              type="date"
              value={form.snapshot_month}
              onChange={(e) => set("snapshot_month", e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 focus:outline-none focus:border-stone-500"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-wider">Activos</p>
            {SNAPSHOT_ACCOUNTS.map((a) => (
              <FieldRow
                key={a.id}
                label={a.label}
                hint={a.hint}
                value={form[a.id]}
                onChange={(v) => set(a.id, v)}
              />
            ))}
            <FieldRow
              label="Pendiente cobrar A (neto sin IVA)"
              hint="Lo que te deben clientes A, sin IVA"
              value={form.pendiente_cobrar_neto}
              onChange={(v) => set("pendiente_cobrar_neto", v)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-wider">Pasivos próximo trimestre</p>
            <FieldRow
              label="IVA pendiente"
              hint="Resta del patrimonio"
              value={form.iva_pendiente}
              onChange={(v) => set("iva_pendiente", v)}
              negative
            />
            <FieldRow
              label="IRPF pendiente"
              hint="Solo si no está retenido en factura"
              value={form.irpf_pendiente}
              onChange={(v) => set("irpf_pendiente", v)}
              negative
            />
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Hitos del mes, imprevistos, observaciones..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 focus:outline-none focus:border-stone-500"
            />
          </div>

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
              Borrar snapshot
            </button>
          )}
        </div>
      )}

      {sorted.length === 0 && !adding && (
        <p className="text-stone-500 text-sm">Aún no hay snapshots. Empieza con uno este mes.</p>
      )}

      {sorted.length > 0 && (
        <ul className="space-y-2">
          {sorted.map((s, idx) => {
            const net = netWorth(s);
            const prev = sorted[idx + 1];
            const d = prev ? net - netWorth(prev) : null;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="w-full text-left bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-stone-600 transition"
                >
                  <div className="flex justify-between items-baseline gap-3">
                    <p className="font-semibold capitalize">{monthLabel(s.snapshot_month)}</p>
                    <p className="font-bold tabular-nums">{eur(net)}</p>
                  </div>
                  {d !== null && (
                    <p
                      className={`text-xs tabular-nums mt-1 ${
                        d >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {d >= 0 ? "+" : ""}
                      {eur(d)} vs mes anterior
                    </p>
                  )}
                  {s.notes && (
                    <p className="text-xs text-stone-500 mt-2 line-clamp-2">{s.notes}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FieldRow({
  label,
  hint,
  value,
  onChange,
  negative,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-stone-500 truncate">{hint}</p>
      </div>
      <input
        inputMode="decimal"
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,00"
        className={`w-32 bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 tabular-nums text-right focus:outline-none focus:border-stone-500 ${
          negative ? "text-red-400" : ""
        }`}
      />
    </div>
  );
}
