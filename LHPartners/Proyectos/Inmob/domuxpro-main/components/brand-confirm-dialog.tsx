"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type ConfirmOptions = {
  title?: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  tone?: "default" | "danger"
  size?: "sm" | "md" | "lg"
  scrollable?: boolean
}

const BrandConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null)

const DEFAULT_OPTIONS: ConfirmOptions = {
  title: "Confirmar acción",
  description: "¿Deseas continuar?",
  confirmText: "Continuar",
  cancelText: "Cancelar",
  tone: "default",
  size: "md",
  scrollable: false,
}

export function BrandConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ open: boolean; options: ConfirmOptions }>({ open: false, options: DEFAULT_OPTIONS })
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const closeDialog = useCallback((result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setState({ open: false, options: DEFAULT_OPTIONS })
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setState({ open: true, options: { ...DEFAULT_OPTIONS, ...options } })
    })
  }, [])

  const dialogToneClasses = useMemo(() => {
    return state.options.tone === "danger"
      ? "border-destructive/20 bg-destructive/5"
      : "border-primary/20 bg-primary/5"
  }, [state.options.tone])

  const sizeClass = useMemo(() => {
    switch (state.options.size) {
      case "sm":
        return "max-w-md"
      case "lg":
        return "max-w-3xl"
      case "md":
      default:
        return "max-w-xl"
    }
  }, [state.options.size])

  return (
    <BrandConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open && resolverRef.current) {
            closeDialog(false)
          }
        }}
      >
        <AlertDialogContent className={sizeClass}>
          <AlertDialogHeader className="space-y-4">
            <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${dialogToneClasses}`}>
              <div className="relative h-12 w-12 overflow-hidden rounded-md bg-white shadow-sm">
                <Image src="/placeholder-logo.svg" alt="Inmob logo" fill sizes="48px" className="object-contain p-2" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Inmob · Plataforma Profesional</p>
                <p className="text-xs text-muted-foreground">Confirma la acción antes de continuar</p>
              </div>
            </div>
            <AlertDialogTitle className="text-left text-xl font-semibold text-foreground">
              {state.options.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {state.options.scrollable ? (
                <div className="text-left text-sm leading-relaxed text-muted-foreground">
                  <div className="max-h-60 space-y-3 overflow-y-auto pr-1 text-sm leading-relaxed">
                    {state.options.description}
                  </div>
                </div>
              ) : (
                <div className="text-left text-sm leading-relaxed text-muted-foreground">
                  {state.options.description}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
                {state.options.cancelText ?? DEFAULT_OPTIONS.cancelText}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={state.options.tone === "danger" ? "destructive" : "default"}
                onClick={() => closeDialog(true)}
              >
                {state.options.confirmText ?? DEFAULT_OPTIONS.confirmText}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BrandConfirmContext.Provider>
  )
}

export function useBrandConfirm() {
  const ctx = useContext(BrandConfirmContext)
  if (!ctx) {
    throw new Error("useBrandConfirm must be used within a BrandConfirmProvider")
  }
  return ctx
}
