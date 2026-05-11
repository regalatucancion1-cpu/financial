import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { CaptureForm } from "@/components/CaptureForm";

export default async function HomePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch last 30 distinct merchants for quick-fill suggestions.
  const { data: recent } = await supabase
    .from("transactions")
    .select("merchant")
    .not("merchant", "is", null)
    .order("date", { ascending: false })
    .limit(30);

  const seen = new Set<string>();
  const recentMerchants: string[] = [];
  for (const row of recent ?? []) {
    if (row.merchant && !seen.has(row.merchant)) {
      seen.add(row.merchant);
      recentMerchants.push(row.merchant);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-stone-500 uppercase tracking-widest">
          Control Financiero
        </p>
        <h1 className="text-2xl font-bold mt-1">¿Qué has gastado?</h1>
      </header>
      <CaptureForm recentMerchants={recentMerchants} />
    </div>
  );
}
