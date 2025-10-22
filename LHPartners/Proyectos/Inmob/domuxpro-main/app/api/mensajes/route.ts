import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

/**
 * GET - Listar mensajes con filtros opcionales
 * Query params:
 *   - remitente_id (number)
 *   - destinatario_id (number)
 *   - leido (boolean)
 * Orden: fecha_envio DESC
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const remitenteId = searchParams.get("remitente_id")
    const destinatarioId = searchParams.get("destinatario_id")
    const leido = searchParams.get("leido")

    const result = await sql<
      {
        id: number
        remitente_id: number
        destinatario_id: number
        asunto: string
        contenido: string
        fecha_envio: string
        leido: boolean
        remitente_nombre: string | null
        remitente_apellido: string | null
        remitente_email: string | null
        destinatario_nombre: string | null
        destinatario_apellido: string | null
        destinatario_email: string | null
      }[]
    >`
      SELECT
        m.*,
        urem.nombre   AS remitente_nombre,
        urem.apellido AS remitente_apellido,
        urem.email    AS remitente_email,
        udest.nombre   AS destinatario_nombre,
        udest.apellido AS destinatario_apellido,
        udest.email    AS destinatario_email
      FROM mensajes m
      LEFT JOIN usuarios urem ON m.remitente_id = urem.id
      LEFT JOIN usuarios udest ON m.destinatario_id = udest.id
      WHERE 1=1
        ${remitenteId ? sql`AND m.remitente_id = ${Number(remitenteId)}` : sql``}
        ${destinatarioId ? sql`AND m.destinatario_id = ${Number(destinatarioId)}` : sql``}
        ${leido !== null ? sql`AND m.leido = ${leido === "true"}` : sql``}
      ORDER BY m.fecha_envio DESC
    `

    return NextResponse.json({ mensajes: result })
  } catch (error) {
    console.error("[mensajes] Error al obtener mensajes:", error)
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
  }
}

/**
 * POST - Crear nuevo mensaje
 * Body esperado:
 *   - remitente_id (number)
 *   - destinatario_id (number)
 *   - asunto (string)
 *   - contenido (string)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      remitente_id: number
      destinatario_id: number
      asunto: string
      contenido: string
    }

    const { remitente_id, destinatario_id, asunto, contenido } = body

    // Validaciones
    if (!remitente_id || typeof remitente_id !== "number") {
      return NextResponse.json({ error: "remitente_id es requerido" }, { status: 400 })
    }
    if (!destinatario_id || typeof destinatario_id !== "number") {
      return NextResponse.json({ error: "destinatario_id es requerido" }, { status: 400 })
    }
    if (!asunto || typeof asunto !== "string") {
      return NextResponse.json({ error: "asunto es requerido" }, { status: 400 })
    }
    if (!contenido || typeof contenido !== "string") {
      return NextResponse.json({ error: "contenido es requerido" }, { status: 400 })
    }

    const inserted = await sql`
      INSERT INTO mensajes (remitente_id, destinatario_id, asunto, contenido)
      VALUES (${remitente_id}, ${destinatario_id}, ${asunto}, ${contenido})
      RETURNING *
    `

    return NextResponse.json({ mensaje: inserted[0] }, { status: 201 })
  } catch (error) {
    console.error("[mensajes] Error al crear mensaje:", error)
    return NextResponse.json({ error: "Error al crear mensaje" }, { status: 500 })
  }
}
