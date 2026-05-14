"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Apunta", icon: "＋" },
  { href: "/mes", label: "Mes", icon: "∑" },
  { href: "/inversiones", label: "Inversiones", icon: "↗" },
  { href: "/historial", label: "Historial", icon: "≡" },
  { href: "/ajustes", label: "Ajustes", icon: "•" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-stone-800 bg-stone-950/95 backdrop-blur z-50">
      <ul className="max-w-2xl mx-auto grid grid-cols-5">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] transition-colors ${
                  active
                    ? "text-stone-50 font-semibold"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <span className="text-2xl leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
