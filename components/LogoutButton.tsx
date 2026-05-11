"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="w-full py-3 rounded-xl bg-stone-800 text-stone-200 font-semibold"
    >
      Cerrar sesión
    </button>
  );
}
