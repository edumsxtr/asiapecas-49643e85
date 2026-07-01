import { Weight, Gauge, Container, Cog, Fuel, ShieldCheck, Ruler, type LucideIcon } from "lucide-react";
import xe225Img from "@/assets/machines/xe225br.png";
import xe370Img from "@/assets/machines/xe370br.png";
import xc870Img from "@/assets/machines/xc870br-ii.png";
import xt870Img from "@/assets/machines/xt870br-i.png";
import gr1803Img from "@/assets/machines/gr1803br.png";

export type Spec = { icon: LucideIcon; label: string; value: string };

export type Machine = {
  slug: string;
  model: string;
  name: string;
  category: string;
  categorySlug: string;
  tagline: string;
  highlights: { label: string; value: string }[];
  specs: Spec[];
  description: string[];
  applications?: string[];
  image: string;
};

export const MACHINES: Record<string, Machine> = {
  xe225br: {
    slug: "xe225br",
    model: "XE225BR",
    name: "Escavadeira XE225BR XCMG",
    category: "Escavadeiras",
    categorySlug: "escavadeiras",
    tagline: "Excelência em desempenho e eficiência para terraplanagem, construção civil e mineração.",
    highlights: [
      { label: "Peso operacional", value: "22.500 kg" },
      { label: "Potência", value: "180 hp" },
      { label: "Caçamba", value: "1,2 m³" },
    ],
    specs: [
      { icon: Weight, label: "Peso operacional", value: "22.500 kg" },
      { icon: Gauge, label: "Potência", value: "180 hp" },
      { icon: Container, label: "Caçamba", value: "1,2 m³" },
      { icon: Cog, label: "Motor", value: "Cummins QSB7" },
      { icon: ShieldCheck, label: "Norma de emissão", value: "Tier III" },
      { icon: Fuel, label: "Tanque de combustível", value: "400 L" },
    ],
    description: [
      "Escavadeira XCMG XE225BR: a excelência em desempenho e eficiência. Com um peso operacional de 22500 kg e uma caçamba de 1.2 m³, essa máquina é a escolha ideal para uma ampla gama de projetos. Equipada com o robusto motor Cummins QSB7 padrão Tier III, turboalimentado, que oferece 180 hp de potência, a XE225BR garante um desempenho confiável e econômico.",
      "Destacando-se pela sua economia de combustível e facilidade de manutenção, esta escavadeira é a definição de versatilidade e custo-benefício. Perfeita para aplicações de demolição moderada e projetos de infraestrutura, ela oferece a potência e a precisão necessárias para lidar com desafios diversos. Com um tanque de combustível de 400 l, a XE225BR garante longas horas de trabalho contínuo, sem interrupções.",
      "Conta com lanças e braços reforçados com aço de alta resistência e grande gama de opcionais de caçamba. Ela é principalmente utilizada para serviços de terraplanagem, construção civil, mineração, obras viárias e fluviais e outros ambientes de trabalho.",
    ],
    applications: [
      "Terraplanagem", "Construção civil", "Mineração",
      "Obras viárias e fluviais", "Demolição moderada", "Infraestrutura",
    ],
    image: xe225Img,
  },

  xe370br: {
    slug: "xe370br",
    model: "XE370BR",
    name: "Escavadeira XE370BR XCMG",
    category: "Escavadeiras",
    categorySlug: "escavadeiras",
    tagline: "Escavadeira de grande porte para construção de estradas, fundações, dragagem e mineração a céu aberto.",
    highlights: [
      { label: "Peso operacional", value: "36.800 kg" },
      { label: "Potência", value: "260 hp" },
      { label: "Caçamba", value: "1,6 m³" },
    ],
    specs: [
      { icon: Weight, label: "Peso operacional", value: "36.800 kg" },
      { icon: Gauge, label: "Potência", value: "260 hp" },
      { icon: Container, label: "Caçamba", value: "1,6 m³" },
    ],
    description: [
      "É usada principalmente para escavação de leitos em projetos de construção de estradas, escavação de fundação, escavação de valas e canais, dragagem em projetos de conservação de água, decapagem e escavação de minério em pedreiras, mineração a céu aberto e outros projetos.",
    ],
    applications: [
      "Construção de estradas", "Escavação de fundação", "Valas e canais",
      "Dragagem", "Pedreiras", "Mineração a céu aberto",
    ],
    image: xe370Img,
  },

  "xc870br-ii": {
    slug: "xc870br-ii",
    model: "XC870BR-II",
    name: "Retroescavadeira XC870BR-II XCMG",
    category: "Retroescavadeiras",
    categorySlug: "retroescavadeiras",
    tagline: "Nova série global de retroescavadeiras XCMG, unindo versatilidade e robustez para os mais diversos ambientes de trabalho.",
    highlights: [
      { label: "Peso operacional", value: "7.700 kg" },
      { label: "Potência", value: "98,5 hp" },
      { label: "Caçamba", value: "1 m³" },
    ],
    specs: [
      { icon: Weight, label: "Peso operacional", value: "7.700 kg" },
      { icon: Gauge, label: "Potência", value: "98,5 hp" },
      { icon: Container, label: "Caçamba", value: "1 m³" },
    ],
    description: [
      "A XC870BR-II é uma nova série de retroescavadeiras feitas para o mercado global, que integra forças de P&D, tecnologia de processo de última geração e controle de qualidade total, combinando a versatilidade de uma retroescavadeira com a robustez para diferentes ambientes de trabalho e necessidades dos clientes em diferentes regiões do mundo, como América do Sul, América do Norte, Europa e Índia.",
      "A XC870BR-II aplica inovações e desenvolvimento em todos os seus sistemas, como dispositivos de trabalho, sistema hidráulico e sistema de potência.",
      "Sua cabine espaçosa oferece ao operador mais conforto e uma visão geral do trabalho. O excelente sistema de controle facilita e torna mais ergonômica a operação.",
      "Tudo isto tornará a retroescavadeira XC870BR-II única no mercado.",
    ],
    image: xc870Img,
  },

  "xt870br-i": {
    slug: "xt870br-i",
    model: "XT870BR-I",
    name: "Retroescavadeira XT870BR-I XCMG",
    category: "Retroescavadeiras",
    categorySlug: "retroescavadeiras",
    tagline: "Alto desempenho, velocidade e capacidade de trabalho para maximizar a produtividade em diversas aplicações.",
    highlights: [
      { label: "Peso operacional", value: "7.600 kg" },
      { label: "Potência", value: "100 hp" },
      { label: "Caçamba", value: "1 m³" },
    ],
    specs: [
      { icon: Weight, label: "Peso operacional", value: "7.600 kg" },
      { icon: Gauge, label: "Potência", value: "100 hp" },
      { icon: Container, label: "Caçamba", value: "1 m³" },
    ],
    description: [
      "As retroescavadeiras XCMG oferecem alto desempenho, velocidade e capacidade de trabalho para maximizar a produtividade em uma ampla variedade de aplicações.",
      "Foram pensadas estrategicamente para que a experiência na operação seja única e precisa, visando sempre o alto desempenho e a confiabilidade.",
      "Representa, portanto, um equipamento fundamental para a construção civil, sendo também útil em serviços rurais.",
    ],
    applications: [
      "Construção civil", "Serviços rurais",
    ],
    image: xt870Img,
  },

  gr1803br: {
    slug: "gr1803br",
    model: "GR1803BR",
    name: "Motoniveladora GR1803BR XCMG",
    category: "Motoniveladoras",
    categorySlug: "motoniveladoras",
    tagline: "Motoniveladora XCMG de alto desempenho e confiabilidade para nivelamento, construção civil e serviços rurais.",
    highlights: [
      { label: "Peso operacional", value: "17.150 kg" },
      { label: "Potência", value: "193 hp" },
      { label: "Lâmina", value: "3.660 mm" },
    ],
    specs: [
      { icon: Weight, label: "Peso operacional", value: "17.150 kg" },
      { icon: Gauge, label: "Potência", value: "193 hp" },
      { icon: Ruler, label: "Lâmina", value: "3.660 mm" },
    ],
    description: [
      "As motoniveladoras XCMG foram pensadas estrategicamente para que a experiência na operação seja única e precisa, visando sempre o alto desempenho e a confiabilidade.",
      "Perfeita para a sua aplicação de nivelamento. Representa, portanto, um equipamento fundamental para a construção civil, podendo ser, ainda, útil em serviços rurais.",
      "Projetada para garantir o máximo conforto ao operador, a cabine oferece opções de controle e conforto para promover a produtividade.",
    ],
    applications: [
      "Nivelamento", "Construção civil", "Serviços rurais",
    ],
    image: gr1803Img,
  },
};

/** Lista ordenada (insertion order) de todas as máquinas. */
export const MACHINE_LIST: Machine[] = Object.values(MACHINES);

/** Busca por slug, aceitando o sufixo "br" implícito (ex.: "xe225" → "xe225br"). */
export function getMachine(slug?: string): Machine | undefined {
  if (!slug) return undefined;
  const key = slug.toLowerCase();
  return MACHINES[key] ?? MACHINES[`${key}br`];
}
