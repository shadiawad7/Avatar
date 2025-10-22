"use client"

import { NuevoInformeWizard } from "@/components/nuevo-informe-wizard"
import { useSearchParams } from "next/navigation"

function parseId(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export default function ArquitectoNuevoInformePage() {
  const searchParams = useSearchParams()
  const asignacionId = parseId(searchParams?.get("asignacion_id") ?? null)
  const clienteId = parseId(searchParams?.get("cliente_id") ?? null)

  return (
    <NuevoInformeWizard
      roleLabel="Arquitecto"
      successRedirect={(informeId) => `/dashboard/arquitecto?tab=informes&informe=${informeId}`}
      asignacionId={asignacionId}
      clienteId={clienteId}
    />
  )
}
