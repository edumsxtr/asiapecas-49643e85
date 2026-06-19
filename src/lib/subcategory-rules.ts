// Dicionário de subcategorias funcionais (espelha a função SQL apply_subcategory_rules).
// Usado no front para destacar termos e oferecer filtros rápidos.
import {
  Circle, Lightbulb, Filter, Cable, Cog, Cylinder, Droplet, Disc, CircleDot,
  Hammer, Shovel, Battery, Snowflake, Plug, Key, Syringe, Wind, Gauge,
  Radio, Zap, OctagonAlert, Bed, Train, Settings, Link2, DoorOpen, Armchair,
  Square, Fan, Droplets, Tag, Wrench, Package, type LucideIcon,
} from "lucide-react";

export const SUBCATEGORIES = [
  "Pneus",
  "Faróis e Iluminação",
  "Filtros",
  "Mangueiras e Tubos",
  "Rolamentos",
  "Cilindros Hidráulicos",
  "Bombas",
  "Correias",
  "Vedações e Retentores",
  "Fixadores",
  "Implementos de Solo",
  "Baterias",
  "Radiadores e Arrefecimento",
  "Alternadores",
  "Motor de Partida",
  "Injetores e Bicos",
  "Turbinas",
  "Válvulas",
  "Sensores",
  "Chicotes Elétricos",
  "Freios e Embreagem",
  "Amortecedores",
  "Material Rodante",
  "Engrenagens",
  "Eixos e Cardans",
  "Cabine e Vidros",
  "Bancos",
  "Retrovisores",
  "Ar Condicionado",
  "Lubrificantes e Fluidos",
  "Adesivos e Plaquetas",
  "Kits de Reparo",
] as const;

export type Subcategory = (typeof SUBCATEGORIES)[number];

const ICON_MAP: Record<string, LucideIcon> = {
  Pneus: Circle,
  "Faróis e Iluminação": Lightbulb,
  Filtros: Filter,
  "Mangueiras e Tubos": Cable,
  Rolamentos: CircleDot,
  "Cilindros Hidráulicos": Cylinder,
  Bombas: Droplet,
  Correias: Disc,
  "Vedações e Retentores": Circle,
  Fixadores: Hammer,
  "Implementos de Solo": Shovel,
  Baterias: Battery,
  "Radiadores e Arrefecimento": Snowflake,
  Alternadores: Plug,
  "Motor de Partida": Key,
  "Injetores e Bicos": Syringe,
  Turbinas: Wind,
  Válvulas: Gauge,
  Sensores: Radio,
  "Chicotes Elétricos": Zap,
  "Freios e Embreagem": OctagonAlert,
  Amortecedores: Bed,
  "Material Rodante": Train,
  Engrenagens: Settings,
  "Eixos e Cardans": Link2,
  "Cabine e Vidros": DoorOpen,
  Bancos: Armchair,
  Retrovisores: Square,
  "Ar Condicionado": Fan,
  "Lubrificantes e Fluidos": Droplets,
  "Adesivos e Plaquetas": Tag,
  "Kits de Reparo": Wrench,
};

export function getSubcategoryIcon(sub?: string | null): LucideIcon {
  if (!sub) return Package;
  return ICON_MAP[sub] ?? Package;
}

// Backwards-compat: kept as an empty record so any legacy import does not crash,
// but the portal now renders Lucide icons via getSubcategoryIcon.
export const SUBCATEGORY_ICONS: Record<string, string> = {};

export function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n || 0);
}
