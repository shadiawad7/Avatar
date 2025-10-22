import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicPaths = ["/auth/signin", "/auth/signup", "/auth/callback", "/api/auth"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get("session")
  const hasSession = !!sessionCookie?.value

  console.log("[v0] Middleware - Path:", pathname, "Has session:", hasSession)

  // Si intenta acceder a dashboard sin sesión, redirigir a signin
  if (!hasSession && pathname.startsWith("/dashboard")) {
    console.log("[v0] No session found, redirecting to signin")
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  // Si está en la raíz y tiene sesión, redirigir a su dashboard
  if (pathname === "/" && hasSession) {
    try {
      const sessionData = JSON.parse(sessionCookie!.value)
      const dashboardPath = getDashboardPathFromRole(sessionData.rol)
      console.log("[v0] Redirecting authenticated user to:", dashboardPath)
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    } catch (error) {
      console.error("[v0] Error parsing session in middleware:", error)
    }
  }

  // Verificar que el usuario esté en el dashboard correcto según su rol
  if (pathname.startsWith("/dashboard") && hasSession) {
    try {
      const sessionData = JSON.parse(sessionCookie!.value)
      const correctDashboard = getDashboardPathFromRole(sessionData.rol)

      if (!pathname.startsWith(correctDashboard)) {
        console.log("[v0] Wrong dashboard, redirecting to:", correctDashboard)
        return NextResponse.redirect(new URL(correctDashboard, request.url))
      }
    } catch (error) {
      console.error("[v0] Error verifying dashboard access:", error)
    }
  }

  return NextResponse.next()
}

function getDashboardPathFromRole(rol: string): string {
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
