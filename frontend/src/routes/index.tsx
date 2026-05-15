import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pencil, Search, Star, PackagePlus } from "lucide-react";
import { GeradorShell } from "@/components/gerador/Shell";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Gerador Alfalux" },
      { name: "description", content: "Sistema gerador de propostas Alfalux." },
    ],
  }),
});

const cards = [
  {
    to: "/gerador/nova",
    title: "Nova Proposta",
    desc: "Criar uma nova proposta comercial.",
    Icon: Plus,
  },
  {
    to: "/gerador/produtos", // NOVO BOTÃO
    title: "Gerenciar Catálogo",
    desc: "Cadastrar e editar produtos e fotos.",
    Icon: PackagePlus, // Importe o PackagePlus do lucide-react
  },
  {
    to: "/gerador/revisao",
    title: "Revisão de Proposta",
    desc: "Editar e ajustar propostas existentes.",
    Icon: Pencil,
  },
  {
    to: "/gerador/consultar",
    title: "Consultar Propostas",
    desc: "Buscar e visualizar propostas geradas.",
    Icon: Search,
  },
  {
    to: "/gerador/fixos",
    title: "Clientes Fixos",
    desc: "Propostas rápidas para clientes recorrentes.",
    Icon: Star,
  },
] as const;

function Dashboard() {
  return (
    <GeradorShell title="Dashboard">
      <p className="text-muted-foreground -mt-4 mb-10">
        Selecione uma das opções abaixo para começar.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(({ to, title, desc, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group relative aspect-square rounded-2xl border border-border bg-card p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant hover:border-primary/40 flex flex-col justify-between"
          >
            <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </GeradorShell>
  );
}
