import { Filter, Disc, Cog, Droplets, Zap, Box, Wrench, Gauge, Snowflake, CircleDot, Package, type LucideIcon } from "lucide-react";

export interface PartCategoryOption {
  key: string;
  icon: LucideIcon;
}

export const PART_CATEGORIES: PartCategoryOption[] = [
  { key: "Filtros", icon: Filter },
  { key: "Vedações e Retentores", icon: Disc },
  { key: "Motor e Componentes", icon: Cog },
  { key: "Sistema Hidráulico", icon: Droplets },
  { key: "Sistema Elétrico", icon: Zap },
  { key: "Estrutural e Chassi", icon: Box },
  { key: "Transmissão", icon: Wrench },
  { key: "Freios", icon: Gauge },
  { key: "Rolamentos e Buchas", icon: CircleDot },
  { key: "Refrigeração", icon: Snowflake },
  { key: "Acessórios e Outros", icon: Package },
];
