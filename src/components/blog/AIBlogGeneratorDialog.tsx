import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AIBlogGeneratorDialog({ open, onOpenChange }: Props) {
  const [topic, setTopic] = useState("");
  const [material, setMaterial] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleGenerate = async () => {
    if (!topic.trim() && !material.trim()) {
      toast.error("Informe um tópico ou código de peça");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: { topic: topic.trim() || undefined, material: material.trim() || undefined },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha na geração");
      toast.success("Post gerado como rascunho!");
      qc.invalidateQueries({ queryKey: ["blog-posts-all"] });
      onOpenChange(false);
      setTopic("");
      setMaterial("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Gerar post com IA
          </DialogTitle>
          <DialogDescription>
            A IA usa dados reais do seu catálogo para criar um post otimizado para SEO. Será salvo como rascunho.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tópico (opcional)</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Como prolongar a vida útil do trem de rolagem de escavadeiras XCMG"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Código de peça (opcional)</Label>
            <Input
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Ex: 800302245"
            />
            <p className="text-[11px] text-muted-foreground">
              Se informado, o post será sobre esta peça específica usando dados reais do catálogo.
            </p>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
