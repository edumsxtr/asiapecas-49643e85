import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  material: string;
  description: string;
  estimated_price?: number;
  stock?: number;
  machine_model?: string;
  manufacturer?: string;
  supplier?: string;
  last_entry_time?: string;
  is_mineracao?: boolean;
  is_linha_amarela?: boolean;
  is_perfuratriz?: boolean;
  is_caminhao_eletrico?: boolean;
  is_guindaste?: boolean;
  compatible_models?: string[];
}

type ImportResult = { inserted: number; updated: number; errors: string[] };

export function ImportCatalogDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const reset = () => {
    setStep("upload");
    setRows([]);
    setFileName("");
    setProgress(0);
    setResult(null);
  };

  const parseBool = (val: any): boolean | undefined => {
    if (val === undefined || val === null || val === "") return undefined;
    if (typeof val === "boolean") return val;
    const s = String(val).toLowerCase().trim();
    return s === "true" || s === "1" || s === "sim" || s === "yes" || s === "x";
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let parsed: ParsedRow[] = [];

        if (file.name.endsWith(".json")) {
          parsed = JSON.parse(data as string);
        } else {
          const wb = XLSX.read(data, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<any>(sheet);

          parsed = json.map((row: any) => {
            const compatStr = String(row.compatible_models || row.modelos_compativeis || row.MODELOS_COMPATIVEIS || "").trim();
            const compatModels = compatStr ? compatStr.split(/[;,]/).map((s: string) => s.trim()).filter(Boolean) : undefined;

            return {
              material: String(row.material || row.Material || row.codigo || row.Código || row.MATERIAL || "").trim(),
              description: String(row.description || row.Description || row.descricao || row.Descrição || row.DESCRICAO || row.DESCRIÇÃO || "").trim(),
              estimated_price: parseFloat(row.estimated_price || row.preco || row.Preço || row.PRECO || row.price || 0) || 0,
              stock: parseInt(row.stock || row.estoque || row.Estoque || row.ESTOQUE || row.qty || 0) || 0,
              machine_model: String(row.machine_model || row.modelo || row.Modelo || row.MODELO || "").trim() || undefined,
              manufacturer: String(row.manufacturer || row.fabricante || row.Fabricante || row.FABRICANTE || "").trim() || undefined,
              supplier: String(row.supplier || row.fornecedor || row.Fornecedor || row.FORNECEDOR || "").trim() || undefined,
              last_entry_time: String(row.last_entry_time || row.tempo_entrada || row.TEMPO_ENTRADA || "").trim() || undefined,
              is_mineracao: parseBool(row.is_mineracao || row.mineracao || row.MINERACAO),
              is_linha_amarela: parseBool(row.is_linha_amarela || row.linha_amarela || row.LINHA_AMARELA),
              is_perfuratriz: parseBool(row.is_perfuratriz || row.perfuratriz || row.PERFURATRIZ),
              is_caminhao_eletrico: parseBool(row.is_caminhao_eletrico || row.caminhao_eletrico || row.CAMINHAO_ELETRICO),
              is_guindaste: parseBool(row.is_guindaste || row.guindaste || row.GUINDASTE),
              compatible_models: compatModels,
            };
          }).filter(r => r.material && r.description);
        }

        if (parsed.length === 0) {
          toast.error("Nenhuma linha válida encontrada. Certifique-se que o arquivo tem colunas 'material' e 'description'.");
          return;
        }

        setRows(parsed);
        setStep("preview");
      } catch (err) {
        toast.error("Erro ao ler arquivo. Verifique o formato.");
        console.error(err);
      }
    };

    if (file.name.endsWith(".json")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImport = async () => {
    setStep("importing");
    const batchSize = 50;
    let inserted = 0, updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          // Build update/insert object with only defined fields
          const partData: Record<string, any> = {
            description: row.description,
            estimated_price: row.estimated_price || 0,
            stock: row.stock || 0,
          };
          if (row.machine_model) partData.machine_model = row.machine_model;
          if (row.manufacturer) partData.manufacturer = row.manufacturer;
          if (row.supplier) partData.supplier = row.supplier;
          if (row.last_entry_time) partData.last_entry_time = row.last_entry_time;
          if (row.is_mineracao !== undefined) partData.is_mineracao = row.is_mineracao;
          if (row.is_linha_amarela !== undefined) partData.is_linha_amarela = row.is_linha_amarela;
          if (row.is_perfuratriz !== undefined) partData.is_perfuratriz = row.is_perfuratriz;
          if (row.is_caminhao_eletrico !== undefined) partData.is_caminhao_eletrico = row.is_caminhao_eletrico;
          if (row.is_guindaste !== undefined) partData.is_guindaste = row.is_guindaste;
          if (row.compatible_models) partData.compatible_models = row.compatible_models;

          // Check if exists
          const { data: existing } = await supabase
            .from("parts")
            .select("id")
            .eq("material", row.material)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase.from("parts").update(partData).eq("id", existing.id);
            if (error) throw error;
            updated++;
          } else {
            const { error } = await supabase.from("parts").insert({
              material: row.material,
              ...partData,
            });
            if (error) throw error;
            inserted++;
          }
        } catch (e: any) {
          errors.push(`${row.material}: ${e.message}`);
        }
      }

      setProgress(Math.round(((i + batch.length) / rows.length) * 100));
    }

    setResult({ inserted, updated, errors });
    setStep("done");
    qc.invalidateQueries({ queryKey: ["parts"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setTimeout(reset, 300); } }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Importar Catálogo</DialogTitle>
          <DialogDescription>Importe peças de uma planilha (.csv, .xlsx) ou arquivo .json</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-1">Formatos aceitos: .csv, .xlsx, .xls, .json</p>
            <p className="text-xs text-muted-foreground mt-2">Colunas: <strong>material</strong>, <strong>description</strong>, preco, estoque, modelo, fabricante, mineracao, linha_amarela, etc.</p>
            <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.json" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{fileName}</Badge>
              <span className="text-sm text-muted-foreground">{rows.length} peças encontradas</span>
            </div>
            <div className="max-h-64 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Modelo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 20).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.material}</TableCell>
                      <TableCell className="text-xs truncate max-w-[200px]">{r.description}</TableCell>
                      <TableCell className="text-xs">{r.estimated_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{r.stock}</TableCell>
                      <TableCell className="text-xs">{r.machine_model || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 20 && <p className="text-xs text-muted-foreground text-center py-2">...e mais {rows.length - 20} peças</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImport} className="flex-1">Importar {rows.length} peças</Button>
              <Button variant="outline" onClick={reset}>Cancelar</Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">Importando... {progress}%</p>
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4 py-4">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <div className="text-center space-y-1">
              <p className="font-medium">Importação concluída!</p>
              <p className="text-sm text-muted-foreground">{result.inserted} inseridas · {result.updated} atualizadas</p>
              {result.errors.length > 0 && (
                <div className="mt-3 text-left">
                  <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {result.errors.length} erro(s):</p>
                  <div className="max-h-32 overflow-auto text-xs text-muted-foreground mt-1 bg-muted p-2 rounded">
                    {result.errors.map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                </div>
              )}
            </div>
            <Button onClick={() => { onClose(); setTimeout(reset, 300); }} className="w-full">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
