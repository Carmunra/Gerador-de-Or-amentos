import { createFileRoute } from "@tanstack/react-router";
import { GeradorShell } from "@/components/gerador/Shell";

export const Route = createFileRoute("/gerador/revisao")({
  component: () => (
    <GeradorShell title="Revisão de Proposta" showBack>
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
        Em breve — selecione uma proposta existente para revisar.
      </div>
    </GeradorShell>
  ),
});
