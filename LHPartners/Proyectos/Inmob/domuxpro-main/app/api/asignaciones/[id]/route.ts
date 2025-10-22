export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const asignacionId = Number(id)
    if (!Number.isFinite(asignacionId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({} as any))
    const { estado, notas } = body as { estado?: "pendiente" | "aceptada" | "rechazada"; notas?: string | null }

    if (!estado && typeof notas === "undefined") {
      return NextResponse.json({ error: "Envía 'estado' y/o 'notas'." }, { status: 400 })
    }

    const updated = await sql`
      UPDATE asignaciones
      SET
        estado = COALESCE(${estado}, estado),
        notas  = COALESCE(${notas},  notas)
      WHERE id = ${asignacionId}
      RETURNING *
    `
    if (!updated?.[0]) {
      return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ asignacion: updated[0] })
  } catch (error) {
    console.error("[asignaciones:id][PATCH] Error:", error)
    return NextResponse.json({ error: "Error al actualizar asignación" }, { status: 500 })
  }
}
