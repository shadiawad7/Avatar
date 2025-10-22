export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { stackServerApp } from "@/lib/stack-auth"
import { getUserByEmail } from "@/lib/auth"

async function resolveCurrentUser(request: NextRequest) {
  const session = await getSession()
  let userId = session?.userId ?? null
  let userRole = session?.rol ?? null
  let userEmail = session?.email ?? null

  if (!userId) {
    const stackUser = await stackServerApp.getUser({ tokenStore: request }).catch(() => null)
    userEmail = stackUser?.primaryEmail ?? userEmail
    const dbUser = stackUser?.primaryEmail ? await getUserByEmail(stackUser.primaryEmail) : null
    userId = dbUser?.id ?? null
    userRole = dbUser?.rol ?? null
  }

  return { userId, userRole, userEmail }
}

export async function GET(request: NextRequest) {
  try {
    const { userId, userRole, userEmail } = await resolveCurrentUser(request)

    if (!userId && !userEmail) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // 2) Si es gestor, devuelve todas las asignaciones
    if (userRole === "gestor") {
      const asignaciones = await sql`
      SELECT
        a.*,
        ucli.nombre   AS cliente_nombre,
        ucli.apellido AS cliente_apellido,
        ucli.email    AS cliente_email,
        uarq.nombre   AS arquitecto_nombre,
        uarq.apellido AS arquitecto_apellido
      FROM asignaciones a
      LEFT JOIN usuarios ucli ON a.cliente_id = ucli.id
      LEFT JOIN arquitectos arq ON a.arquitecto_id = arq.id
      LEFT JOIN usuarios uarq ON arq.usuario_id = uarq.id
      ORDER BY a.fecha_asignacion DESC
    `

    return NextResponse.json({ asignaciones })
    }

    // 3) Para arquitectos, filtrar por su propio id
    let arquitectoId: number | null = null
    if (userId) {
      const arqByUser = await sql`SELECT id FROM arquitectos WHERE usuario_id = ${userId} LIMIT 1`
      arquitectoId = arqByUser?.[0]?.id ?? null
    }

    if (arquitectoId == null && userEmail) {
      const arqByEmail = await sql`SELECT id FROM arquitectos WHERE LOWER(email) = LOWER(${userEmail}) LIMIT 1`
      arquitectoId = arqByEmail?.[0]?.id ?? null
    }

    if (arquitectoId == null) {
      // No hay fila en arquitectos para este usuario → 0 asignaciones
      return NextResponse.json({ asignaciones: [] })
    }

    const asignaciones = await sql`
      SELECT
        a.*,
        ucli.nombre   AS cliente_nombre,
        ucli.apellido AS cliente_apellido,
        ucli.email    AS cliente_email,
        uarq.nombre   AS arquitecto_nombre,
        uarq.apellido AS arquitecto_apellido
      FROM asignaciones a
      LEFT JOIN usuarios ucli ON a.cliente_id = ucli.id
      LEFT JOIN arquitectos arq ON a.arquitecto_id = arq.id
      LEFT JOIN usuarios uarq ON arq.usuario_id = uarq.id
      WHERE a.arquitecto_id = ${arquitectoId}
      ORDER BY a.fecha_asignacion DESC
    `

    return NextResponse.json({ asignaciones })
  } catch (error) {
    console.error("[asignaciones][GET] Error:", error)
    return NextResponse.json({ error: "Error al obtener asignaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, userRole } = await resolveCurrentUser(request)

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    if (userRole !== "gestor") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const clienteId = Number(body?.cliente_id)
    const arquitectoId = Number(body?.arquitecto_id)
    const notas = typeof body?.notas === "string" ? body.notas.trim() : null

    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      return NextResponse.json({ error: "cliente_id inválido" }, { status: 400 })
    }
    if (!Number.isFinite(arquitectoId) || arquitectoId <= 0) {
      return NextResponse.json({ error: "arquitecto_id inválido" }, { status: 400 })
    }

    const inserted = await sql`
      INSERT INTO asignaciones (cliente_id, arquitecto_id, notas)
      VALUES (${clienteId}, ${arquitectoId}, ${notas})
      RETURNING *
    `

    const asignacionBase = inserted?.[0]
    if (!asignacionBase) {
      return NextResponse.json({ error: "No se pudo crear la asignación" }, { status: 500 })
    }

    const asignacionCompleta = (
      await sql`
        SELECT
          a.*,
          ucli.nombre   AS cliente_nombre,
          ucli.apellido AS cliente_apellido,
          ucli.email    AS cliente_email,
          uarq.nombre   AS arquitecto_nombre,
          uarq.apellido AS arquitecto_apellido
        FROM asignaciones a
        LEFT JOIN usuarios ucli ON a.cliente_id = ucli.id
        LEFT JOIN arquitectos arq ON a.arquitecto_id = arq.id
        LEFT JOIN usuarios uarq ON arq.usuario_id = uarq.id
        WHERE a.id = ${asignacionBase.id}
        LIMIT 1
      `
    )?.[0] ?? asignacionBase

    return NextResponse.json({ asignacion: asignacionCompleta }, { status: 201 })
  } catch (error) {
    console.error("[asignaciones][POST] Error:", error)
    return NextResponse.json({ error: "Error al crear asignación" }, { status: 500 })
  }
}
