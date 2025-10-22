import { type NextRequest, NextResponse } from "next/server"
import { createOrUpdateUser, getDashboardPath } from "@/lib/auth"
import { createSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre, apellido, rol } = await request.json()

    console.log("[v0] Attempting signup for:", email, "with role:", rol)

    const dbUser = await createOrUpdateUser(email, nombre, apellido, rol || "cliente")

    if (!dbUser) {
      return NextResponse.json({ error: "Error al crear usuario en la base de datos" }, { status: 500 })
    }

    console.log("[v0] DB user created with role:", dbUser.rol)

    const session = await createSession(email)

    if (!session) {
      return NextResponse.json({ error: "Error al crear sesión" }, { status: 500 })
    }

    const redirectUrl = getDashboardPath(dbUser.rol)

    console.log("[v0] Signup successful, redirecting to:", redirectUrl)

    return NextResponse.json({
      success: true,
      redirectUrl,
      user: dbUser,
    })
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return NextResponse.json({ error: "Error al registrarse. El email puede estar en uso." }, { status: 500 })
  }
}
