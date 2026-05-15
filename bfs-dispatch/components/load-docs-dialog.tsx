"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Eye, Trash2 } from "lucide-react";
import { getLoadDocuments, getDocumentSignedUrl, deleteLoadDocument } from "@/lib/actions";

type LoadDocsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId: number | null;
};

export function LoadDocsDialog({ open, onOpenChange, loadId }: LoadDocsDialogProps) {
  const [loadDocuments, setLoadDocuments] = useState<{ document_id: number; document_type: string; file_name: string; file_path: string }[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docUrls, setDocUrls] = useState<Record<number, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function loadDocs(id: number) {
    setLoadingDocs(true);
    setDocUrls({});
    setUploadError(null);
    try {
      const docs = await getLoadDocuments(id);
      setLoadDocuments(docs);
      for (const doc of docs) {
        try {
          const url = await getDocumentSignedUrl(doc.file_path);
          setDocUrls(prev => ({ ...prev, [doc.document_id]: url }));
        } catch {
          setUploadError("Error al cargar la URL del documento");
        }
      }
    } catch {
      setUploadError("Error al cargar los documentos");
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    if (!open || !loadId) return;
    loadDocs(loadId);
  }, [open, loadId]);

  async function handleDeleteDoc(documentId: number, filePath: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await deleteLoadDocument(documentId, filePath);
      if (loadId) {
        const docs = await getLoadDocuments(loadId);
        setLoadDocuments(docs);
      }
    } catch {
      setUploadError("Error al eliminar el documento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Documentación Adjunta</DialogTitle>
          <DialogDescription>
            Documentos asociados a esta carga. Usa el botón de ver para abrir o descargar.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {loadingDocs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : loadDocuments.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No hay documentos adjuntos</p>
          ) : (
            <div className="space-y-3">
              {loadDocuments.map((doc) => (
                <div key={doc.document_id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium text-sm">{doc.document_type}</p>
                      <p className="text-xs text-zinc-500">{doc.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {docUrls[doc.document_id] && (
                      <a
                        href={docUrls[doc.document_id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDoc(doc.document_id, doc.file_path)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
