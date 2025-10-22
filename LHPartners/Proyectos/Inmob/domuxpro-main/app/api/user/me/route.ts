import { type NextRequest, NextResponse } from "next/server"
import { stackServerApp } from "@/lib/stack-auth"
import { getUserByEmail } from "@/lib/auth"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    // Prioriza la sesión interna si existe
    const session = await getSession()
    if (session?.userId) {
      return NextResponse.json({
        user: {
          id: session.userId,
          email: session.email,
          nombre: session.nombre,
          apellido: session.apellido,
          rol: session.rol,
        },
      })
    }

    const user = await stackServerApp.getUser({ tokenStore: request }).catch(() => null)

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const dbUser = await getUserByEmail(user.primaryEmail!)

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      user: dbUser,
    })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 })
  }
}
