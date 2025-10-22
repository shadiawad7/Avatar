// app/api/upload/route.ts
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getSession } from "@/lib/session"

// Si tu getSession funciona en Edge, déjalo. Si no, comenta la línea de abajo.
// (Edge te permite leer request.formData() sin streams)
// Si falla con tu sesión, elimina esta export y correrá en Node.
// Más simple: primero pruébalo con Edge; si te da 500 por la sesión, bórrala.
export const runtime = "edge"

export async function POST(request: Request) {
  // (Opcional) proteger la subida con sesión
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
  } catch {
    // Si getSession no es compatible con Edge, puedes:
    // 1) borrar este try/catch; o
    // 2) borrar la export const runtime = "edge" de arriba.
  }

  try {
    const form = await request.formData()

    // Aceptamos múltiples archivos bajo la misma clave "files"
    // (PhotoUploader hace form.append("files", file) por cada imagen)
    const files = form.getAll("files") as File[]

    if (!files.length) {
      return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 })
    }

    const urls: string[] = []

    for (const file of files) {
      // Validaciones básicas
      if (!file.type?.startsWith("image/")) {
        return NextResponse.json({ error: `Tipo no permitido: ${file.type || "desconocido"}` }, { status: 400 })
      }
      const maxBytes = 5 * 1024 * 1024 // 5MB
      if ((file as any).size && (file as any).size > maxBytes) {
        return NextResponse.json({ error: "Las imágenes deben ser menores a 5MB" }, { status: 413 })
      }

      // Nombre seguro + “carpeta” uploads
      const safeName = (file.name || "imagen").replace(/[^\w.\-]+/g, "_")
      const key = `uploads/${Date.now()}-${safeName}`

      const blob = await put(key, file, {
        access: "public",                       // URL pública
        addRandomSuffix: true,                  // evita colisiones
        contentType: file.type || "application/octet-stream",
      })

      urls.push(blob.url)
    }

    return NextResponse.json({ urls })
  } catch (err) {
    console.error("[/api/upload] Error al subir:", err)
    return NextResponse.json({ error: "Fallo al subir archivos" }, { status: 500 })
  }
}
