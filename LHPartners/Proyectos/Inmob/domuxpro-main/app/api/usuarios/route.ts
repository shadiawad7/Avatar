import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

/**
 * GET - Listar usuarios con filtros opcionales
 * Query params:
 *   - rol (string): 'gestor' | 'arquitecto' | 'cliente'
 *   - activo (boolean)
 * Orden: apellido, nombre ASC
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rol = searchParams.get("rol")
    const activo = searchParams.get("activo")

    const result = await sql<
      {
        id: number
        nombre: string
        apellido: string
        email: string
        rol: string
        telefono: string | null
        activo: boolean
        fecha_registro: string
      }[]
    >`
      SELECT
        id,
        nombre,
        apellido,
        email,
        rol,
        telefono,
        activo,
        fecha_registro
      FROM usuarios
      WHERE 1=1
        ${rol ? sql`AND rol = ${rol}` : sql``}
        ${activo !== null ? sql`AND activo = ${activo === "true"}` : sql``}
      ORDER BY apellido ASC, nombre ASC
    `

    return NextResponse.json({ usuarios: result })
  } catch (error) {
    console.error("[usuarios] Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

/**
 * POST - Crear nuevo usuario
 * Body esperado:
 *   - nombre (string)
 *   - apellido (string)
 *   - email (string)
 *   - rol (string): 'gestor' | 'arquitecto' | 'cliente'
 *   - telefono (string | null) (opcional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      nombre: string
      apellido: string
      email: string
      rol: string
      telefono?: string | null
    }

    const { nombre, apellido, email, rol, telefono } = body

    // Validaciones
    if (!nombre || typeof nombre !== "string") {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 })
    }
    if (!apellido || typeof apellido !== "string") {
      return NextResponse.json({ error: "apellido es requerido" }, { status: 400 })
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email es requerido" }, { status: 400 })
    }
    if (!rol || !["gestor", "arquitecto", "cliente"].includes(rol)) {
      return NextResponse.json({ error: "rol debe ser 'gestor', 'arquitecto' o 'cliente'" }, { status: 400 })
    }

    // Verificar que el email no exista
    const [existing] = await sql<{ id: number }[]>`
      SELECT id FROM usuarios WHERE email = ${email} LIMIT 1
    `
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 })
    }

    const inserted = await sql`
      INSERT INTO usuarios (nombre, apellido, email, rol, telefono)
      VALUES (${nombre}, ${apellido}, ${email}, ${rol}, ${telefono ?? null})
      RETURNING *
    `

    return NextResponse.json({ usuario: inserted[0] }, { status: 201 })
  } catch (error) {
    console.error("[usuarios] Error al crear usuario:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
