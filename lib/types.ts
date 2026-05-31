export type Scope = "personal" | "negocio";
export type Business =
  | "savage_party"
  | "fierce_party"
  | "elevn_djs"
  | "mochito_media"
  | "shared";
export type Confidence = "auto" | "soft" | "confirmed";

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  currency: string;
  fx_eur: number;
  merchant: string | null;
  raw_input: string | null;
  category: string;
  scope: Scope;
  business: Business | null;
  deductible: boolean;
  vat_rate: number | null;
  vat_amount: number | null;
  payment_method: string | null;
  notes: string | null;
  recurring_id: string | null;
  confidence: Confidence;
  created_at: string;
}

export type NewTransaction = Omit<Transaction, "id" | "user_id" | "created_at">;

export interface Income {
  id: string;
  user_id: string;
  date: string;
  gross: number;
  currency: string;
  payer: string | null;
  business: Business;
  invoice_id: string | null;
  vat: number;
  irpf: number;
  net: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export type NewIncome = Omit<Income, "id" | "user_id" | "created_at">;

export type InvestmentKind = "accion_etf" | "fondo_pension";

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  kind: InvestmentKind;
  invested: number;
  current_value: number;
  value_updated_at: string | null;
  notes: string | null;
  created_at: string;
}

export type NewInvestment = Omit<Investment, "id" | "user_id" | "created_at">;

export interface MonthlySnapshot {
  id: string;
  user_id: string;
  snapshot_month: string;
  bbva_trabajo: number;
  bbva_personal: number;
  bbva_impuestos: number;
  trade_republic: number;
  myinvestor: number;
  acciones: number;
  revolut: number;
  conjunta: number;
  cash_b: number;
  pendiente_cobrar_neto: number;
  iva_pendiente: number;
  irpf_pendiente: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewMonthlySnapshot = Omit<MonthlySnapshot, "id" | "user_id" | "created_at" | "updated_at">;

export const SNAPSHOT_ACCOUNTS = [
  { id: "bbva_trabajo", label: "BBVA Trabajo", hint: "Operativa, entran facturas A" },
  { id: "bbva_personal", label: "BBVA Personal", hint: "Recibe sueldo, paga fijos" },
  { id: "bbva_impuestos", label: "BBVA Impuestos", hint: "20-30% de cada cobro A" },
  { id: "trade_republic", label: "Trade Republic", hint: "Colchón 3,04% TAE" },
  { id: "myinvestor", label: "MyInvestor", hint: "Inversión largo plazo" },
  { id: "acciones", label: "Acciones", hint: "Cartera de acciones" },
  { id: "revolut", label: "Revolut", hint: "Gastos random online" },
  { id: "conjunta", label: "Conjunta", hint: "Pareja, gastos compartidos" },
  { id: "cash_b", label: "Cash B", hint: "Tope 4.000 €" },
] as const;

export const INVESTMENT_KINDS: { id: InvestmentKind; label: string }[] = [
  { id: "accion_etf", label: "Acciones / ETF" },
  { id: "fondo_pension", label: "Fondo / pensiones" },
];
