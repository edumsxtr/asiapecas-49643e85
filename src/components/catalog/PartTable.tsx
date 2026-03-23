import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type Part, formatBRL, getActiveCategories } from "@/data/sample-parts";

interface PartTableProps {
  parts: Part[];
  onSelect: (part: Part) => void;
}

export function PartTable({ parts, onSelect }: PartTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead className="text-right">Estoque</TableHead>
            <TableHead className="text-right">Preço Est.</TableHead>
            <TableHead>Tempo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow
              key={part.id}
              className="cursor-pointer"
              onClick={() => onSelect(part)}
            >
              <TableCell className="font-mono text-xs">{part.material}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm">
                {part.description}
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {getActiveCategories(part).map((cat) => (
                    <Badge key={cat} variant="outline" className="text-[10px] py-0">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs">{part.machineModel}</TableCell>
              <TableCell className="text-right">{part.stock.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="text-right text-sm font-medium">
                {formatBRL(part.estimatedPrice)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={part.lastEntryTime === "mais de 2 anos" ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {part.lastEntryTime}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
