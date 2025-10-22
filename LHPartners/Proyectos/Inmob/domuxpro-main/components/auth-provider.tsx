"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import type { User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    fetchUser()
  }, [pathname])

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/user/me", {
        method: "GET",
        credentials: "include", // 🔥 MUY IMPORTANTE: envía las cookies de sesión
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 401) {
        // No autenticado
        setUser(null)
      } else {
        console.error("[v0] Error al obtener el usuario:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error fetching user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      setUser(null)
      window.location.href = "/auth/signin"
    } catch (error) {
      console.error("[v0] Error signing out:", error)
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
