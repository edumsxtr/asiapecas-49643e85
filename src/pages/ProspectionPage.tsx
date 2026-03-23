import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProspects, useUpdateProspect, useDeleteProspect, useConvertToCustomer, useSearchProspectsAI, Prospect } from "@/hooks/use-prospects";
import { Search, Sparkles, Users, Globe, TrendingUp, Trash2, Edit, UserPlus, Loader2 } from "lucide-react";

const COUNTRIES = [
  { value: "BR", label: "🇧🇷 Brasil" },
  { value: "VE", label: "🇻🇪 Venezuela" },
  { value: "GY", label: "🇬🇾 Guiana" },
];

const BR_STATES = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const VE_STATES = ["Amazonas","Anzoátegui","Apure","Aragua","Barinas","Bolívar","Carabobo","Cojedes","Delta Amacuro","Falcón","Guárico","Lara","Mérida","Miranda","Monagas","Nueva Esparta","Portuguesa","Sucre","Táchira","Trujillo","Vargas","Yaracuy","Zulia"];
const GY_STATES = ["Barima-Waini","Cuyuni-Mazaruni","Demerara-Mahaica","East Berbice-Corentyne","Essequibo Islands-West Demerara","Mahaica-Berbice","Pomeroon-Supenaam","Potaro-Siparuni","Upper Demerara-Berbice","Upper Takutu-Upper Essequibo"];

const SEGMENTS = ["mineração", "construção", "logística", "energia", "infraestrutura"];
const STATUSES = ["novo", "contatado", "qualificado", "negociação", "convertido", "descartado"];

const statusColors: Record<string, string> = {
  novo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contatado: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  qualificado: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "negociação": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  convertido: "bg-green-500/10 text-green-400 border-green-500/20",
  descartado: "bg-muted text-muted-foreground border-muted",
};

export default function ProspectionPage() {
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSegment, setFilterSegment] = useState<string>("");

  // AI search params
  const [aiCountry, setAiCountry] = useState("BR");
  const [aiState, setAiState] = useState("");
  const [aiSegment, setAiSegment] = useState("");
  const [aiCount, setAiCount] = useState(5);

  const [editProspect, setEditProspect] = useState<Prospect | null>(null);
  const [editForm, setEditForm] = useState<Partial<Prospect>>({});

  const { data: prospects = [], isLoading } = useProspects({
    country: filterCountry || undefined,
    status: filterStatus || undefined,
    segment: filterSegment || undefined,
    search: search || undefined,
  });

  const updateProspect = useUpdateProspect();
  const deleteProspect = useDeleteProspect();
  const convertToCustomer = useConvertToCustomer();
  const searchAI = useSearchProspectsAI();

  const stateOptions = aiCountry === "BR" ? BR_STATES : aiCountry === "VE" ? VE_STATES : GY_STATES;

  // KPIs
  const totalProspects = prospects.length;
  const byCountry = prospects.reduce((acc, p) => { acc[p.country] = (acc[p.country] || 0) + 1; return acc; }, {} as Record<string, number>);
  const converted = prospects.filter(p => p.status === "convertido").length;
  const avgScore = totalProspects > 0 ? Math.round(prospects.reduce((s, p) => s + p.score, 0) / totalProspects) : 0;

  const handleEdit = (p: Prospect) => {
    setEditProspect(p);
    setEditForm({ name: p.name, company: p.company, email: p.email, phone: p.phone, status: p.status, notes: p.notes });
  };

  const handleSaveEdit = () => {
    if (!editProspect) return;
    updateProspect.mutate({ id: editProspect.id, ...editForm }, { onSuccess: () => setEditProspect(null) });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Prospecção Inteligente</h1>
            <p className="text-sm text-muted-foreground">Encontre clientes potenciais com IA baseado no seu estoque</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5" /> Total</div>
            <p className="text-2xl font-bold">{totalProspects}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Globe className="h-3.5 w-3.5" /> Países</div>
            <p className="text-sm font-medium">{Object.entries(byCountry).map(([k, v]) => `${k}: ${v}`).join(" · ") || "—"}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" /> Convertidos</div>
            <p className="text-2xl font-bold text-green-400">{converted}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Sparkles className="h-3.5 w-3.5" /> Score Médio</div>
            <p className="text-2xl font-bold">{avgScore}</p>
          </CardContent></Card>
        </div>

        {/* AI Search Panel */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Buscar Prospects com IA (GPT-5.2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Select value={aiCountry} onValueChange={v => { setAiCountry(v); setAiState(""); }}>
                <SelectTrigger><SelectValue placeholder="País" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={aiState} onValueChange={setAiState}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {stateOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={aiSegment} onValueChange={setAiSegment}>
                <SelectTrigger><SelectValue placeholder="Segmento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(aiCount)} onValueChange={v => setAiCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 10, 15].map(n => <SelectItem key={n} value={String(n)}>{n} prospects</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                onClick={() => searchAI.mutate({
                  country: aiCountry,
                  state: aiState && aiState !== "todos" ? aiState : undefined,
                  segment: aiSegment && aiSegment !== "todos" ? aiSegment : undefined,
                  count: aiCount,
                })}
                disabled={searchAI.isPending}
                className="font-semibold"
              >
                {searchAI.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Buscar com IA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou empresa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCountry} onValueChange={v => setFilterCountry(v === "todos" ? "" : v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="País" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v === "todos" ? "" : v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSegment} onValueChange={v => setFilterSegment(v === "todos" ? "" : v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Segmento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Pipeline summary */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.filter(s => s !== "descartado").map(s => {
            const count = prospects.filter(p => p.status === s).length;
            return (
              <Badge key={s} variant="outline" className={`${statusColors[s]} cursor-pointer`} onClick={() => setFilterStatus(s === filterStatus ? "" : s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}: {count}
              </Badge>
            );
          })}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Empresa</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Peças</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : prospects.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum prospect. Use a busca com IA acima.</TableCell></TableRow>
                ) : prospects.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.company || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{p.country === "BR" ? "🇧🇷" : p.country === "VE" ? "🇻🇪" : "🇬🇾"} {p.state || ""}</span>
                    </TableCell>
                    <TableCell><span className="text-xs capitalize">{p.segment || "—"}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.score >= 70 ? "border-green-500/30 text-green-400" : p.score >= 40 ? "border-yellow-500/30 text-yellow-400" : "border-red-500/30 text-red-400"}>
                        {p.score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={p.status} onValueChange={v => updateProspect.mutate({ id: p.id, status: v })}>
                        <SelectTrigger className={`h-7 text-xs w-[120px] ${statusColors[p.status] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{p.matched_parts?.length || 0} peças</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}><Edit className="h-3.5 w-3.5" /></Button>
                        {p.status !== "convertido" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-400" onClick={() => convertToCustomer.mutate(p)} title="Converter para Cliente">
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover prospect?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProspect.mutate(p.id)}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editProspect} onOpenChange={o => !o && setEditProspect(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Prospect</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Empresa</Label><Input value={editForm.company || ""} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label>Telefone</Label><Input value={editForm.phone || ""} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div><Label>Status</Label>
                <Select value={editForm.status || "novo"} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notas</Label><Textarea value={editForm.notes || ""} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
              {editProspect?.ai_summary && (
                <div className="rounded-md bg-muted p-3 text-xs"><strong>Resumo IA:</strong> {editProspect.ai_summary}</div>
              )}
              <Button onClick={handleSaveEdit} disabled={updateProspect.isPending} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
