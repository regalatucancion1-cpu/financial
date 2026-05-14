import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { InvestmentsManager } from "@/components/InvestmentsManager";
import type { Investment } from "@/lib/types";

export default async function InversionesPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-stone-500 uppercase tracking-widest">
          Inversiones
        </p>
        <h1 className="text-2xl font-bold mt-1">Tu cartera</h1>
      </header>
      <InvestmentsManager initial={(data as Investment[]) ?? []} />
    </div>
  );
}
