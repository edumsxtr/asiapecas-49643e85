import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCustomers, useCreateCustomer, type CustomerInsert } from "@/hooks/use-customers";
import { useCreateSale } from "@/hooks/use-sales";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Plus, Trash2, Search, Check, UserPlus } from "lucide-react";

type CartItem = {
  part_id: string;
  material: string;
  description: string;
  quantity: number;
  unit_price: number;
  stock: number;
};

const PAYMENT_METHODS = ["Boleto", "PIX", "Cartão", "Transferência", "Cheque"];
const PAYMENT_TERMS = ["À vista", "30 dias", "30/60 dias", "30/60/90 dias"];

export default function NewOrderPage() {
  const navigate = useNavigate();
  const { data: customers = [] } = useCustomers();
  const createSale = useCreateSale();
  const createCustomer = useCreateCustomer();

  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [partSearch, setPartSearch] = useState("");
  const [partResults, setPartResults] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [confirming, setConfirming] = useState(false);

  // New customer inline
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CustomerInsert>({
    name: "", company: null, cnpj_cpf: null, email: null, phone: null,
    address: null, city: null, state: null, segment: "geral", notes: null,
  });

  const searchParts = async (q: string) => {
    setPartSearch(q);
    if (q.length < 2) { setPartResults([]); return; }
    const { data } = await supabase
      .from("parts")
      .select("id,material,description,estimated_price,stock")
      .or(`material.ilike.%${q}%,description.ilike.%${q}%,machine_model.ilike.%${q}%`)
      .limit(15);
    setPartResults(data || []);
  };

  const addToCart = (part: any) => {
    if (cart.find((i) => i.part_id === part.id)) {
      setCart((prev) => prev.map((i) => i.part_id === part.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart((prev) => [...prev, {
        part_id: part.id, material: part.material, description: part.description,
        quantity: 1, unit_price: part.estimated_price, stock: part.stock,
      }]);
    }
    setPartSearch("");
    setPartResults([]);
  };

  const updateCartItem = (idx: number, field: keyof CartItem, value: number) => {
    setCart((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeFromCart = (idx: number) => setCart((prev) => prev.filter((_, i) => i !== idx));

  const total = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleCreateCustomer = () => {
    if (!newCustomer.name.trim()) return;
    createCustomer.mutate(newCustomer, {
      onSuccess: (data) => {
        setCustomerId(data.id);
        setNewCustomerOpen(false);
        setNewCustomer({ name: "", company: null, cnpj_cpf: null, email: null, phone: null, address: null, city: null, state: null, segment: "geral", notes: null });
      },
    });
  };

  const handleConfirmOrder = async () => {
    if (!customerId || cart.length === 0) return;
    setConfirming(true);
    try {
      // Create sale as orcamento first
      const saleData = {
        customer_id: customerId,
        notes: notes || null,
        payment_method: paymentMethod || null,
        payment_terms: paymentTerms || null,
        items: cart.map(({ part_id, quantity, unit_price }) => ({ part_id, quantity, unit_price })),
      };

      createSale.mutate(saleData, {
        onSuccess: async (sale) => {
          // Confirm sale (decrement stock)
          const { data, error } = await supabase.functions.invoke("confirm-sale", {
            body: { sale_id: sale.id },
          });
          if (error || data?.error) {
            toast.error(data?.error || "Erro ao confirmar pedido");
            setConfirming(false);
            return;
          }
          toast.success("Pedido confirmado e estoque atualizado!");
          navigate("/vendas");
        },
        onError: () => setConfirming(false),
      });
    } catch {
      setConfirming(false);
    }
  };

  const hasStockIssues = cart.some((i) => i.quantity > i.stock);

  return (
    <AppLayout>
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Novo Pedido</h1>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <Badge key={s} variant={step >= s ? "default" : "outline"} className="text-xs">
                {s === 1 ? "Cliente" : s === 2 ? "Itens" : "Resumo"}
              </Badge>
            ))}
          </div>
        </div>

        {/* Step 1: Customer */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Selecionar Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar cliente existente..." /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ""} {c.cnpj_cpf ? `— ${c.cnpj_cpf}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => setNewCustomerOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />Novo
                </Button>
              </div>

              {selectedCustomer && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  {selectedCustomer.company && <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>}
                  {selectedCustomer.phone && <p className="text-sm text-muted-foreground">Tel: {selectedCustomer.phone}</p>}
                  {selectedCustomer.email && <p className="text-sm text-muted-foreground">Email: {selectedCustomer.email}</p>}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!customerId}>
                  Próximo — Adicionar Itens
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Cart Items */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Adicionar Peças ao Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por material, descrição ou modelo..."
                  className="pl-10"
                  value={partSearch}
                  onChange={(e) => searchParts(e.target.value)}
                />
                {partResults.length > 0 && (
                  <div className="absolute z-10 w-full border rounded-md mt-1 max-h-60 overflow-y-auto bg-background shadow-lg">
                    {partResults.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm flex justify-between items-center"
                        onClick={() => addToCart(p)}
                      >
                        <div className="flex-1">
                          <span className="font-mono text-xs">{p.material}</span>
                          <span className="text-muted-foreground ml-2 truncate">{p.description}</span>
                        </div>
                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <Badge variant={p.stock > 0 ? "secondary" : "destructive"} className="text-xs">
                            Estoque: {p.stock}
                          </Badge>
                          <span className="font-medium">R$ {p.estimated_price.toLocaleString("pt-BR")}</span>
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Estoque</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item, idx) => (
                      <TableRow key={idx} className={item.quantity > item.stock ? "bg-destructive/5" : ""}>
                        <TableCell className="font-mono text-xs">{item.material}</TableCell>
                        <TableCell className="text-xs truncate max-w-[200px]">{item.description}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.stock > 0 ? "outline" : "destructive"}>{item.stock}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number" min={1} className="w-20 h-8 text-center"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(idx, "quantity", Math.max(1, +e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number" min={0} step={0.01} className="w-28 h-8"
                            value={item.unit_price}
                            onChange={(e) => updateCartItem(idx, "unit_price", +e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          R$ {(item.quantity * item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="text-right font-bold text-base">Total:</TableCell>
                      <TableCell className="font-mono font-bold text-primary text-base">
                        R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Carrinho vazio — busque e adicione peças acima</p>
                </div>
              )}

              {hasStockIssues && (
                <p className="text-sm text-destructive">⚠️ Alguns itens excedem o estoque disponível</p>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={() => setStep(3)} disabled={cart.length === 0}>
                  Próximo — Resumo ({cart.length} itens)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">3. Resumo do Pedido</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                    <p className="font-medium">{selectedCustomer?.name}</p>
                    {selectedCustomer?.company && <p className="text-sm">{selectedCustomer.company}</p>}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total do Pedido</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">{cart.length} itens</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Forma de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Condições</Label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>{PAYMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas sobre o pedido..." />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{item.material}</TableCell>
                        <TableCell className="text-xs truncate max-w-[200px]">{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="font-mono">R$ {item.unit_price.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="font-mono font-medium">
                          R$ {(item.quantity * item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                  <Button
                    onClick={handleConfirmOrder}
                    disabled={confirming || hasStockIssues}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {confirming ? "Confirmando..." : `Confirmar Pedido — R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* New Customer Dialog */}
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Cliente Rápido</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-3">
            <div><Label>Nome *</Label><Input value={newCustomer.name} onChange={(e) => setNewCustomer((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Empresa</Label><Input value={newCustomer.company || ""} onChange={(e) => setNewCustomer((f) => ({ ...f, company: e.target.value || null }))} /></div>
            <div><Label>CNPJ/CPF</Label><Input value={newCustomer.cnpj_cpf || ""} onChange={(e) => setNewCustomer((f) => ({ ...f, cnpj_cpf: e.target.value || null }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={newCustomer.phone || ""} onChange={(e) => setNewCustomer((f) => ({ ...f, phone: e.target.value || null }))} /></div>
              <div><Label>Email</Label><Input value={newCustomer.email || ""} onChange={(e) => setNewCustomer((f) => ({ ...f, email: e.target.value || null }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCustomerOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCustomer} disabled={createCustomer.isPending || !newCustomer.name.trim()}>
              {createCustomer.isPending ? "Salvando..." : "Criar e Selecionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
