import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Evita el warning de ejecución en navegador (sólo afecta si alguien importa esto por error en un componente client)
// const sql = neon(process.env.DATABASE_URL!, { disableWarningInBrowser: true })

// GET - Obtener todos los clientes o buscar por email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    let query
    if (email) {
      query = sql`
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.email,
          c.fecha_registro,
          COUNT(DISTINCT i.id) as total_informes
        FROM clientes c
        LEFT JOIN informes i ON c.id = i.cliente_id
        WHERE c.email = ${email}
        GROUP BY c.id, c.nombre, c.apellido, c.email, c.fecha_registro
      `
    } else {
      query = sql`
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.email,
          c.fecha_registro,
          COUNT(DISTINCT i.id) as total_informes
        FROM clientes c
        LEFT JOIN informes i ON c.id = i.cliente_id
        GROUP BY c.id, c.nombre, c.apellido, c.email, c.fecha_registro
        ORDER BY c.nombre, c.apellido
      `
    }

    const clientes = await query

    return NextResponse.json({ clientes })
  } catch (error) {
    console.error("[v0] Error al obtener clientes:", error)
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
  }
}
