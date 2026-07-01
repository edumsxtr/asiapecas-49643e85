import asiaLogo from "@/assets/asia-logo-desktop.png";

/** Painel ilustrativo do login/cadastro — logomarca grande central sobre fundo
 *  cobalto, com mini-logos zebrando na diagonal (watermark de baixa opacidade). */
export default function AuthIllustration() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-primary text-primary-foreground p-10 relative overflow-hidden">
      {/* Watermark: mini-logos repetidos na diagonal */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1/3 opacity-[0.07]"
        style={{
          backgroundImage: `url(${asiaLogo})`,
          backgroundRepeat: "repeat",
          backgroundSize: "150px",
          transform: "rotate(-18deg)",
          filter: "brightness(0) invert(1)", // deixa as mini-logos brancas
        }}
      />

      {/* Logomarca central */}
      <div className="relative flex flex-col items-center gap-6 text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground/70">
          Portal do Cliente
        </p>
        <div
          className="rounded-lg bg-background p-6 ring-1 ring-foreground/10"
          style={{ boxShadow: "inset 0 0 22px rgba(0,0,0,0.16), 0 18px 42px rgba(0,0,0,0.38)" }}
        >
          <img src={asiaLogo} alt="Ásia Peças & Máquinas" className="w-56 h-auto" />
        </div>
        <p className="text-sm text-primary-foreground/85 max-w-xs leading-relaxed">
          Acompanhe cotações, propostas e pedidos XCMG em um só lugar.
        </p>
      </div>
    </div>
  );
}
