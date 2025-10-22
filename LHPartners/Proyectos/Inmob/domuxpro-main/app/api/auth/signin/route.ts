import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, getDashboardPath } from "@/lib/auth"
import { createSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 })
    }

    console.log("[v0] Intentando iniciar sesión para:", email)

    const dbUser = await getUserByEmail(email)

    if (!dbUser) {
      console.warn("[v0] Usuario no encontrado:", email)
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // TODO: En producción, verificar password hasheado con bcrypt
    // Por ahora, asumimos que el password es correcto si el usuario existe
    console.log("[v0] Usuario encontrado en la base de datos")

    const session = await createSession(email)

    if (!session) {
      return NextResponse.json({ error: "Error al crear sesión" }, { status: 500 })
    }

    // Determinar el dashboard correspondiente según su rol
    const redirectUrl = getDashboardPath(session.rol)

    console.log(`[v0] Inicio de sesión exitoso. Redirigiendo a: ${redirectUrl}`)

    return NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: session.userId,
        nombre: session.nombre,
        apellido: session.apellido,
        email: session.email,
        rol: session.rol,
      },
    })
  } catch (error) {
    console.error("[v0] Error en el proceso de inicio de sesión:", error)
    const message = error instanceof Error ? error.message : "Error desconocido al iniciar sesión"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
