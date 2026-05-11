import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { categoryById } from "@/lib/categories";

function eur(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

export default async function HistorialPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("transactions")
    .select("id, date, amount, merchant, category, scope, business, confidence")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const grouped = new Map<string, typeof data>();
  for (const t of data ?? []) {
    const key = t.date;
    if (!grouped.has(key)) grouped.set(key, [] as never);
    (grouped.get(key) as never[]).push(t as never);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-stone-500 uppercase tracking-widest">Historial</p>
        <h1 className="text-2xl font-bold mt-1">Últimas 100</h1>
      </header>

      {(data?.length ?? 0) === 0 ? (
        <p className="text-stone-500 text-sm">Aún no hay nada apuntado.</p>
      ) : (
        <div className="space-y-5">
          {[...grouped.entries()].map(([date, rows]) => (
            <section key={date}>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">
                {new Date(date).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <ul className="space-y-1">
                {(rows ?? []).map((t) => {
                  const c = categoryById(t.category);
                  return (
                    <li
                      key={t.id}
                      className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {c?.emoji} {t.merchant || c?.label || t.category}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          {t.scope === "negocio" ? "Negocio" : "Personal"}
                          {t.confidence === "soft" ? " · revisar" : ""}
                        </p>
                      </div>
                      <span className="tabular-nums font-semibold ml-3">
                        {eur(Number(t.amount))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
