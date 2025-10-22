import { type NextRequest, NextResponse } from "next/server"
import { destroySession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Signing out user")

    await destroySession()

    console.log("[v0] Signout successful")

    return NextResponse.json({
      success: true,
      redirectUrl: "/auth/signin",
    })
  } catch (error) {
    console.error("[v0] Sign out error:", error)
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 })
  }
}
