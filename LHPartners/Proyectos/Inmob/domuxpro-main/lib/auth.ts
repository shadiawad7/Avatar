import { sql } from "@/lib/db"

export type UserRole = "cliente" | "arquitecto" | "gestor"

export interface User {
  id: number
  email: string
  nombre: string
  apellido: string
  rol: UserRole
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, email, nombre, apellido, rol
      FROM usuarios
      WHERE email = ${email}
      LIMIT 1
    `
    return (result[0] as User) || null
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return null
  }
}

export async function createOrUpdateUser(
  email: string,
  nombre: string,
  apellido = "",
  rol: UserRole = "cliente",
): Promise<User | null> {
  try {
    const result = await sql`
      INSERT INTO usuarios (email, nombre, apellido, rol)
      VALUES (${email}, ${nombre}, ${apellido}, ${rol})
      ON CONFLICT (email) 
      DO UPDATE SET 
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido
      RETURNING id, email, nombre, apellido, rol
    `
    return result[0] as User
  } catch (error) {
    console.error("[v0] Error creating/updating user:", error)
    return null
  }
}

export function getDashboardPath(rol: UserRole): string {
  switch (rol) {
    case "cliente":
      return "/dashboard/cliente"
    case "arquitecto":
      return "/dashboard/arquitecto"
    case "gestor":
      return "/dashboard/gestor"
    default:
      return "/dashboard/cliente"
  }
}
