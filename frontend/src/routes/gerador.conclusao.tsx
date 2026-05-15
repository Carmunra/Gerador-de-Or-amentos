import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useCallback } from "react";
import { Download } from "lucide-react";
import alfaluxLogo from "@/assets/alfalux-logo.png";

export const Route = createFileRoute("/gerador/conclusao")({
  component: ProposalPage,
  head: () => ({
    meta: [
      { title: "Proposta Comercial — Alfalux" },
      { name: "description", content: "Proposta comercial Alfalux — iluminação customizada para arquitetos e lighting designers." },
    ],
  }),
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Produto {
  item: string;
  sku: string;
  nome: string;
  descricao: string;
  obs: string;
  qtd: number;
  valorUnit: number;
}

interface CondicaoComercial {
  k: string;
  v: string;
  hint: string;
}

// ─── Dados iniciais ────────────────────────────────────────────────────────────
// Separar dados do componente é boa prática: facilita manutenção e testes.

const produtosIniciais: Produto[] = [
  {
    item: "01",
    sku: "ALF-LP-001",
    nome: "Linear Pendant Custom",
    descricao: "Pendente linear sob medida 2.400mm, perfil em alumínio anodizado, LED 3000K CRI>90, dimerizável DALI.",
    obs: "Acabamento preto fosco",
    qtd: 12,
    valorUnit: 4850,
  },
  {
    item: "02",
    sku: "ALF-SE-002",
    nome: "Spot Embutido Recuado",
    descricao: "Spot embutido no-glare, refletor escurecido, foco 24°, driver remoto. Customização de profundidade conforme forro.",
    obs: "Trim quadrado",
    qtd: 48,
    valorUnit: 1290,
  },
  {
    item: "03",
    sku: "ALF-WW-003",
    nome: "Arandela Wall Wash",
    descricao: "Banho de luz vertical assimétrico para revestimentos, 12W, IP44, corpo em alumínio injetado.",
    obs: "Customizada projeto",
    qtd: 24,
    valorUnit: 2180,
  },
  {
    item: "04",
    sku: "ALF-TM-004",
    nome: "Trilho Magnético 48V",
    descricao: "Sistema modular magnético embutido, 6m lineares com spots, pendentes e linear integrados.",
    obs: "Conforme planta",
    qtd: 6,
    valorUnit: 5640,
  },
];

const condicoesIniciais: CondicaoComercial[] = [
  { k: "Pagamento",        v: "30% sinal · 40% produção · 30% entrega", hint: "Boleto / PIX" },
  { k: "Frete",            v: "CIF — capitais Sul e Sudeste",            hint: "Demais regiões a combinar" },
  { k: "Prazo de entrega", v: "45 a 60 dias úteis",                     hint: "após aprovação técnica" },
  { k: "Faturamento",      v: "Alfalux Iluminação Ltda.",                hint: "NF-e em até 5 dias" },
];

// ─── Utilitários ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Componente EditableField ──────────────────────────────────────────────────
// Responsabilidade única: renderizar um texto editável inline sem perder o estilo.
// Recebe className do pai — assim ele não precisa saber nada sobre estética.
//
// Por que contentEditable e não <input>?
//   → <input> quebraria o layout (é um elemento de bloco fixo).
//   → contentEditable transforma qualquer elemento em área editável,
//     preservando exatamente o estilo visual que já existe.

interface EditableFieldProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  as?: keyof JSX.IntrinsicElements; // permite renderizar como h3, p, span, etc.
  multiline?: boolean;
}

function EditableField({
  value,
  onChange,
  className = "",
  as: Tag = "span",
  multiline = false,
}: EditableFieldProps) {
  // Controla visualmente se o campo está em foco
  const [focused, setFocused] = useState(false);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      setFocused(false);
      // innerText preserva quebras de linha; textContent é mais simples para linha única
      const newValue = multiline
        ? e.currentTarget.innerText
        : e.currentTarget.textContent ?? "";
      onChange(newValue.trim());
    },
    [onChange, multiline]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      // Enter em campo de linha única confirma a edição
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    [multiline]
  );

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning // silencia aviso do React sobre conteúdo controlado
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={[
        className,
        "outline-none cursor-text transition-all duration-200",
        // Feedback visual sutil: borda pontilhada só ao focar, sem mudar layout
        focused
          ? "ring-1 ring-primary/40 ring-offset-1 rounded-[2px]"
          : "hover:opacity-80",
      ]
        .filter(Boolean)
        .join(" ")}
      // dangerouslySetInnerHTML não é usado aqui intencionalmente:
      // o React controla o texto inicial; atualizações vêm via onBlur.
    >
      {value}
    </Tag>
  );
}

