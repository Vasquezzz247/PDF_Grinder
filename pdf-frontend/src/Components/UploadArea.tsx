import { useState } from "react";
import axios from "axios";
import { Alert } from "@mui/material";


import type { DragEndEvent } from "@dnd-kit/core";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

type FileWithPreview = {
  id: string; 
  file: File;
  url: string;
};

function SortableItem({
  id,
  file,
  url,
  onRemove,
}: {
  id: string;
  file: File;
  url: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-32 h-44 border rounded shadow bg-white overflow-hidden"
    >
      <iframe
        src={url}
        width="100%"
        height="100%"
        className="rounded pointer-events-none" // evita bloquear drag
        title={file.name}
      />
      <button
        onClick={onRemove}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 text-xs hover:bg-red-700 pointer-events-auto"
        title="Eliminar archivo"
      >
        ✕
      </button>
      <p className="absolute bottom-0 w-full text-xs text-center text-gray-600 truncate px-1 bg-white bg-opacity-70">
        {file.name}
      </p>
    </div>
  );
}

export default function UploadArea() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const sensors = useSensors(useSensor(PointerSensor));

 
  const convertFiles = async (fileList: File[]): Promise<FileWithPreview[]> => {
    const results: FileWithPreview[] = [];
    for (const file of fileList) {
      const blob = new Blob([await file.arrayBuffer()], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      results.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        url,
      });
    }
    return results;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = await convertFiles(Array.from(e.target.files));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    if (dropped.length === 0) {
      setError("Solo se permiten archivos PDF.");
      return;
    }
    const newFiles = await convertFiles(dropped);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveFile = (idToRemove: string) => {
    setFiles((prev) => {
      const toRemove = prev.find((f) => f.id === idToRemove);
      if (toRemove) URL.revokeObjectURL(toRemove.url);
      return prev.filter((f) => f.id !== idToRemove);
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Seleccioná al menos 2 archivos PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setMergedUrl(null);

    const formData = new FormData();
    
    files.forEach(({ file }) => formData.append("files", file));

    try {
      const res = await axios.post("http://localhost:3000/api/merge", formData, {
        responseType: "blob",
      });

      const blobUrl = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      setMergedUrl(blobUrl);
    } catch {
      setError("Hubo un error al unir los PDFs.");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start px-10 py-12 bg-gray-100">
     

      <div className="w-full max-w-5xl bg-white rounded shadow-lg p-6 flex flex-col gap-6">
        {files.length === 0 && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="w-full border-2 border-dashed border-blue-400 rounded-lg p-6 text-center text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer transition"
          >
            Arrastrá y soltá aquí tus archivos PDF
            <br />
            o seleccioná manualmente abajo.
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={files.map((f) => f.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-4 overflow-auto">
              {files.map(({ id, file, url }) => (
                <SortableItem
                  key={id}
                  id={id}
                  file={file}
                  url={url}
                  onRemove={() => handleRemoveFile(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          />
          <button 
            onClick={handleMerge}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Unificando..." : "Unir PDFs"}
          </button>
        </div>

        {error && <Alert severity="error">{error}</Alert>}

        {mergedUrl && (
          <div className="mt-4 space-y-2">
            <Alert severity="success">✅ ¡PDF combinado creado con éxito!</Alert>
            <a
              href={mergedUrl}
              download="merged.pdf"
              className="text-green-600 underline font-semibold block"
            >
              Descargar PDF combinado
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
