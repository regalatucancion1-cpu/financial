import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { categoryById } from "@/lib/categories";

function eur(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function monthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: start.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
  };
}

function prevMonthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const end = new Date(d.getFullYear(), d.getMonth(), 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function MesPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cur = monthBounds();
  const prev = prevMonthBounds();

  const [txCur, txPrev, incCur] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, category, scope, confidence, merchant, date")
      .gte("date", cur.start)
      .lt("date", cur.end)
      .neq("category", "transferencia_propia"),
    supabase
      .from("transactions")
      .select("amount, scope")
      .gte("date", prev.start)
      .lt("date", prev.end)
      .neq("category", "transferencia_propia"),
    supabase
      .from("income")
      .select("gross, business")
      .gte("date", cur.start)
      .lt("date", cur.end),
  ]);

  const txs = txCur.data ?? [];
  const txsPrev = txPrev.data ?? [];
  const incs = incCur.data ?? [];

  const personal = txs
    .filter((t) => t.scope === "personal")
    .reduce((s, t) => s + Number(t.amount), 0);
  const negocio = txs
    .filter((t) => t.scope === "negocio")
    .reduce((s, t) => s + Number(t.amount), 0);
  const personalPrev = txsPrev
    .filter((t) => t.scope === "personal")
    .reduce((s, t) => s + Number(t.amount), 0);

  const ingresos = incs.reduce((s, i) => s + Number(i.gross), 0);
  const ahorroEstim = ingresos - personal;
  const ahorroPct = ingresos > 0 ? (ahorroEstim / ingresos) * 100 : 0;

  const byCategory = new Map<string, number>();
  for (const t of txs) {
    if (t.scope !== "personal") continue;
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Number(t.amount));
  }
  const top = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const softCount = txs.filter((t) => t.confidence === "soft").length;

  const personalDelta = personalPrev > 0 ? ((personal - personalPrev) / personalPrev) * 100 : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-stone-500 uppercase tracking-widest">Mes en curso</p>
        <h1 className="text-2xl font-bold mt-1 capitalize">{cur.label}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card label="Personal" value={eur(personal)} sub={
          personalDelta == null
            ? "primer mes"
            : `${personalDelta >= 0 ? "+" : ""}${personalDelta.toFixed(0)}% vs mes anterior`
        } accent="text-stone-100" />
        <Card label="Negocio (deducible)" value={eur(negocio)} sub="" accent="text-amber-400" />
        <Card label="Ingresos" value={eur(ingresos)} sub="" accent="text-emerald-400" />
        <Card
          label="Ahorro estim."
          value={eur(ahorroEstim)}
          sub={ingresos > 0 ? `${ahorroPct.toFixed(0)}% de ingresos` : "—"}
          accent={ahorroEstim >= 0 ? "text-emerald-400" : "text-red-400"}
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Top categorías personales
        </h2>
        {top.length === 0 ? (
          <p className="text-stone-500 text-sm">Aún no hay gastos este mes.</p>
        ) : (
          <ul className="space-y-2">
            {top.map(([id, v]) => {
              const c = categoryById(id);
              const pct = personal > 0 ? (v / personal) * 100 : 0;
              return (
                <li key={id} className="bg-stone-900 border border-stone-800 rounded-xl p-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">
                      {c?.emoji} {c?.label ?? id}
                    </span>
                    <span className="tabular-nums text-stone-300">{eur(v)}</span>
                  </div>
                  <div className="mt-2 h-1 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-400"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{pct.toFixed(0)}%</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {softCount > 0 && (
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-300">
            {softCount} transacciones por revisar
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Tienen categoría auto-asignada con baja confianza. Revísalas en el cierre mensual.
          </p>
        </section>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
      <p className="text-xs text-stone-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold tabular-nums mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-stone-500 mt-1">{sub}</p>}
    </div>
  );
}