// ─── Componente EditableNumber ─────────────────────────────────────────────────
// Variante do EditableField para números — valida e converte o valor.

interface EditableNumberProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  format?: (n: number) => string; // função de formatação opcional (ex: fmt)
}

function EditableNumber({
  value,
  onChange,
  className = "",
  format,
}: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const display = !editing && format ? format(value) : draft;

  const handleFocus = () => {
    setEditing(true);
    // Ao entrar no modo edição, mostra o número puro sem formatação
    setDraft(String(value));
  };

  const handleBlur = () => {
    setEditing(false);
    // Troca vírgula por ponto para aceitar tanto "1.290" quanto "1290"
    const parsed = parseFloat(draft.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
      setDraft(String(parsed));
    } else {
      // Reverte para o valor anterior se a entrada for inválida
      setDraft(String(value));
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className={[
          className,
          "bg-transparent outline-none border-b border-primary w-full",
        ].join(" ")}
      />
    );
  }

  return (
    <span
      className={[className, "cursor-text hover:opacity-80 transition-opacity"].join(" ")}
      onClick={handleFocus}
      title="Clique para editar"
    >
      {display}
    </span>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

function ProposalPage() {
  // Estado centralizado: toda a UI deriva daqui — padrão "single source of truth"
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [condicoes, setCondicoes] = useState<CondicaoComercial[]>(condicoesIniciais);

  const subtotal = produtos.reduce((s, p) => s + p.valorUnit * p.qtd, 0);
  const total = subtotal;
  const docRef = useRef<HTMLDivElement>(null);

  // Atualiza um campo específico de um produto pelo índice
  // Usando função genérica com keyof garante type-safety: não aceita campos inexistentes
  const updateProduto = useCallback(
    <K extends keyof Produto>(index: number, field: K, value: Produto[K]) => {
      setProdutos((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  // Atualiza um campo de uma condição comercial pelo índice
  const updateCondicao = useCallback(
    <K extends keyof CondicaoComercial>(
      index: number,
      field: K,
      value: CondicaoComercial[K]
    ) => {
      setCondicoes((prev) =>
        prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  const handleDownload = () => {
    // ─── Por que window.print() em vez de html2pdf? ───────────────────────────
    // O html2pdf usa html2canvas para "fotografar" o DOM — mas ele não consegue
    // renderizar: gradientes complexos, variáveis CSS customizadas, fontes web,
    // backdrop-filter, e box-shadow. O resultado é um PDF sem cor.
    //
    // window.print() usa o mesmo engine do browser (Blink/WebKit) que já está
    // renderizando a página — garantindo 100% de fidelidade visual.
    // O usuário escolhe "Salvar como PDF" na janela de impressão do sistema.
    //
    // Para forçar que o browser imprima os backgrounds (que por padrão ele omite
    // para economizar tinta), injetamos um <style> temporário com
    // -webkit-print-color-adjust: exact; print-color-adjust: exact;
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Injeta estilos de impressão dinamicamente
    const styleId = "alfalux-print-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @media print {
          /* Força o browser a imprimir todos os backgrounds e cores */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Esconde elementos que não devem aparecer no PDF */
          .print\\:hidden {
            display: none !important;
          }

          /* Remove margens da página do sistema */
          @page {
            margin: 0;
            size: A4 portrait;
          }

          /* Cada card de produto nunca quebra no meio de uma página */
          article {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Cada section vira uma página */
          .proposal-page {
            page-break-after: always;
            break-after: page;
          }

          /* Garante que o doc ocupa a largura total */
          .proposal-doc {
            width: 100%;
          }

          /* Remove sombras que podem criar artefatos na impressão */
          .shadow-elegant, .shadow-soft {
            box-shadow: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // 2. Dispara o diálogo de impressão do sistema operacional
    //    O usuário seleciona "Salvar como PDF" — padrão em todos os SOs modernos
    window.print();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Barra fixa de ações */}
      <div className="fixed top-4 right-4 z-[100] print:hidden">
        <button
          onClick={handleDownload}
          className="bg-primary text-primary-foreground hover:bg-primary-deep transition-colors rounded-full px-6 py-3 shadow-elegant flex items-center gap-2 text-sm font-semibold tracking-wide border-2 border-white/20"
          aria-label="Baixar proposta em PDF"
        >
          <Download className="h-4 w-4" />
          Baixar PDF
        </button>
      </div>

      <div ref={docRef} className="proposal-doc">
        {/* ============ PÁGINA 1 — CAPA / DADOS DO CLIENTE / QI ============ */}
        <section className="proposal-page relative min-h-screen flex flex-col">
          {/* Hero header */}
          <div className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div
              aria-hidden
              className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
              style={{ background: "var(--color-accent)" }}
            />

            <div className="relative max-w-6xl mx-auto px-8 lg:px-16 pt-16 pb-24">
              <div className="flex items-start justify-between gap-8">
                <div className="animate-fade-up">
                  <img
                    src={alfaluxLogo}
                    alt="Alfalux"
                    className="h-16 md:h-20 w-auto object-contain"
                  />
                </div>

                <div className="text-right animate-fade-up">
                  <div className="text-xs tracking-[0.3em] uppercase text-primary-glow opacity-90">
                    Documento
                  </div>
                  <div className="font-display text-4xl md:text-5xl italic font-light mt-1 text-primary-glow">
                    Proposta
                  </div>
                  <div className="text-xs tracking-widest uppercase text-primary-glow/80 mt-2">
                    Nº 2026 / 0421
                  </div>
                </div>
              </div>

              <div className="mt-20 max-w-3xl animate-fade-up">
                <p className="font-display italic text-2xl md:text-3xl font-light leading-snug text-balance text-primary-glow/95">
                  "A luz desenhada para o espaço — não o espaço adaptado à luz."
                </p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-ink" />
          </div>

          {/* Dados do cliente */}
          <div className="max-w-6xl mx-auto w-full px-8 lg:px-16 py-16 grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <div className="text-xs tracking-[0.3em] uppercase text-primary-deep font-medium">
                Apresentado para
              </div>
              <div className="gold-divider mt-3 mb-8 max-w-[140px] mx-0" />

              <dl className="space-y-6">
                {[
                  { k: "Empresa", v: "—" },
                  { k: "A/C", v: "—" },
                  { k: "Contato", v: "—" },
                  { k: "CNPJ", v: "—" },
                  { k: "Obra", v: "—" },
                ].map((row) => (
                  <div key={row.k} className="group">
                    <dt className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium">
                      {row.k}
                    </dt>
                    <dd className="mt-1.5 font-display text-xl text-foreground border-b border-border pb-2 group-hover:border-primary transition-colors">
                      {row.v}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-10 w-10 rounded-full bg-ink text-ink-foreground flex items-center justify-center font-display text-base">
                  A
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-primary-deep">
                    Consultor responsável
                  </div>
                  <div className="font-medium text-foreground">Equipe Alfalux</div>
                </div>
              </div>
            </div>

            {/* QI DE SUCESSO — destaque */}
            <div className="lg:col-span-3">
              <div className="relative bg-ink text-ink-foreground rounded-sm p-10 md:p-12 shadow-elegant overflow-hidden">
                <div
                  aria-hidden
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-primary"
                />
                <div className="relative">
                  <div className="flex items-center gap-3 text-xs tracking-[0.35em] uppercase text-primary-glow font-medium">
                    <span className="font-mono">QI</span>
                    <span className="h-px flex-1 bg-primary/30" />
                    <span>Sucesso</span>
                  </div>

                  <h2 className="mt-6 font-display text-4xl md:text-5xl font-light leading-tight">
                    O <span className="italic shimmer-text">QI de Sucesso</span>
                    <br />
                    da Alfalux.
                  </h2>

                  <div className="gold-divider my-8 max-w-[120px] mx-0" />

                  <p className="text-lg md:text-xl leading-relaxed font-light text-ink-foreground/90 text-balance">
                    Diferente de importadores de prateleira, a Alfalux se destaca
                    pela capacidade de{" "}
                    <span className="text-primary-glow font-medium">
                      customizar produtos
                    </span>{" "}
                    para atender arquitetos e lighting designers em projetos{" "}
                    <em className="font-display">
                      corporativos, industriais e institucionais.
                    </em>
                  </p>

                  <div className="mt-10 grid grid-cols-3 gap-4">
                    {[
                      { n: "20+", l: "Anos de mercado" },
                      { n: "100%", l: "Sob medida" },
                      { n: "DIN", l: "Padrão técnico" },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="border-l border-primary/40 pl-4 py-1"
                      >
                        <div className="font-display text-3xl text-primary-glow">
                          {s.n}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest opacity-70 mt-1">
                          {s.l}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Caixa de revisão */}
              <a
                href="mailto:contato@alfalux.com.br?subject=Solicita%C3%A7%C3%A3o%20de%20revis%C3%A3o%20de%20or%C3%A7amento"
                className="mt-6 group flex items-center justify-between gap-4 bg-card border border-border hover:border-primary rounded-sm px-5 py-4 shadow-soft hover:shadow-elegant transition-all"
              >
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-primary-deep font-semibold">
                    Revisão
                  </div>
                  <div className="text-sm text-foreground mt-0.5 font-display italic">
                    Clique aqui para solicitar alterações em seu orçamento
                  </div>
                </div>
                <span className="text-primary text-xl group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </a>

              <p className="mt-6 text-xs text-muted-foreground italic text-right">
                alfalux.com.br · São Paulo · Brasil
              </p>
            </div>
          </div>

          <div className="mt-auto bg-ink text-ink-foreground/70 py-4">
            <div className="max-w-6xl mx-auto px-8 lg:px-16 flex justify-between text-[10px] uppercase tracking-[0.3em]">
              <span>Página 01 / 02</span>
              <span className="alfalux-wordmark text-primary-glow">ALFALUX</span>
              <span>Confidencial</span>
            </div>
          </div>
        </section>

        {/* ============ PÁGINA 2 — PRODUTOS, VALORES, CONDIÇÕES ============ */}
        <div className="pdf-page-break" />
        <section className="proposal-page bg-secondary/40 py-20 px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
              <div>
                <div className="text-xs tracking-[0.35em] uppercase text-primary-deep font-medium">
                  Escopo · 02
                </div>
                <h2 className="mt-3 font-display text-5xl md:text-6xl font-light text-foreground">
                  Produtos & <em className="text-primary">Valores</em>
                </h2>
              </div>
              <div className="text-sm text-muted-foreground max-w-xs">
                Especificação técnica do projeto luminotécnico, incluindo
                customizações conforme briefing.
              </div>
            </div>

            {/* Lista de produtos
                ─────────────────────────────────────────────────────────────
                POR QUE display:table?
                  flex/grid recalculam alturas no modo print e desalinham
                  colunas entre cards. display:table garante que todas as
                  células de uma linha têm a mesma altura — é o único modelo
                  de layout criado especificamente para isso.
                  table-layout:fixed + larguras em px fixam as colunas
                  independente do conteúdo.
                ─────────────────────────────────────────────────────────────
                Estrutura: [Item 52px] [SKU 90px] [Foto 110px] [Conteúdo *] [Preços 200px]
            */}
            <div className="space-y-3">
              {produtos.map((p, i) => (
                <article
                  key={p.item}
                  className="group bg-card rounded-sm overflow-hidden"
                  style={{
                    display: "table",
                    width: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* ── Col 1: Número do item ── */}
                  <div
                    style={{ display: "table-cell", width: "52px", verticalAlign: "middle", textAlign: "center" }}
                    className="bg-ink text-ink-foreground font-mono text-xs tracking-widest"
                  >
                    {p.item}
                  </div>

                  {/* ── Col 2: SKU ── */}
                  <div
                    style={{ display: "table-cell", width: "90px", verticalAlign: "middle", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.1)" }}
                    className="bg-ink text-ink-foreground px-2 py-4"
                  >
                    <div className="text-[8px] tracking-[0.25em] uppercase text-primary-glow/60 mb-1">
                      SKU
                    </div>
                    <EditableField
                      value={p.sku}
                      onChange={(v) => updateProduto(i, "sku", v)}
                      className="font-mono text-[9px] text-primary-glow leading-tight"
                    />
                  </div>

                  {/* ── Col 3: Foto ── */}
                  <div
                    style={{ display: "table-cell", width: "110px", verticalAlign: "middle", textAlign: "center" }}
                    className="bg-gradient-teal"
                  >
                    <div className="text-primary-foreground/80 text-[10px] tracking-[0.2em] uppercase">
                      Foto
                    </div>
                  </div>

                  {/* ── Col 4: Conteúdo principal ── */}
                  <div
                    style={{ display: "table-cell", verticalAlign: "top" }}
                    className="p-6"
                  >
                    <div className="flex items-baseline gap-4">
                      <EditableField
                        as="h3"
                        value={p.nome}
                        onChange={(v) => updateProduto(i, "nome", v)}
                        className="font-display text-2xl text-foreground leading-tight group-hover:text-primary-deep transition-colors"
                      />
                      <span className="flex-1 h-px bg-primary/30" />
                      <EditableNumber
                        value={p.qtd}
                        onChange={(v) => updateProduto(i, "qtd", v)}
                        className="font-display text-2xl text-primary/70 font-light leading-tight"
                        format={(n) => String(n).padStart(2, "0")}
                      />
                    </div>

                    <EditableField
                      as="p"
                      value={p.descricao}
                      onChange={(v) => updateProduto(i, "descricao", v)}
                      multiline
                      className="mt-3 text-sm text-muted-foreground leading-relaxed"
                    />

                    <div className="mt-3 flex items-center gap-2">
                      <span className="h-px w-6 bg-accent/60" />
                      <span className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium italic flex items-center gap-1">
                        Obs ·{" "}
                        <EditableField
                          value={p.obs}
                          onChange={(v) => updateProduto(i, "obs", v)}
                          className="text-[11px] tracking-[0.2em] uppercase text-accent font-medium italic"
                        />
                      </span>
                    </div>
                  </div>

                  {/* ── Col 5: Preços ── */}
                  <div
                    style={{ display: "table-cell", width: "200px", verticalAlign: "middle", borderLeft: "1px solid var(--color-border, #e5e7eb)" }}
                    className="bg-secondary/60 p-6"
                  >
                    <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                      Unitário
                    </div>
                    <EditableNumber
                      value={p.valorUnit}
                      onChange={(v) => updateProduto(i, "valorUnit", v)}
                      className="font-mono text-sm text-foreground/80"
                      format={fmt}
                    />
                    <div className="hairline my-3" />
                    <div className="text-[10px] tracking-[0.25em] uppercase text-primary-deep">
                      Total item
                    </div>
                    <div className="font-display text-2xl text-foreground mt-0.5">
                      {fmt(p.valorUnit * p.qtd)}
                    </div>
                  </div>

                </article>
              ))}
            </div>

            {/* Totais — flex em vez de grid para compatibilidade com html2pdf */}
            <div className="mt-12" style={{ display: "flex", gap: "1.5rem", alignItems: "stretch" }}>
              {/* Resumo financeiro — 66% */}
              <div style={{ flex: "0 0 66%", maxWidth: "66%" }} className="space-y-3">
                <div className="text-xs tracking-[0.35em] uppercase text-primary-deep font-medium mb-4">
                  Resumo financeiro
                </div>
                {[
                  { k: "Subtotal de produtos", v: fmt(subtotal) },
                  { k: "Customização inclusa", v: "Sem custo adicional" },
                  { k: "IPI / ICMS", v: "Conforme legislação vigente" },
                ].map((r) => (
                  <div
                    key={r.k}
                    className="flex justify-between items-center py-3 border-b border-border"
                  >
                    <span className="text-sm text-muted-foreground">{r.k}</span>
                    <span className="font-mono text-sm text-foreground">
                      {r.v}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bloco valor total — 34% */}
              <div style={{ flex: "0 0 34%", maxWidth: "34%" }} className="bg-ink text-ink-foreground rounded-sm p-8 shadow-elegant flex flex-col justify-between">
                <div>
                  <div className="text-[10px] tracking-[0.35em] uppercase text-primary-glow">
                    Valor Total da Proposta
                  </div>
                  <div className="gold-divider my-4 max-w-[60px] mx-0" />
                  <div className="font-display text-5xl font-light leading-none">
                    {fmt(total)}
                  </div>
                  <div className="text-xs tracking-widest uppercase opacity-60 mt-3">
                    válido por 15 dias
                  </div>
                </div>
                <div className="mt-6 text-xs text-ink-foreground/60 italic font-display">
                  "Cada lúmen, intencional."
                </div>
              </div>
            </div>

            {/* Condições comerciais — editáveis */}
            <div className="mt-16">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="font-display text-3xl md:text-4xl font-light text-foreground">
                  Condições <em className="text-primary">comerciais</em>
                </h3>
                <span className="h-px flex-1 bg-border" />
              </div>

              {/* Condições — flex wrap em vez de grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {condicoes.map((c, i) => (
                  <div
                    key={c.k}
                    style={{ flex: "0 0 calc(25% - 0.75rem)", minWidth: "180px" }}
                    className="bg-card border border-border rounded-sm p-6 hover:border-primary hover:shadow-soft transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] tracking-[0.3em] uppercase text-primary-deep font-semibold">
                        {c.k}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        0{i + 1}
                      </span>
                    </div>
                    {/* Valor principal da condição — editável */}
                    <EditableField
                      value={c.v}
                      onChange={(v) => updateCondicao(i, "v", v)}
                      className="font-display text-lg text-foreground leading-snug block"
                    />
                    {/* Hint da condição — editável */}
                    <EditableField
                      value={c.hint}
                      onChange={(v) => updateCondicao(i, "hint", v)}
                      className="mt-3 text-xs text-muted-foreground italic block"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Assinatura — flex em vez de grid */}
            <div className="mt-20" style={{ display: "flex", gap: "3rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <div className="text-xs tracking-[0.35em] uppercase text-primary-deep mb-2">
                  Aceite da proposta
                </div>
                <div className="border-b border-foreground/40 h-16" />
                <div className="mt-2 text-xs text-muted-foreground tracking-widest uppercase">
                  Cliente · Data
                </div>
              </div>
              <div style={{ flex: 1 }} className="text-right">
                <div className="alfalux-wordmark text-3xl text-primary-deep">
                  ALFALUX
                </div>
                <div className="mt-2 text-sm text-muted-foreground italic font-display">
                  Obrigado pela confiança.
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-16 pt-6 border-t border-border flex justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>Página 02 / 02</span>
            <span>alfalux.com.br</span>
            <span>Confidencial</span>
          </div>
        </section>
      </div>
    </main>
  );
}
