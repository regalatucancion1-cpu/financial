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
