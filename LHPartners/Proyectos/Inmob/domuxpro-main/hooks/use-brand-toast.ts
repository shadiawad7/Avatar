"use client"

import { useToast } from "@/hooks/use-toast"

export function useBrandToast() {
  const { toast } = useToast()

  const baseTitle = "Inmob · Notificación"

  const show = (description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title: baseTitle,
      description,
      variant,
    })
  }

  return {
    success: (message: string) => show(message, "default"),
    error: (message: string) => show(message, "destructive"),
    info: (message: string) => show(message, "default"),
  }
}
