import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"

// =============== GET: listar mensajes ===============
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("cliente_id")
    const estado = searchParams.get("estado")

    let mensajes

    if (clienteId && estado) {
      mensajes = await sql`
        SELECT 
          c.*,
          u.nombre   AS usuario_nombre,
          u.apellido AS usuario_apellido,
          u.email    AS usuario_email
        FROM contacto c
        LEFT JOIN usuarios u ON c.cliente_id = u.id
        WHERE c.cliente_id = ${Number(clienteId)} AND c.estado = ${estado}
        ORDER BY c.fecha_creacion DESC
      `
    } else if (clienteId) {
      mensajes = await sql`
        SELECT 
          c.*,
          u.nombre   AS usuario_nombre,
          u.apellido AS usuario_apellido,
          u.email    AS usuario_email
        FROM contacto c
        LEFT JOIN usuarios u ON c.cliente_id = u.id
        WHERE c.cliente_id = ${Number(clienteId)}
        ORDER BY c.fecha_creacion DESC
      `
    } else if (estado) {
      mensajes = await sql`
        SELECT 
          c.*,
          u.nombre   AS usuario_nombre,
          u.apellido AS usuario_apellido,
          u.email    AS usuario_email
        FROM contacto c
        LEFT JOIN usuarios u ON c.cliente_id = u.id
        WHERE c.estado = ${estado}
        ORDER BY c.fecha_creacion DESC
      `
    } else {
      mensajes = await sql`
        SELECT 
          c.*,
          u.nombre   AS usuario_nombre,
          u.apellido AS usuario_apellido,
          u.email    AS usuario_email
        FROM contacto c
        LEFT JOIN usuarios u ON c.cliente_id = u.id
        ORDER BY c.fecha_creacion DESC
      `
    }

    return NextResponse.json({ mensajes })
  } catch (error) {
    console.error("[contacto][GET] Error:", error)
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
  }
}

// =============== POST: crear mensaje ===============
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "No autenticado. Por favor, inicia sesión nuevamente." }, { status: 401 })
    }

    const usuarioId = Number(session.userId)
    if (!Number.isFinite(usuarioId)) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    const body = await request.json()
    const { asunto, mensaje } = body
    if (!asunto || !mensaje) {
      return NextResponse.json({ error: "Asunto y mensaje son obligatorios" }, { status: 400 })
    }

    const inserted = await sql`
      INSERT INTO contacto (cliente_id, asunto, mensaje, estado)
      VALUES (${usuarioId}, ${asunto}, ${mensaje}, 'pendiente')
      RETURNING *
    `

    const usuarioRows = await sql`
      SELECT id, nombre, apellido, email
      FROM usuarios
      WHERE id = ${usuarioId}
      LIMIT 1
    `
    const usuario = usuarioRows[0] || null

    return NextResponse.json(
      { mensaje: { ...inserted[0], usuario } },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error en POST /api/contacto:", error)
    return NextResponse.json({ error: "Error al crear mensaje" }, { status: 500 })
  }
}

// =============== PATCH: actualizar estado por id (en esta misma ruta) ===============
const ESTADOS_VALIDOS = new Set(["pendiente", "respondido", "en_proceso", "rechazado"]) // ajusta si hace falta

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({} as any))
    const { id, estado } = body as { id?: number; estado?: string }

    if (!id || !Number.isFinite(Number(id))) {
      return NextResponse.json({ error: "Falta 'id' válido en el body" }, { status: 400 })
    }
    if (!estado) {
      return NextResponse.json({ error: "Falta 'estado' en el body" }, { status: 400 })
    }
    if (!ESTADOS_VALIDOS.has(estado)) {
      return NextResponse.json({ error: `Estado inválido. Usa uno de: ${[...ESTADOS_VALIDOS].join(", ")}` }, { status: 400 })
    }

    const mensajeId = Number(id)

    const updated = await sql`
      UPDATE contacto
      SET 
        estado = ${estado},
        fecha_respuesta = CASE 
          WHEN ${estado} IN ('respondido', 'rechazado') THEN NOW() 
          ELSE fecha_respuesta 
        END
      WHERE id = ${mensajeId}
      RETURNING *;
    `

    if (updated.length === 0) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ mensaje: updated[0] })
  } catch (error) {
    console.error("[contacto][PATCH] Error:", error)
    return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 })
  }
}
