import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GeradorShell } from "@/components/gerador/Shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PackagePlus, Upload } from "lucide-react";
//import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/gerador/produtos")({
  component: CadastroProduto,
});

function CadastroProduto() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setLoading(true);

    const formData = new FormData(ev.currentTarget);

    try {
      const response = await fetch("http://localhost:8000/products", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({ title: "Sucesso!", description: "Produto cadastrado no catálogo." });
        navigate({ to: "/gerador" });
      } else {
        throw new Error("Erro ao cadastrar");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o produto." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <GeradorShell title="Gerenciar Catálogo" showBack>
      <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-8 shadow-soft max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código (SKU)</Label>
              <Input id="code" name="code" placeholder="ALX-001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço Base (R$)</Label>
              <Input id="price" name="price" type="number" step="0.01" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input id="name" name="name" placeholder="Ex: Arandela Slim" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Técnica</Label>
            <Textarea id="description" name="description" placeholder="Detalhes do produto..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Foto do Produto</Label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Clique para fazer upload (JPG/PNG)</p>
                </div>
                <input id="image" name="image" type="file" className="hidden" accept="image/*" required />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/gerador" })}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <PackagePlus className="w-4 h-4" />
            {loading ? "Salvando..." : "Cadastrar Produto"}
          </Button>
        </div>
      </form>
    </GeradorShell>
  );
}

function RouteComponent() {
  return <div>Hello "/gerador/produtos"!</div>
}
