"use client"

import { NuevoInformeWizard } from "@/components/nuevo-informe-wizard"

export default function GestorNuevoInformePage() {
  return (
    <NuevoInformeWizard
      roleLabel="Gestor"
      successRedirect={(informeId) => `/dashboard/gestor/informes/${informeId}`}
    />
  )
}
