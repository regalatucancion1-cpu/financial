import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { LogoutButton } from "@/components/LogoutButton";
import { PushToggle } from "@/components/PushToggle";

export default async function AjustesPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-stone-500 uppercase tracking-widest">Ajustes</p>
        <h1 className="text-2xl font-bold mt-1">{user.email}</h1>
      </header>

      <section className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Recordatorio diario</h2>
        <p className="text-sm text-stone-400">
          Push a las 22:00 para apuntar los gastos del día.
        </p>
        <PushToggle />
      </section>

      <section className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
        <LogoutButton />
      </section>
    </div>
  );
}
