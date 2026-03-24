import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Search, ShoppingCart, Send, Package, Plus, Minus, Trash2, CheckCircle2 } from "lucide-react";

type QuoteItem = { material: string; description: string; quantity: number };

export default function QuotePage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", cnpj: "", email: "", phone: "", notes: "" });

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from("parts")
      .select("material, description, machine_model, stock")
      .or(`material.ilike.%${q}%,description.ilike.%${q}%,machine_model.ilike.%${q}%`)
      .gt("stock", 0)
      .limit(20);
    setResults(data || []);
  };

  const addItem = (part: any) => {
    if (items.find(i => i.material === part.material)) return;
    setItems(prev => [...prev, { material: part.material, description: part.description, quantity: 1 }]);
  };

  const updateQty = (material: string, qty: number) => {
    setItems(prev => prev.map(i => i.material === material ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const removeItem = (material: string) => {
    setItems(prev => prev.filter(i => i.material !== material));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || items.length === 0) {
      toast.error("Preencha nome, email e adicione ao menos 1 peça");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("quote_requests" as any).insert({
      customer_name: form.name,
      company: form.company || null,
      cnpj_cpf: form.cnpj || null,
      email: form.email,
      phone: form.phone || null,
      items: items.map(({ material, quantity }) => ({ material, quantity })),
      notes: form.notes || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar cotação");
      return;
    }
    setSubmitted(true);
    setShowForm(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Sonner />
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Cotação Enviada!</h2>
            <p className="text-muted-foreground">
              Recebemos sua solicitação com {items.length} itens. Nossa equipe entrará em contato em breve.
            </p>
            <Button onClick={() => { setSubmitted(false); setItems([]); setForm({ name: "", company: "", cnpj: "", email: "", phone: "", notes: "" }); }}>
              Nova Cotação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sonner />
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-sm">LL</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground">Lopes & Lopes</h1>
              <p className="text-xs text-muted-foreground">Solicite sua cotação de peças XCMG</p>
            </div>
          </div>
          {items.length > 0 && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Enviar Cotação ({items.length})
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar peça por código, descrição ou modelo..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map(part => {
              const inCart = items.some(i => i.material === part.material);
              return (
                <Card key={part.material} className={`cursor-pointer transition-all ${inCart ? "border-primary bg-primary/5" : "hover:shadow-md"}`}>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-xs font-mono text-muted-foreground">{part.material}</p>
                    <p className="text-sm font-medium text-foreground line-clamp-2">{part.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{part.machine_model || "—"}</Badge>
                      <Badge variant={part.stock > 0 ? "secondary" : "destructive"} className="text-xs">
                        {part.stock > 0 ? "Disponível" : "Indisponível"}
                      </Badge>
                    </div>
                    <Button
                      variant={inCart ? "secondary" : "default"}
                      size="sm"
                      className="w-full"
                      onClick={() => !inCart && addItem(part)}
                      disabled={inCart}
                    >
                      {inCart ? "Adicionado ✓" : "Adicionar à Cotação"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cart Summary */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Itens da Cotação ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.material} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{item.material}</p>
                      <p className="text-sm text-foreground truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.material, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.material, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.material)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => setShowForm(true)} className="w-full mt-4 gap-2">
                <Send className="h-4 w-4" /> Solicitar Cotação
              </Button>
            </CardContent>
          </Card>
        )}

        {results.length === 0 && search.length === 0 && items.length === 0 && (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Catálogo de Peças XCMG</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Busque peças por código, descrição ou modelo de máquina. Adicione os itens desejados e envie sua solicitação de cotação.
            </p>
          </div>
        )}
      </main>

      {/* Quote Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dados para Cotação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Empresa</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label>CNPJ/CPF</Label><Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <p className="text-xs text-muted-foreground">{items.length} itens selecionados</p>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {submitting ? "Enviando..." : "Enviar Cotação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
