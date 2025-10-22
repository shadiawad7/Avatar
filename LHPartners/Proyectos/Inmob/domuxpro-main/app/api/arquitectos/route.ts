import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Evita el warning de ejecución en navegador (sólo afecta si alguien importa esto por error en un componente client)
// const sql = neon(process.env.DATABASE_URL!, { disableWarningInBrowser: true })

// GET - Obtener todos los arquitectos o buscar por email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    let query
    if (email) {
      query = sql`
        SELECT 
          a.id,
          a.nombre,
          a.apellido,
          a.email,
          a.fecha_registro,
          COUNT(DISTINCT asig.id) FILTER (WHERE asig.estado = 'aceptada') as proyectos_activos
        FROM arquitectos a
        LEFT JOIN asignaciones asig ON a.id = asig.arquitecto_id
        WHERE a.email = ${email}
        GROUP BY a.id, a.nombre, a.apellido, a.email, a.fecha_registro
      `
    } else {
      query = sql`
        SELECT 
          a.id,
          a.nombre,
          a.apellido,
          a.email,
          a.fecha_registro,
          COUNT(DISTINCT asig.id) FILTER (WHERE asig.estado = 'aceptada') as proyectos_activos
        FROM arquitectos a
        LEFT JOIN asignaciones asig ON a.id = asig.arquitecto_id
        GROUP BY a.id, a.nombre, a.apellido, a.email, a.fecha_registro
        ORDER BY a.nombre, a.apellido
      `
    }

    const arquitectos = await query

    return NextResponse.json({ arquitectos })
  } catch (error) {
    console.error("[v0] Error al obtener arquitectos:", error)
    return NextResponse.json({ error: "Error al obtener arquitectos" }, { status: 500 })
  }
}
