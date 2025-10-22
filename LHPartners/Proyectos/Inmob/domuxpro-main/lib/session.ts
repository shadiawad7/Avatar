import { cookies } from "next/headers"
import { getUserByEmail } from "./auth"

export interface SessionData {
  userId: number
  email: string
  rol: string
  nombre: string
  apellido: string
}

// Crear sesión
export async function createSession(email: string): Promise<SessionData | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
    apellido: user.apellido,
  }

  const cookieStore = await cookies() // 👈 añadir await

  cookieStore.set("session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  })

  return sessionData
}

// Obtener sesión actual
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies() // 👈 añadir await
    const sessionCookie = cookieStore.get("session")
    if (!sessionCookie?.value) return null
    const sessionData = JSON.parse(sessionCookie.value) as SessionData
    return sessionData
  } catch (error) {
    console.error("[v0] Error parsing session:", error)
    return null
  }
}

// Destruir sesión
export async function destroySession() {
  const cookieStore = await cookies() // 👈 añadir await
  cookieStore.delete("session")
  cookieStore.delete("user_role")
}
