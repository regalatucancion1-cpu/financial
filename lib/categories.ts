import type { Scope, Business } from "./types";

export interface CategoryDef {
  id: string;
  label: string;
  scope: Scope;
  emoji: string;
}

export const CATEGORIES: CategoryDef[] = [
  // Personal (9)
  { id: "vivienda", label: "Vivienda", scope: "personal", emoji: "🏠" },
  { id: "comida_super", label: "Supermercado", scope: "personal", emoji: "🛒" },
  { id: "comida_delivery", label: "Delivery", scope: "personal", emoji: "🛵" },
  { id: "comida_fuera", label: "Restaurante", scope: "personal", emoji: "🍽️" },
  { id: "transporte", label: "Transporte", scope: "personal", emoji: "🚇" },
  { id: "salud_bienestar", label: "Salud", scope: "personal", emoji: "💊" },
  { id: "ocio_suscripciones", label: "Ocio", scope: "personal", emoji: "🎬" },
  { id: "ropa_belleza", label: "Ropa", scope: "personal", emoji: "👕" },
  { id: "otros_personal", label: "Otros", scope: "personal", emoji: "•" },
  // Negocio (7)
  { id: "equipo_musical", label: "Equipo musical", scope: "negocio", emoji: "🎸" },
  { id: "software_suscripciones_pro", label: "Software pro", scope: "negocio", emoji: "💿" },
  { id: "transporte_bolos", label: "Transporte bolos", scope: "negocio", emoji: "🚐" },
  { id: "dietas_bolos", label: "Dietas bolos", scope: "negocio", emoji: "🥤" },
  { id: "marketing_contenido", label: "Marketing", scope: "negocio", emoji: "📸" },
  { id: "gestoria_impuestos", label: "Gestoría", scope: "negocio", emoji: "📑" },
  { id: "otros_negocio", label: "Otros negocio", scope: "negocio", emoji: "•" },
  // Special (excluded from totals)
  { id: "transferencia_propia", label: "Transferencia propia", scope: "personal", emoji: "↔️" },
];

export const BUSINESSES: { id: Business; label: string }[] = [
  { id: "savage_party", label: "Savage Party" },
  { id: "fierce_party", label: "Fierce Party" },
  { id: "elevn_djs", label: "ELEVN DJ'S" },
  { id: "mochito_media", label: "Mochito Media" },
  { id: "shared", label: "Compartido" },
];

interface AutoTagRule {
  match: RegExp;
  category: string;
  scope: Scope;
  business?: Business;
  confidence: "auto" | "soft";
}

// Merchant → categoría + scope auto-tag rules.
// Hard-auto: confidence "auto". Soft-auto: confidence "soft" (flagged for monthly review).
const RULES: AutoTagRule[] = [
  // Hard-auto personal
  { match: /glovo|uber\s*eats|just\s*eat|deliveroo/i, category: "comida_delivery", scope: "personal", confidence: "auto" },
  { match: /mercadona|bonpreu|caprabo|lidl|aldi|carrefour|condis|consum|dia\b/i, category: "comida_super", scope: "personal", confidence: "auto" },
  { match: /uber\b|cabify|free\s*now|bolt\b/i, category: "transporte", scope: "personal", confidence: "auto" },
  { match: /tmb|renfe|cercanias|emt\b/i, category: "transporte", scope: "personal", confidence: "auto" },
  { match: /netflix|spotify|hbo|disney|prime\s*video|youtube\s*premium|apple\s*music/i, category: "ocio_suscripciones", scope: "personal", confidence: "auto" },

  // Hard-auto negocio
  { match: /thomann|sweetwater|guitar\s*center|woodbrass|music\s*store/i, category: "equipo_musical", scope: "negocio", confidence: "auto" },
  { match: /splice|loopcloud|native\s*instruments|ableton|logic\s*pro|adobe|figma/i, category: "software_suscripciones_pro", scope: "negocio", confidence: "auto" },
  { match: /gestor[ií]a|asesor[ií]a/i, category: "gestoria_impuestos", scope: "negocio", confidence: "auto" },

  // Soft-auto (default personal, review on monthly close)
  { match: /amazon|amzn/i, category: "otros_personal", scope: "personal", confidence: "soft" },
  { match: /apple(?!\s*music)|app\s*store/i, category: "otros_personal", scope: "personal", confidence: "soft" },
  { match: /el\s*corte\s*ingl[eé]s|ecisa/i, category: "otros_personal", scope: "personal", confidence: "soft" },

  // Ambiguous (default but flagged)
  { match: /repsol|cepsa|galp|bp\b|shell|gasolinera/i, category: "transporte", scope: "personal", confidence: "soft" },
];

export function autoTag(merchant: string): {
  category: string;
  scope: Scope;
  confidence: "auto" | "soft";
} | null {
  if (!merchant) return null;
  for (const r of RULES) {
    if (r.match.test(merchant)) {
      return { category: r.category, scope: r.scope, confidence: r.confidence };
    }
  }
  return null;
}

export function categoryById(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
