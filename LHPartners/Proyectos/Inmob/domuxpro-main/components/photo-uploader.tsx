"use client"

import { useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface PhotoUploaderProps {
  label: string
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos?: number
}

export function PhotoUploader({ label, photos, onChange, maxPhotos = 10 }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ id estable y seguro (no depende del texto del label)
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const openFileDialog = () => {
    setError(null)
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Límite de fotos
    if (photos.length + files.length > maxPhotos) {
      setError(`Máximo ${maxPhotos} fotos permitidas`)
      // Limpia el input para permitir re-selección
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setUploading(true)
    setError(null)

    try {
      const form = new FormData()
      Array.from(files).forEach((file) => {
        // Validaciones locales
        if (!file.type.startsWith("image/")) {
          throw new Error("Solo se permiten archivos de imagen")
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Las imágenes deben ser menores a 5MB")
        }
        form.append("files", file)
      })

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        throw new Error(text || "Error al subir la foto")
      }

      const data = (await response.json()) as { urls?: string[]; error?: string }
      if (data.error) throw new Error(data.error)

      const uploaded = Array.isArray(data.urls) ? data.urls : []
      if (!uploaded.length) {
        throw new Error("La API no devolvió URLs")
      }

      onChange([...photos, ...uploaded])
    } catch (err: any) {
      console.error("Error uploading photos:", err)
      setError(err?.message || "Error al subir las fotos. Intenta de nuevo.")
    } finally {
      setUploading(false)
      // ✅ Limpiamos el input SIEMPRE usando ref (seguro en React 19)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onChange(newPhotos)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">
          {photos.length}/{maxPhotos}
        </span>
      </div>

      {/* Grid de fotos subidas */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo || "/placeholder.svg"}
                alt={`Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input real (oculto) */}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* Botón que abre el file picker */}
      {photos.length < maxPhotos && (
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="w-full bg-transparent"
          onClick={openFileDialog}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Subir fotos
            </>
          )}
        </Button>
      )}

      {/* Mensaje de error */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Ayuda */}
      <p className="text-xs text-gray-500">Formatos: JPG, JPEG, PNG. Máximo 5MB por foto.</p>
    </div>
  )
}
