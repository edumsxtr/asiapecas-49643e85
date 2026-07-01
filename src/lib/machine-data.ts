/* ─────────────────────────────────────────────────────────────────────────────
   machine-data.ts
   Maps XCMG model prefixes/names → machine type metadata:
   photo (Pexels CDN), type label, description, keywords, icon color.
──────────────────────────────────────────────────────────────────────────────*/
export interface MachineType {
  label: string;          // e.g. "Escavadeira Hidráulica"
  application: string;    // e.g. "Mineração e terraplenagem"
  description: string;    // SEO paragraph ~120 words
  photo: string;          // Pexels URL
  keywords: string[];     // LSI keywords for SEO
  accentColor: string;    // Tailwind bg class for hero overlay
}

const PX = "auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop";

const TYPES: Record<string, MachineType> = {
  excavator: {
    label: "Escavadeira Hidráulica",
    application: "Mineração, terraplanagem e obras civis",
    description:
      "As escavadeiras hidráulicas XCMG são projetadas para operar em condições extremas de mineração, terraplanagem e infraestrutura. Equipadas com motor de alta torque, sistema hidráulico de alta pressão e estrutura reforçada, oferecem excelente produtividade por hora. A Ásia Peças mantém estoque real de peças originais e compatíveis para toda a linha — filtros, cilindros, bombas hidráulicas, buchas, rolamentos de esteira, dentes de caçamba e vedações — garantindo manutenção ágil e menor tempo de parada.",
    photo: `https://images.pexels.com/photos/2101137/pexels-photo-2101137.jpeg?${PX}`,
    keywords: ["escavadeira xcmg", "peças escavadeira", "cilindro hidráulico", "filtro escavadeira", "esteira escavadeira"],
    accentColor: "from-secondary/90 via-secondary/65",
  },
  loader: {
    label: "Carregadeira de Rodas",
    application: "Mineração, construção civil e agronegócio",
    description:
      "As carregadeiras de rodas XCMG combinam potência, agilidade e baixo consumo de combustível para operações intensivas em pedreiras, canteiros de obras e terminais de grãos. O sistema de transmissão hidrostática e o eixo traseiro oscilatório proporcionam tração superior em terrenos irregulares. A Ásia Peças disponibiliza filrtros, vedações, componentes de transmissão, pneus, eixos, bombas de combustível e toda a linha de manutenção para reduzir o custo por hora de operação da sua frota.",
    photo: `https://images.pexels.com/photos/1146983/pexels-photo-1146983.jpeg?${PX}`,
    keywords: ["carregadeira xcmg", "peças carregadeira rodas", "transmissão carregadeira", "filtro carregadeira", "pneu carregadeira"],
    accentColor: "from-secondary/90 via-secondary/65",
  },
  grader: {
    label: "Motoniveladora",
    application: "Pavimentação, manutenção de estradas e aeroportos",
    description:
      "As motoniveladoras XCMG são referência em obras de pavimentação, terraplanagem de alta precisão e manutenção de estradas vicinais. A lâmina articulada de 4,27 m, o círculo de giro de 360° e o tandem de pneus traseiros garantem acabamento de nível superior. A Ásia Peças mantém em estoque peças para toda a linha GR: filtros de ar e combustível, pneus, rolamentos do círculo, motor, sistema elétrico, hidráulico e componentes estruturais.",
    photo: `https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?${PX}`,
    keywords: ["motoniveladora xcmg", "peças motoniveladora", "lâmina motoniveladora", "filtro motoniveladora", "pneu motoniveladora"],
    accentColor: "from-secondary/90 via-secondary/65",
  },
  crane: {
    label: "Guindaste",
    application: "Construção, petróleo & gás e montagem industrial",
    description:
      "Os guindastes XCMG — telescópicos (QY) e sobre esteiras (QUY) — atendem projetos de construção pesada, montagem industrial e obras de infraestrutura em toda a América do Sul. Com capacidades de 25 a 1.600 toneladas, exigem manutenção especializada e peças de alta confiabilidade. A Ásia Peças oferece cilindros de lança, componentes de giro, sistema de freio, transmissão, peças do motor e acessórios para toda a linha QY e QUY, com suporte técnico dedicado.",
    photo: `https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg?${PX}`,
    keywords: ["guindaste xcmg", "peças guindaste", "cilindro lança guindaste", "freio guindaste", "QY75 peças"],
    accentColor: "from-secondary/90 via-secondary/60",
  },
  roller: {
    label: "Rolo Compactador",
    application: "Pavimentação asfáltica e compactação de solos",
    description:
      "Os rolos compactadores e fresadoras de asfalto XCMG são utilizados em obras de pavimentação de alta performance, compactação de aterros e recuperação de rodovias. A vibração de alta frequência e os tambores de aço de grande diâmetro garantem densidade de compactação acima dos padrões normativos. A Ásia Peças mantém em estoque bits de fresamento, rolamentos dos tambores, motor, sistema hidráulico e elétrico, filtros e kit de vedações para toda a linha XLZ e rolos XCMG.",
    photo: `https://images.pexels.com/photos/209315/pexels-photo-209315.jpeg?${PX}`,
    keywords: ["rolo compactador xcmg", "fresadora asfalto", "bits fresamento", "peças rolo xcmg", "compactador asfáltico"],
    accentColor: "from-secondary/90 via-secondary/65",
  },
  drill: {
    label: "Perfuratriz",
    application: "Mineração, sondagem e construção de fundações",
    description:
      "As perfuratrizes XCMG são desenvolvidas para operações de sondagem mineral, construção de fundações de grande profundidade e perfuração em rocha. Construídas com estrutura de alta rigidez e componentes de aço especial, operam com eficiência superior em formações rochosas abrasivas. A Ásia Peças disponibiliza brocas, bits de corte, hastes de perfuração, rolamentos do cabeçote, vedações do sistema de rotação e toda a linha de consumíveis e sobressalentes para suas perfuratrizes.",
    photo: `https://images.pexels.com/photos/1537388/pexels-photo-1537388.jpeg?${PX}`,
    keywords: ["perfuratriz xcmg", "peças perfuratriz", "broca perfuração", "haste perfuratriz", "rolamento cabeçote"],
    accentColor: "from-secondary/90 via-secondary/60",
  },
  electric: {
    label: "Caminhão Elétrico",
    application: "Mineração de superfície e transporte off-road",
    description:
      "Os caminhões elétricos de mineração XCMG representam a nova geração de transporte de carga pesada de baixa emissão para operações de superfície. Com capacidade de carga de até 100 toneladas e sistema de acionamento elétrico de alta eficiência, reduzem significativamente o custo operacional por tonelada transportada. A Ásia Peças atende a demanda de manutenção com peças elétricas, componentes do sistema de freio regenerativo, pneus especiais, suspensão e módulos estruturais.",
    photo: `https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?${PX}`,
    keywords: ["caminhão elétrico xcmg", "peças caminhão mineração", "sistema freio elétrico", "pneu caminhão mineração"],
    accentColor: "from-secondary/90 via-secondary/60",
  },
  default: {
    label: "Máquina XCMG",
    application: "Construção, mineração e infraestrutura",
    description:
      "A XCMG é uma das maiores fabricantes mundiais de máquinas pesadas para construção e mineração. A Ásia Peças é distribuidora autorizada para Brasil, Venezuela e Guiana, mantendo estoque real de peças originais e compatíveis para toda a linha XCMG. Nossos especialistas garantem cotação em até 24h, suporte técnico dedicado e entrega para qualquer estado do Brasil.",
    photo: `https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?${PX}`,
    keywords: ["peças xcmg", "distribuidora xcmg", "peças máquinas pesadas", "xcmg brasil"],
    accentColor: "from-secondary/90 via-secondary/65",
  },
};

/** Detect machine type from model name/slug */
export function getMachineType(modelName: string): MachineType {
  const n = modelName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^xe|^xee|escavadeira|excavat/.test(n)) return TYPES.excavator;
  if (/^xc|^lw|^zl|carregadeira|loader/.test(n)) return TYPES.loader;
  if (/^gr|motoniveladora|grader/.test(n)) return TYPES.grader;
  if (/^qy|^quy|guindaste|crane/.test(n)) return TYPES.crane;
  if (/^xlz|^rolo|compactador|roller|fresadora/.test(n)) return TYPES.roller;
  if (/^xz|^xdl|^xr|perfuratriz|drill/.test(n)) return TYPES.drill;
  if (/^ctz|^xdq|eletric|caminhao/.test(n)) return TYPES.electric;
  return TYPES.default;
}
