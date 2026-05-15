import { createFileRoute } from "@tanstack/react-router";
import { GeradorShell } from "@/components/gerador/Shell";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/gerador/consultar")({
  component: () => (
    <GeradorShell title="Consultar Propostas" showBack>
      <div className="mb-6">
        <Input placeholder="Buscar por cliente, obra ou nº da proposta..." />
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
        Nenhuma proposta cadastrada ainda.
      </div>
    </GeradorShell>
  ),
});
