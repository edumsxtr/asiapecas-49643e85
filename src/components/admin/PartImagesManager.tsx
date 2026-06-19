import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Star, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import {
  usePartImages,
  useUploadPartImage,
  useDeletePartImage,
  useSetPrimaryImage,
  useReorderPartImages,
  type PartImage,
} from "@/hooks/use-part-images";

interface Props {
  partId: string;
  material: string;
}

export function PartImagesManager({ partId, material }: Props) {
  const { data: images = [], isLoading } = usePartImages(partId);
  const upload = useUploadPartImage();
  const del = useDeletePartImage();
  const setPrimary = useSetPrimaryImage();
  const reorder = useReorderPartImages();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 8 * 1024 * 1024) continue;
        await upload.mutateAsync({ partId, material, file });
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const move = (img: PartImage, dir: -1 | 1) => {
    const ordered = [...images].sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex((i) => i.id === img.id);
    const target = idx + dir;
    if (target < 0 || target >= ordered.length) return;
    [ordered[idx], ordered[target]] = [ordered[target], ordered[idx]];
    reorder.mutate({ partId, orderedIds: ordered.map((i) => i.id) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">Imagens da peça</h3>
          <p className="text-xs text-muted-foreground">
            {images.length} foto(s) · Primeira é capa por padrão · Máx. 8MB por imagem
          </p>
        </div>
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          size="sm"
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Enviar fotos
        </Button>
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : images.length === 0 ? (
        <Card
          className="border-dashed p-8 text-center cursor-pointer hover:border-primary/40"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Clique para enviar fotos ou arraste aqui
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <Card key={img.id} className="relative group overflow-hidden">
              <div className="aspect-square bg-muted">
                <img
                  src={img.url}
                  alt={img.alt_text || ""}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {img.is_primary && (
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground gap-1">
                  <Star className="h-3 w-3 fill-current" /> Capa
                </Badge>
              )}
              <div className="p-2 flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(img, -1)}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(img, 1)}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  {!img.is_primary && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPrimary.mutate(img)} title="Definir capa">
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del.mutate(img)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
