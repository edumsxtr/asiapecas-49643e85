export interface Part {
  id: string;
  material: string;
  description: string;
  lastEntryTime: string;
  stock: number;
  estimatedPrice: number;
  supplier: string;
  manufacturer: string;
  machineModel: string;
  categories: {
    mineracao: boolean;
    linhaAmarela: boolean;
    perfuratriz: boolean;
    caminhaoEletrico: boolean;
    guindaste: boolean;
  };
  compatibleModels?: string[];
}

export const sampleParts: Part[] = [
  {
    id: "1",
    material: "272102015",
    description: "CAIXA DE VELOCIDADES MYF110 XCMG",
    lastEntryTime: "6 até 12 meses",
    stock: 45,
    estimatedPrice: 51757.22,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XC870BR",
    categories: { mineracao: false, linhaAmarela: true, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
    compatibleModels: ["XC870BR", "XT870BR"],
  },
  {
    id: "2",
    material: "803598257",
    description: "17FM861B1 MODULO SEMICONDUTOR",
    lastEntryTime: "6 até 12 meses",
    stock: 12,
    estimatedPrice: 193221.63,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XDE260",
    categories: { mineracao: true, linhaAmarela: false, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
  },
  {
    id: "3",
    material: "800178464",
    description: "S00046628+02 BICO INJETOR",
    lastEntryTime: "6 até 12 meses",
    stock: 1125,
    estimatedPrice: 1958.80,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "GR1905BR",
    categories: { mineracao: false, linhaAmarela: true, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
    compatibleModels: ["GR1905BR", "GR1803BR"],
  },
  {
    id: "4",
    material: "453101366",
    description: "NXG3106TFW261-010 - PNEU 14.00R25",
    lastEntryTime: "mais de 2 anos",
    stock: 279,
    estimatedPrice: 7733.02,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XGA5905D3T(DFWD12)",
    categories: { mineracao: true, linhaAmarela: false, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
  },
  {
    id: "5",
    material: "800156505",
    description: "14-11547-00 ACOPLAMENTO",
    lastEntryTime: "6 até 12 meses",
    stock: 204,
    estimatedPrice: 10125.67,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XM1005H",
    categories: { mineracao: false, linhaAmarela: true, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
  },
  {
    id: "6",
    material: "804042865",
    description: "CABECOTE DE PERFURACAO - DTH-ZT-Ø89-3",
    lastEntryTime: "6 até 12 meses",
    stock: 623,
    estimatedPrice: 1321.00,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XQZ152",
    categories: { mineracao: false, linhaAmarela: false, perfuratriz: true, caminhaoEletrico: false, guindaste: false },
  },
  {
    id: "7",
    material: "819992729",
    description: "ROMPEDOR VERTICAL - XEB175TV-AD",
    lastEntryTime: "6 até 12 meses",
    stock: 3,
    estimatedPrice: 230368.22,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XE380DK;XE490DK",
    categories: { mineracao: false, linhaAmarela: true, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
    compatibleModels: ["XE380DK", "XE490DK"],
  },
  {
    id: "8",
    material: "800361448",
    description: "12TT3021SO - ARVORE DE TRANSMISSAO",
    lastEntryTime: "1 ano até 2 anos",
    stock: 1,
    estimatedPrice: 515447.97,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XCA450",
    categories: { mineracao: false, linhaAmarela: false, perfuratriz: false, caminhaoEletrico: false, guindaste: true },
  },
  {
    id: "9",
    material: "800357604",
    description: "PNEU NOVO - 27.00R49",
    lastEntryTime: "6 até 12 meses",
    stock: 12,
    estimatedPrice: 127257.20,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XDR100",
    categories: { mineracao: true, linhaAmarela: false, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
  },
  {
    id: "10",
    material: "414104214",
    description: "XDZ190C - ROLETE INFERIOR",
    lastEntryTime: "6 até 12 meses",
    stock: 624,
    estimatedPrice: 1577.57,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XE215BR",
    categories: { mineracao: false, linhaAmarela: true, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
    compatibleModels: ["XE215BR", "XE215BRII", "XE225BR"],
  },
  {
    id: "11",
    material: "860132921",
    description: "FILTRO TRANSMISSAO CARRARO 40701",
    lastEntryTime: "1 ano até 2 anos",
    stock: 386,
    estimatedPrice: 1570.97,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "XT870BR",
    categories: { mineracao: false, linhaAmarela: true, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
    compatibleModels: ["XT870BR", "XC870BR"],
  },
  {
    id: "12",
    material: "253209922",
    description: "CONJUNTO DA CACAMBA - 1200KNIII.31III",
    lastEntryTime: "6 até 12 meses",
    stock: 3,
    estimatedPrice: 196033.15,
    supplier: "MG-Pouso Alegre-XCMG BR Indust",
    manufacturer: "XCMG",
    machineModel: "LW1200K",
    categories: { mineracao: true, linhaAmarela: false, perfuratriz: false, caminhaoEletrico: false, guindaste: false },
  },
];

export const categoryLabels: Record<string, string> = {
  mineracao: "Mineração",
  linhaAmarela: "Linha Amarela",
  perfuratriz: "Perfuratriz",
  caminhaoEletrico: "Caminhão Elétrico",
  guindaste: "Guindaste",
};

export const timeLabels = [
  "6 até 12 meses",
  "1 ano até 2 anos",
  "mais de 2 anos",
];

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getActiveCategories(part: Part): string[] {
  return Object.entries(part.categories)
    .filter(([, active]) => active)
    .map(([key]) => categoryLabels[key] || key);
}
