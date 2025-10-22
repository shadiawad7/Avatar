"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Pencil } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

type KeyValue = Record<string, any>

function isTruthy(value: any) {
  return !(value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0))
}

function toLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === "number") return value.toLocaleString("es-ES")
  if (Array.isArray(value)) return value.filter((v) => isTruthy(v)).join(", ")
  return String(value)
}

function KeyValueSection({ title, data }: { title: string; data?: KeyValue | null }) {
  const entries = useMemo(() => {
    if (!data || typeof data !== "object") return []
    return Object.entries(data).filter(([, value]) => isTruthy(value) && typeof value !== "object")
  }, [data])

  const complexEntries = useMemo(() => {
    if (!data || typeof data !== "object") return []
    return Object.entries(data).filter(
      ([, value]) => isTruthy(value) && typeof value === "object" && !Array.isArray(value),
    )
  }, [data])

  if (!entries.length && !complexEntries.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{toLabel(key)}</span>
                <span className="text-sm font-medium text-foreground mt-1">{formatValue(value)}</span>
              </div>
            ))}
          </div>
        )}

        {complexEntries.map(([key, value]) => (
          <div key={key}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{toLabel(key)}</p>
            <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(value, null, 2)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

type InformeApprovalState = "pendiente" | "aprobado" | "rechazado"
const INFORME_APPROVAL_LABELS: Record<InformeApprovalState, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
}
const INFORME_APPROVAL_BADGE: Record<InformeApprovalState, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "secondary",
  aprobado: "default",
  rechazado: "destructive",
}

function normalizeApprovalState(value: unknown): InformeApprovalState {
  if (typeof value !== "string") return "pendiente"
  const normalized = value.trim().toLowerCase()
  return (["pendiente", "aprobado", "rechazado"] as const).includes(normalized as InformeApprovalState)
    ? (normalized as InformeApprovalState)
    : "pendiente"
}

export default function ArquitectoInformeDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const informe = data?.informe
  const inmueble = data?.inmueble
  const inspector = data?.inspector
  const approvalState = normalizeApprovalState(informe?.estado_aprobacion)

  useEffect(() => {
    const informeId = Number(params?.id)
    if (!informeId) {
      setError("Identificador de informe inválido")
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/informes/${informeId}`, { cache: "no-store" })
        if (!res.ok) {
          setError("No se pudo cargar el informe")
          return
        }
        const body = await res.json()
        setData(body)
      } catch (err) {
        console.error("[arquitecto][detalle informe] Error:", err)
        setError("Ocurrió un error al obtener el informe")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params?.id])

  const handleVolver = () => {
    router.push("/dashboard/arquitecto?tab=informes")
  }

  const handleEditar = () => {
    const informeId = params?.id
    if (!informeId) return
    if (user?.rol !== "gestor" && !(user?.rol === "arquitecto" && approvalState !== "aprobado")) {
      return
    }
    router.push(`/dashboard/gestor/informes/${informeId}/editar`)
  }

  const handleImprimir = () => {
    const informeId = params?.id
    if (!informeId) return
    if (typeof window !== "undefined") {
      window.open(`/dashboard/arquitecto/informes/${informeId}/imprimir`, "_blank")
    }
  }

  const clienteNombre = useMemo(() => {
    const cliente =
      informe?.cliente_nombre || informe?.cliente_apellido
        ? `${informe?.cliente_nombre ?? ""} ${informe?.cliente_apellido ?? ""}`.trim()
        : null
    if (cliente) return cliente
    if (informe?.cliente_id) return `ID ${informe.cliente_id}`
    return "No asignado"
  }, [informe])

  const canEdit = user?.rol === "gestor" || (user?.rol === "arquitecto" && approvalState !== "aprobado")
  const editTooltip = canEdit
    ? "Abrir editor"
    : approvalState === "aprobado"
      ? "Informe aprobado. Solicita al gestor cambios si es necesario."
      : "Solo disponible para roles autorizados."

  return (
    <DashboardLayout title={`Informe ${params?.id ? `INF-${params.id}` : ""}`} roleLabel="Arquitecto">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Resumen del informe</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  informe?.estado === "completo"
                    ? "default"
                    : informe?.estado === "en_progreso"
                      ? "secondary"
                      : "outline"
                }
              >
                {informe?.estado
                  ? informe.estado.charAt(0).toUpperCase() + informe.estado.slice(1)
                  : "Sin estado"}
              </Badge>
              {approvalState && (
                <Badge variant={INFORME_APPROVAL_BADGE[approvalState]}>
                  {INFORME_APPROVAL_LABELS[approvalState]}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Creado el{" "}
                {informe?.created_at ? new Date(informe.created_at).toLocaleDateString() : "sin fecha"}
              </span>
            </div>
            {approvalState === "rechazado" && (
              <p className="text-sm text-destructive mt-1">
                Este informe fue rechazado. Ajusta el contenido y vuelve a guardarlo para solicitar una nueva revisión.
              </p>
            )}
            {approvalState === "pendiente" && (
              <p className="text-xs text-muted-foreground mt-1">Pendiente de revisión por el gestor.</p>
            )}
            {approvalState === "aprobado" && (
              <p className="text-xs text-muted-foreground mt-1">Aprobado y visible para el cliente.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleVolver}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button variant="outline" onClick={handleImprimir}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="default"
              onClick={handleEditar}
              disabled={!canEdit}
              title={editTooltip}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
          <p className="w-full text-xs text-muted-foreground">
            La edición abre el flujo disponible en el panel del gestor.
            {user?.rol === "arquitecto" && approvalState === "aprobado"
              ? " Solicita al gestor desbloquear el informe si necesitas hacer cambios tras la aprobación."
              : user?.rol === "arquitecto"
                ? " Si realizas modificaciones, guarda el informe para que el gestor vuelva a revisarlo."
                : ""}
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">Cargando informe...</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-16 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Datos principales</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Dirección</p>
                  <p className="text-sm font-medium text-foreground">
                    {inmueble?.direccion || "Sin dirección registrada"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium text-foreground">{clienteNombre}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ref. Catastral</p>
                  <p className="text-sm font-medium text-foreground">
                    {inmueble?.ref_catastral || "No especificada"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Inspector</p>
                  <p className="text-sm font-medium text-foreground">
                    {inspector?.nombre || inspector?.apellido
                      ? `${inspector?.nombre ?? ""} ${inspector?.apellido ?? ""}`.trim()
                      : "Sin inspector"}
                  </p>
                </div>
                {informe?.resumen_ejecutivo_texto && (
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Resumen ejecutivo
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {informe.resumen_ejecutivo_texto}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <KeyValueSection title="Información del inmueble" data={inmueble} />
            <KeyValueSection title="Servicios" data={data?.servicios} />
            <KeyValueSection title="Condiciones de inspección" data={data?.condiciones} />
            <KeyValueSection title="Información general" data={data?.informacion_general} />
            <KeyValueSection title="Estructura" data={data?.estructura} />
            <KeyValueSection title="Instalaciones" data={data?.instalaciones} />
            <KeyValueSection title="Jardín y exteriores" data={data?.jardin} />
            <KeyValueSection title="Eficiencia energética" data={data?.eficiencia} />
            <KeyValueSection title="Siguientes pasos" data={data?.siguientes_pasos} />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
