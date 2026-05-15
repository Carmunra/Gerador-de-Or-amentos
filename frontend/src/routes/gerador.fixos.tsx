import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GeradorShell } from "@/components/gerador/Shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Send, Star } from "lucide-react";

export const Route = createFileRoute("/gerador/fixos")({
  component: ClientesFixos,
  head: () => ({
    meta: [{ title: "Clientes Fixos — Gerador Alfalux" }],
  }),
});

type Cliente = {
  id: string;
  nome: string;
  empresa?: string;
  cnpj?: string;
  contato: string;
  email: string;
  obraPadrao?: string;
  observacoes?: string;
  criadoEm: string;
};

const STORAGE_KEY = "alfalux:clientes-fixos";

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

function load(): Cliente[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(list: Cliente[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function ClientesFixos() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);

  // Form
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const [email, setEmail] = useState("");
  const [obraPadrao, setObraPadrao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setClientes(load());
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.empresa || "").toLowerCase().includes(q) ||
        (c.cnpj || "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [clientes, busca]);

  function reset() {
    setNome("");
    setEmpresa("");
    setCnpj("");
    setContato("");
    setEmail("");
    setObraPadrao("");
    setObservacoes("");
    setErrors({});
  }

  function handleSalvar(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Informe o nome";
    if (!contato.trim()) e.contato = "Informe o contato";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) e.email = "E-mail inválido";
    if (cnpj && cnpj.replace(/\D/g, "").length !== 14) e.cnpj = "CNPJ inválido";
    setErrors(e);
    if (Object.keys(e).length) return;

    const novo: Cliente = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      empresa: empresa.trim() || undefined,
      cnpj: cnpj || undefined,
      contato,
      email: email.trim(),
      obraPadrao: obraPadrao.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      criadoEm: new Date().toISOString(),
    };
    const next = [novo, ...clientes];
    setClientes(next);
    save(next);
    reset();
    setOpen(false);
  }

  function handleRemover(id: string) {
    const next = clientes.filter((c) => c.id !== id);
    setClientes(next);
    save(next);
  }

  function handleGerarProposta(c: Cliente) {
    // MVP: navega para nova proposta. Pré-preenchimento futuro via query/state.
    navigate({ to: "/gerador/nova" });
  }

  return (
    <GeradorShell title="Clientes Fixos" showBack>
      <p className="text-muted-foreground -mt-4 mb-6">
        Cadastre clientes recorrentes para gerar propostas com poucos cliques.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, empresa, CNPJ ou e-mail..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setOpen((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" />
          {open ? "Fechar" : "Novo Cliente Fixo"}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={handleSalvar}
          className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Novo Cliente Fixo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="f-nome">Nome do contato *</Label>
              <Input id="f-nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1.5" />
              {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome}</p>}
            </div>
            <div>
              <Label htmlFor="f-empresa">Empresa</Label>
              <Input id="f-empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="f-cnpj">CNPJ</Label>
              <Input
                id="f-cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                className="mt-1.5"
              />
              {errors.cnpj && <p className="text-xs text-destructive mt-1">{errors.cnpj}</p>}
            </div>
            <div>
              <Label htmlFor="f-contato">Contato *</Label>
              <Input
                id="f-contato"
                value={contato}
                onChange={(e) => setContato(maskTel(e.target.value))}
                placeholder="(11) 99999-0000"
                className="mt-1.5"
              />
              {errors.contato && <p className="text-xs text-destructive mt-1">{errors.contato}</p>}
            </div>
            <div>
              <Label htmlFor="f-email">E-mail *</Label>
              <Input id="f-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="f-obra">Obra padrão</Label>
              <Input
                id="f-obra"
                value={obraPadrao}
                onChange={(e) => setObraPadrao(e.target.value)}
                placeholder="Ex.: Edifício Aurora"
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="f-obs">Observações</Label>
              <Input
                id="f-obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Condições, prazos, preferências..."
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" className="px-6">
              Salvar Cliente
            </Button>
          </div>
        </form>
      )}

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          {clientes.length === 0
            ? "Nenhum cliente fixo cadastrado ainda. Clique em \"Novo Cliente Fixo\" para começar."
            : "Nenhum cliente encontrado para a busca."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{c.nome}</h3>
                    {c.empresa && (
                      <p className="text-xs text-muted-foreground">{c.empresa}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemover(c.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remover"
                  title="Remover cliente"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                {c.cnpj && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">CNPJ</dt>
                    <dd className="font-medium">{c.cnpj}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Contato</dt>
                  <dd className="font-medium">{c.contato}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">E-mail</dt>
                  <dd className="font-medium truncate max-w-[60%]" title={c.email}>{c.email}</dd>
                </div>
                {c.obraPadrao && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Obra padrão</dt>
                    <dd className="font-medium">{c.obraPadrao}</dd>
                  </div>
                )}
              </dl>

              {c.observacoes && (
                <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
                  {c.observacoes}
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <Button size="sm" onClick={() => handleGerarProposta(c)} className="gap-2">
                  <Send className="h-4 w-4" />
                  Gerar Proposta
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </GeradorShell>
  );
}
