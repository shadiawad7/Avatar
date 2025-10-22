import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const filename = request.headers.get("X-Filename") || "photo.jpg"
    const contentType = request.headers.get("Content-Type") || "image/jpeg"

    // Obtener el body como blob
    const blob = await request.blob()

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = filename.split(".").pop()
    const uniqueFilename = `informes/${timestamp}-${randomString}.${extension}`

    // Subir a Vercel Blob
    const { url } = await put(uniqueFilename, blob, {
      access: "public",
      contentType,
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error uploading photo:", error)
    return NextResponse.json({ error: "Error al subir la foto" }, { status: 500 })
  }
}
