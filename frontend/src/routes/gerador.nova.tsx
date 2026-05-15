import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { GeradorShell } from "@/components/gerador/Shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
//import { useToast } from "@/hooks/use-mobile";

export const Route = createFileRoute("/gerador/nova")({
  component: NovaProposta,
  head: () => ({
    meta: [{ title: "Nova Proposta — Gerador Alfalux" }],
  }),
});

function maskCNPJ(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskTel(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

type Tipo = "compra" | "concorrencia" | null;

function NovaProposta() {
  const navigate = useNavigate();
  const { toast } = useToast(); // 2. INSTANCIAÇÃO DO TOAST

  const [semCnpj, setSemCnpj] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [email, setEmail] = useState("");
  const [obra, setObra] = useState("");
  const [tipo, setTipo] = useState<Tipo>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const rawCnpj = cnpj.replace(/\D/g, "");
    if (rawCnpj.length === 14) {
      // DICA: Ajuste para bater com sua rota do Python (ex: http://localhost:8000/company/)
      fetch(`http://localhost:8000/company/${rawCnpj}`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          if (data.razao_social) {
            setNome(data.razao_social);
            toast({
              title: "Dados localizados",
              description: `Cliente: ${data.razao_social}`
            });
          }
        })
        .catch(() => {
          // Silencioso ou erro opcional
        });
    }
  }, [cnpj, toast]); // Adicionado toast nas dependências

  const isCompra = tipo === "compra";

  // 3. ADICIONAR A DEFINIÇÃO DE formClasses (que estava faltando)
  const formClasses = useMemo(
    () =>
      [
        "rounded-2xl border bg-card p-8 shadow-soft transition-all duration-300",
        isCompra
          ? "border-accent ring-2 ring-accent/40 bg-accent/5"
          : "border-border",
      ].join(" "),
    [isCompra],
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!semCnpj && cnpj.replace(/\D/g, "").length !== 14) e.cnpj = "CNPJ inválido";
    if (!nome.trim()) e.nome = "Informe o nome";
    if (!contato.trim()) e.contato = "Informe o contato";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) e.email = "E-mail inválido";
    if (!obra.trim()) e.obra = "Informe a obra";
    if (!tipo) e.tipo = "Selecione o tipo";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

function handleSubmit(ev: React.FormEvent) {
  ev.preventDefault();
  if (!validate()) return;

  // Agora apontamos para a nova rota de conclusão
  navigate({
    to: "/gerador/conclusao",
    search: { cnpj, nome }
  });
}

  return (
    <GeradorShell title="Cadastro de Nova Proposta" showBack>
      <form onSubmit={handleSubmit} className={formClasses}>
        {isCompra && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-accent/15 border border-accent/40 px-4 py-3 text-sm text-accent-foreground">
            <AlertCircle className="h-4 w-4 text-accent" />
            Proposta de <strong>Compra</strong> — análise prioritária / diferenciada.
          </div>
        )}

        <section className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Identificação
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  disabled={semCnpj}
                  onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className="mt-1.5"
                />
                {errors.cnpj && <p className="text-xs text-destructive mt-1">{errors.cnpj}</p>}
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm cursor-pointer">
                <Checkbox
                  checked={semCnpj}
                  onCheckedChange={(c) => {
                    setSemCnpj(!!c);
                    if (c) setCnpj("");
                  }}
                />
                Não possuo CNPJ
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1.5" />
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
              </div>
              <div>
                <Label htmlFor="contato">Contato</Label>
                <Input
                  id="contato"
                  value={contato}
                  onChange={(e) => setContato(maskTel(e.target.value))}
                  placeholder="(11) 99999-0000"
                  className="mt-1.5"
                />
                {errors.contato && <p className="text-xs text-destructive mt-1">{errors.contato}</p>}
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Projeto
            </h2>
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Input id="obra" value={obra} onChange={(e) => setObra(e.target.value)} className="mt-1.5" />
              {errors.obra && <p className="text-xs text-destructive mt-1">{errors.obra}</p>}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Definição
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["compra", "concorrencia"] as const).map((t) => {
                const selected = tipo === t;
                const isCompraOption = t === "compra";
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={[
                      "rounded-xl border p-4 text-left transition-all",
                      selected
                        ? isCompraOption
                          ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                          : "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40 bg-background",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                          selected
                            ? isCompraOption
                              ? "border-accent"
                              : "border-primary"
                            : "border-muted-foreground/40",
                        ].join(" ")}
                      >
                        {selected && (
                          <div
                            className={[
                              "h-2.5 w-2.5 rounded-full",
                              isCompraOption ? "bg-accent" : "bg-primary",
                            ].join(" ")}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium capitalize">
                          {t === "concorrencia" ? "Concorrência" : "Compra"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t === "compra"
                            ? "Pedido direto — análise prioritária."
                            : "Cotação concorrencial padrão."}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.tipo && <p className="text-xs text-destructive mt-2">{errors.tipo}</p>}
          </div>
        </section>

        <div className="mt-10 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/gerador" })}>
            Voltar
          </Button>
          <Button type="submit" className="px-8">
            Enviar Proposta
          </Button>
        </div>
      </form>
    </GeradorShell>
  );
}
