import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { SnapshotManager } from "@/components/SnapshotManager";
import type { MonthlySnapshot } from "@/lib/types";

export default async function SistemaPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("monthly_snapshots")
    .select("*")
    .order("snapshot_month", { ascending: false });

  return (
    <div className="space-y-8 pb-4">
      <header>
        <p className="text-xs text-stone-500 uppercase tracking-widest">Sistema</p>
        <h1 className="text-2xl font-bold mt-1">Control financiero</h1>
        <p className="text-sm text-stone-400 mt-2">
          Reglas, cuentas y hitos del sistema. Snapshot mensual editable abajo.
        </p>
      </header>

      <Section title="Las 4 reglas innegociables">
        <Rule
          n={1}
          title="Cobro A → 20% o 30% a Impuestos el mismo día"
          body="20% si la factura tiene retención IRPF (empresa/planner). 30% si es a particular sin retención."
        />
        <Rule
          n={2}
          title="Compra equipo → siempre A con factura NIF"
          body="Nunca cash B. Ahorras ~36% en impuestos. Mac con financiación 0% Apple cuando toque."
        />
        <Rule
          n={3}
          title="Cash B → consumo cotidiano, tope 4.000 €"
          body="Comidas fuera, gasolina personal, ocio, ropa. Si pasa de 4k, subir uso. Si baja de 2k, frenar."
        />
        <Rule
          n={4}
          title="Patrimonio neto real es el único número"
          body="Suma de saldos + cash B + pendiente cobro neto. Resta IVA e IRPF pendientes. Resto es ruido."
        />
      </Section>

      <Section title="Estructura de cuentas">
        <Account name="BBVA Trabajo" role="Operativa Negocio" detail="Entran facturas A. Salen fijos trabajo (renting, autónomo, gestor, gasolina, trastero, iPhone, seguros)." />
        <Account name="BBVA Personal" role="Cuenta madre personal" detail="Recibe sueldo. Paga hipoteca + fijos piso + suscripciones + préstamos + conjunta." />
        <Account name="BBVA Impuestos" role="2ª cuenta BBVA" detail="Recibe 20-30% de cada cobro A. Hacienda sigue domiciliada en BBVA Trabajo, no se toca." />
        <Account name="Trade Republic" role="Colchón líquido" detail="3,04% TAE sin condiciones, sin tope. IBAN ES, retención IRPF automática. Retiradas instantáneas a BBVA." />
        <Account name="MyInvestor fondos" role="Inversión largo plazo" detail="Aportaciones pausadas 12 meses. Retomar a 200-300 €/mes cuando colchón llegue a 12k." />
        <Account name="Revolut" role="Gastos online random" detail="Top-up 100 €/mes desde Personal. 1,15% TAE. No usar para colchón." />
        <Account name="Conjunta" role="Pareja" detail="150 €/mes desde Personal. Gastos compartidos, cenas, planes con pareja." />
        <Account name="Cash B" role="Caja efectivo" detail="Tope 4.000 €. Uso ~680 €/mes en consumo personal. Pago al DJ subcontratado." />
      </Section>

      <Section title="Movimientos automáticos día 1">
        <Flow from="BBVA Trabajo" to="BBVA Personal" amount="1.500 €" label="Sueldo" />
        <Flow from="BBVA Trabajo" to="Trade Republic" amount="300 €" label="Colchón" />
        <Flow from="BBVA Trabajo" to="bote CAPEX" amount="50 €" label="Equipo (simbólico)" />
        <Flow from="BBVA Personal" to="Conjunta" amount="150 €" label="Pareja" />
        <Flow from="BBVA Personal" to="Revolut" amount="100 €" label="Random online" />
      </Section>

      <Section title="Decisiones tomadas (no replantear)">
        <Decision
          title="DJ subcontratado: queda como está"
          body="Cobro 310 + IVA al cliente, pago 210 € cash al DJ. Margen real 53 €/boda × 42 bodas/año = 2.247 €. Cliente estratégico que aporta volumen A anual. Sobre-tributación ~1.300 €/año asumida como coste del modelo."
        />
        <Decision
          title="SL descartada"
          body="Vida buena + Hacienda tranquila > optimización fiscal. Mantenemos régimen autónomo."
        />
        <Decision
          title="Hipoteca no se amortiza antes de colchón"
          body="Liquidez > deuda barata. Hasta tener colchón 6 meses (~18k), no se hacen amortizaciones."
        />
        <Decision
          title="Mix A/B: A es el suelo"
          body="Mínimo 50k/año en A facturado. Coherencia con nivel de vida visible. Empresa/planner siempre A. Particulares grandes (>500€) preferir A. B solo para particulares pequeños sin DJ subcontratado."
        />
      </Section>

      <Section title="Hitos del año">
        <Milestone date="Jul 2026" title="Pago IVA Q2" detail="Hito crítico. Debe salir íntegro de BBVA Impuestos, sin tocar Operativa ni Personal." critical />
        <Milestone date="Ago 2026" title="Mes flojo esperado" detail="50-50 A/B normal. No compensar, agosto siempre es así en el sector." />
        <Milestone date="Sep 2026" title="Vuelta de temporada" detail="Priorizar leads A. Cierres activos con planners." />
        <Milestone date="Oct 2026" title="Pago IVA Q3 + decisión renting" detail="Cierre Q3 con gestor. Decisión sobre renting furgoneta antes del vencimiento." />
        <Milestone date="Nov 2026" title="Revisión anual A" detail="Si A acumulado < 45k, empujar diciembre en A para cerrar año ≥ 50k." />
        <Milestone date="Dic 2026" title="Mac nuevo + cierre año" detail="Compra con financiación 0% Apple + factura NIF. No tirar del colchón." critical />
        <Milestone date="Ene 2027" title="Cierre fiscal anual" detail="IVA Q4 + modelo 390 (resumen anual IVA). Revisión 2026 cerrado con gestor." />
        <Milestone date="Abr 2027" title="Declaración Renta 2026" detail="Devolución/pago calculado." />
        <Milestone date="May 2027" title="Fin préstamo tío" detail="Libera 500 €/mes. Redirección a colchón hasta tener 6 meses cubiertos." critical />
      </Section>

      <Section title="Snapshot mensual">
        <p className="text-sm text-stone-400 mb-4">
          Día 1 de cada mes, guarda los saldos. El patrimonio neto real se calcula automáticamente.
        </p>
        <SnapshotManager initial={(data as MonthlySnapshot[]) ?? []} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Rule({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex gap-3">
      <span className="text-2xl font-bold text-stone-600 tabular-nums shrink-0">
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-stone-400 mt-1">{body}</p>
      </div>
    </div>
  );
}

function Account({ name, role, detail }: { name: string; role: string; detail: string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      <div className="flex justify-between items-baseline gap-3">
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-stone-500 shrink-0">{role}</p>
      </div>
      <p className="text-sm text-stone-400 mt-1">{detail}</p>
    </div>
  );
}

function Flow({ from, to, amount, label }: { from: string; to: string; amount: string; label: string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 flex items-center gap-3">
      <span className="text-xs text-stone-500 truncate">{from}</span>
      <span className="text-stone-600">→</span>
      <span className="text-xs text-stone-300 truncate">{to}</span>
      <span className="ml-auto font-bold tabular-nums">{amount}</span>
      <span className="text-xs text-stone-500 shrink-0">{label}</span>
    </div>
  );
}

function Decision({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      <p className="font-semibold text-stone-100">{title}</p>
      <p className="text-sm text-stone-400 mt-1">{body}</p>
    </div>
  );
}

function Milestone({ date, title, detail, critical }: { date: string; title: string; detail: string; critical?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${critical ? "bg-amber-500/5 border-amber-500/30" : "bg-stone-900 border-stone-800"}`}>
      <div className="flex justify-between items-baseline gap-3">
        <p className="font-semibold">{title}</p>
        <p className={`text-xs tabular-nums shrink-0 ${critical ? "text-amber-300" : "text-stone-500"}`}>{date}</p>
      </div>
      <p className="text-sm text-stone-400 mt-1">{detail}</p>
    </div>
  );
}
