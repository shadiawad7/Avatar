"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Edit, Save, X } from "lucide-react"
import Image from "next/image"
import { PhotoUploader } from "@/components/photo-uploader"

/* -------------------- NORMALIZACIÓN -------------------- */
function normalizeInforme(data: any) {
  if (!data || typeof data !== "object") return {}

  const estructura = {
    vertical: data.estructura_vertical ?? data.estructura?.vertical ?? null,
    horizontal: data.estructura_horizontal ?? data.estructura?.horizontal ?? null,
    forjados: data.forjados ?? data.estructura?.forjados ?? null,
    soleras_losas: data.soleras_losas ?? data.estructura?.soleras_losas ?? null,
    voladizos: data.voladizos ?? data.estructura?.voladizos ?? null,
    cubiertas: data.cubiertas ?? data.estructura?.cubiertas ?? null,
    carpinterias: data.carpinterias ?? data.estructura?.carpinterias ?? null,
  }

  const instalaciones = {
    electrica: data.instalacion_electrica ?? data.instalaciones?.electrica ?? null,
    agua_acs: data.instalacion_agua_acs ?? data.instalaciones?.agua_acs ?? null,
    calefaccion: data.calefaccion ?? data.instalaciones?.calefaccion ?? null,
    climatizacion: data.climatizacion ?? data.instalaciones?.climatizacion ?? null,
  }

  return {
    informe: data.informe ?? data.informes ?? {},
    inmueble: data.inmueble ?? data.inmuebles ?? {},
    inspector: data.inspector ?? data.inspectores ?? {},
    servicios: data.servicios ?? data.servicios_inmueble ?? {},
    condiciones: data.condiciones ?? data.condiciones_inspeccion ?? {},

    informacion_general: data.informacion_general ?? {},
    estructura,
    instalaciones,

    jardin: data.jardin ?? {},

    estancias_salon: data.estancias_salon ?? null,
    estancias_cocina: data.estancias_cocina ?? null,
    estancias_dormitorio: data.estancias_dormitorio ?? null,
    estancias_bano: data.estancias_bano ?? null,
    estancias_terraza: data.estancias_terraza ?? null,
    estancias_garaje: data.estancias_garaje ?? null,
    estancias_sotano: data.estancias_sotano ?? null,


    eficiencia: data.eficiencia ?? {},
    siguientes_pasos: data.siguientes_pasos ?? {},
  }
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

function normalizeApprovalState(value: unknown): InformeApprovalState | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toLowerCase()
  return (["pendiente", "aprobado", "rechazado"] as const).includes(normalized as InformeApprovalState)
    ? (normalized as InformeApprovalState)
    : null
}

/* -------------------- PAGE -------------------- */

export default function InformeDetallePage() {
  const router = useRouter()
  const params = useParams()
  const [informe, setInforme] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!params?.id || isNaN(Number(params.id))) {
      notFound()
      return
    }

    const fetchInforme = async () => {
      try {
        const response = await fetch(`/api/informes/${params.id}`)
        if (!response.ok) return notFound()
        const raw = await response.json()
        const norm = normalizeInforme(raw)
        setInforme(norm)
        setEditedData(JSON.parse(JSON.stringify(norm)))
      } catch (error) {
        console.error("[detalle] Error al cargar informe:", error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchInforme()
  }, [params?.id])

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(JSON.parse(JSON.stringify(informe)))
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedData(JSON.parse(JSON.stringify(informe)))
  }

  // --- helpers en tu page.tsx ---
function pruneUndefined<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj
  if (Array.isArray(obj)) return obj.map(pruneUndefined) as any
  const out: any = {}
  for (const k of Object.keys(obj as any)) {
    const v: any = (obj as any)[k]
    if (v === undefined) continue
    if (v && typeof v === "object") {
      const child = pruneUndefined(v)
      if (child !== undefined) out[k] = child
    } else {
      out[k] = v
    }
  }
  return out
}

function normalizeForApi(fd: any) {
  const out = {
    // acepta singular o plural
    inmueble: fd.inmueble ?? fd.inmuebles,
    informe: fd.informe ?? fd.informes,
    inspector: fd.inspector ?? fd.inspectores,
    servicios: fd.servicios ?? fd.servicios_inmueble,
    condiciones_inspeccion: fd.condiciones ?? fd.condiciones_inspeccion,
    informacion_general: fd.informacion_general ?? undefined,

    // ya trabajas con objeto anidado en la UI, envíalo tal cual
    estructura: fd.estructura ?? undefined,
    instalaciones: fd.instalaciones ?? undefined,

    // estancias
    estancias_salon: fd.estancias_salon,
    estancias_cocina: fd.estancias_cocina,
    estancias_dormitorio: fd.estancias_dormitorio,
    estancias_bano: fd.estancias_bano,
    estancias_terraza: fd.estancias_terraza,
    estancias_garaje: fd.estancias_garaje,
    estancias_sotano: fd.estancias_sotano,

    jardin: fd.jardin,
    eficiencia: fd.eficiencia,
    siguientes_pasos: fd.siguientes_pasos,
  }
  return pruneUndefined(out)
}



const handleSave = async () => {
  setSaving(true)
  try {
    // normaliza el objeto que estás editando (singular/plural)
    const payload = normalizeForApi(editedData)

    await fetch(`/api/informes/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch((e) => {
      console.warn("[edit] fetch falló, seguimos a recargar:", e)
      return null as any
    })
  } catch (e) {
    console.warn("[edit] Error no bloqueante al guardar:", e)
  } finally {
    setSaving(false)
    // Fuerza ver lo actualizado
    window.location.href = `/dashboard/gestor/informes/${params.id}`
  }
}


  const updateField = (section: string, field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [section]: { ...(prev?.[section] || {}), [field]: value },
    }))
  }

  const updateNestedField = (section: string, subsection: string, field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev?.[section] || {}),
        [subsection]: { ...(prev?.[section]?.[subsection] || {}), [field]: value },
      },
    }))
  }

  const renderField = (
    label: string,
    value: any,
    section?: string,
    field?: string,
    type: "text" | "number" | "date" | "textarea" | "boolean" = "text",
    nested?: { subsection: string }
  ) => {
    if (!isEditing) {
      if (value === null || value === undefined || value === "") return null
      if (typeof value === "boolean") {
        return (
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value ? "Sí" : "No"}</p>
          </div>
        )
      }
      let displayValue = value
      if (typeof value === "number") displayValue = value.toLocaleString()
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const d = new Date(value)
        if (!isNaN(d.getTime())) displayValue = d.toLocaleDateString()
      }
      return (
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-medium">{displayValue}</p>
        </div>
      )
    }

    // Modo editar
    if (!section || !field) return null
    const currentValue = nested
      ? editedData?.[section]?.[nested.subsection]?.[field]
      : editedData?.[section]?.[field]

    if (type === "boolean") {
      return (
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <Select
            value={(currentValue ?? false).toString()}
            onValueChange={(v) =>
              nested
                ? updateNestedField(section, nested.subsection, field, v === "true")
                : updateField(section, field, v === "true")
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sí</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (type === "textarea") {
      return (
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <Textarea
            rows={3}
            value={currentValue || ""}
            onChange={(e) =>
              nested
                ? updateNestedField(section, nested.subsection, field, e.target.value)
                : updateField(section, field, e.target.value)
            }
          />
        </div>
      )
    }

    if (type === "number") {
      return (
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <Input
            type="number"
            value={currentValue ?? ""}
            onChange={(e) =>
              nested
                ? updateNestedField(
                    section,
                    nested.subsection,
                    field,
                    e.target.value !== "" ? Number(e.target.value) : null
                  )
                : updateField(section, field, e.target.value !== "" ? Number(e.target.value) : null)
            }
          />
        </div>
      )
    }

    // text | date
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <Input
          type={type === "date" ? "date" : "text"}
          value={currentValue || ""}
          onChange={(e) =>
            nested
              ? updateNestedField(section, nested.subsection, field, e.target.value)
              : updateField(section, field, e.target.value)
          }
        />
      </div>
    )
  }

  const renderPhotos = (photos: string[] | null | undefined, title = "Fotografías", section?: string, subsection?: string) => {
    const currentPhotos =
      isEditing && section
        ? (subsection ? editedData?.[section]?.[subsection]?.fotos : editedData?.[section]?.fotos)
        : photos

    if (!isEditing && (!currentPhotos || currentPhotos.length === 0)) return null

    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-3">{title}</h4>
        {isEditing && section ? (
          <PhotoUploader
            label={title}
            photos={currentPhotos || []}
            onChange={(urls) => {
              if (subsection) {
                updateNestedField(section, subsection, "fotos", urls)
              } else {
                updateField(section, "fotos", urls)
              }
            }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {currentPhotos?.map((photo: string, index: number) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={photo || "/placeholder.svg"}
                  alt={`Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." roleLabel="Gestor">
        <div className="text-center py-12">Cargando informe...</div>
      </DashboardLayout>
    )
  }

  if (!informe) {
    return (
      <DashboardLayout title="Error" roleLabel="Gestor">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No se pudo cargar el informe</p>
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </DashboardLayout>
    )
  }

  const displayData = isEditing ? editedData : informe
  const approvalState = normalizeApprovalState(displayData.informe?.estado_aprobacion)

  return (
    <DashboardLayout title={`Informe INF-${params.id}`} roleLabel="Gestor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Información del Informe */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información del Informe</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {!!displayData.informe?.estado && (
                    <Badge
                      variant={
                        displayData.informe.estado === "completo"
                          ? "default"
                          : displayData.informe.estado === "en_progreso"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {displayData.informe.estado}
                    </Badge>
                  )}
                  {approvalState && (
                    <Badge variant={INFORME_APPROVAL_BADGE[approvalState]}>
                      {INFORME_APPROVAL_LABELS[approvalState]}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {renderField("ID", displayData.informe.id ? `INF-${displayData.informe.id}` : "")}
                {renderField("Fecha Creación", displayData.informe.created_at)}
                {renderField("Última Actualización", displayData.informe.updated_at)}
                {renderField(
                  "Coste Estimado Reparación (€)",
                  displayData.informe.coste_estimado_reparacion,
                  "informe",
                  "coste_estimado_reparacion",
                  "number",
                )}
                {renderField(
                  "Resumen Ejecutivo",
                  displayData.informe.resumen_ejecutivo_texto,
                  "informe",
                  "resumen_ejecutivo_texto",
                  "textarea",
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inmueble */}
          {displayData.inmueble && (
            <Card>
              <CardHeader><CardTitle>Datos del Inmueble</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Dirección", displayData.inmueble.direccion, "inmueble", "direccion")}
                  {renderField("Referencia Catastral", displayData.inmueble.ref_catastral, "inmueble", "ref_catastral")}
                  {renderField("Año Construcción", displayData.inmueble.anno_construccion, "inmueble", "anno_construccion", "number")}
                  {renderField("Metros Cuadrados", displayData.inmueble.metros_cuadrados, "inmueble", "metros_cuadrados", "number")}
                  {renderField("Orientación", displayData.inmueble.orientacion, "inmueble", "orientacion")}
                  {renderField("Parcela", displayData.inmueble.parcela, "inmueble", "parcela")}
                  {renderField("Tipo Propiedad", displayData.inmueble.tipo_propiedad, "inmueble", "tipo_propiedad")}
                  {renderField("Planta", displayData.inmueble.planta, "inmueble", "planta")}
                  {renderField("Ampliado/Reformado", displayData.inmueble.ampliado_reformado, "inmueble", "ampliado_reformado", "boolean")}
                  {renderField("Cambio de Uso", displayData.inmueble.cambio_uso, "inmueble", "cambio_uso", "boolean")}
                  {renderField("Ventilación Cruzada", displayData.inmueble.ventilacion_cruzada, "inmueble", "ventilacion_cruzada")}
                  {renderField("Ventilación General", displayData.inmueble.ventilacion_general, "inmueble", "ventilacion_general")}
                  {renderField("Iluminación", displayData.inmueble.iluminacion, "inmueble", "iluminacion")}
                </div>
                {renderPhotos(displayData.inmueble.fotos, "Fotografías (Inmueble)", "inmueble")}
              </CardContent>
            </Card>
          )}

          {/* Inspector */}
          {displayData.inspector && (
            <Card>
              <CardHeader><CardTitle>Datos del Inspector</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Nombre", displayData.inspector.nombre, "inspector", "nombre")}
                  {renderField("Apellido", displayData.inspector.apellido, "inspector", "apellido")}
                  {renderField("Número Colegiado", displayData.inspector.num_colegiado ?? displayData.inspector.numero_colegiado, "inspector", "num_colegiado")}
                  {renderField("Fecha Inspección", displayData.inspector.fecha_inspeccion, "inspector", "fecha_inspeccion", "date")}
                  {renderField("Titulación", displayData.inspector.titulacion, "inspector", "titulacion")}
                  {renderField("Contacto", displayData.inspector.contacto, "inspector", "contacto")}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Servicios */}
          {displayData.servicios && (
            <Card>
              <CardHeader><CardTitle>Servicios del Inmueble</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Agua", displayData.servicios.agua, "servicios", "agua", "boolean")}
                  {renderField("Electricidad", displayData.servicios.electricidad, "servicios", "electricidad", "boolean")}
                  {renderField("Gas", displayData.servicios.gas, "servicios", "gas", "boolean")}
                  {renderField("Gasoil", displayData.servicios.gasoil, "servicios", "gasoil", "boolean")}
                  {renderField("Internet", displayData.servicios.internet, "servicios", "internet", "boolean")}
                  {renderField("Energías Renovables", displayData.servicios.renovables, "servicios", "renovables", "boolean")}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Condiciones de Inspección */}
          {displayData.condiciones && (
            <Card>
              <CardHeader><CardTitle>Condiciones de Inspección</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Tiempo Atmosférico", displayData.condiciones.tiempo_atmosferico, "condiciones", "tiempo_atmosferico")}
                  {renderField("Temperatura Ambiente", displayData.condiciones.temp_ambiente, "condiciones", "temp_ambiente")}
                  {renderField("Lluvia últimos 3 días", displayData.condiciones.lluvia_ultimos_3d, "condiciones", "lluvia_ultimos_3d", "boolean")}
                  {renderField("Zona Ruidosa", displayData.condiciones.zona_ruidosa, "condiciones", "zona_ruidosa", "boolean")}
                  {renderField("Tráfico", displayData.condiciones.trafico, "condiciones", "trafico")}
                  {renderField("Superficie Exterior", displayData.condiciones.sup_exterior, "condiciones", "sup_exterior")}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información General */}
          {displayData.informacion_general && (
            <Card>
              <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Descripción General", displayData.informacion_general.descripcion_general_texto, "informacion_general", "descripcion_general_texto", "textarea")}
                  {renderField("Estado Fachadas", displayData.informacion_general.fachadas_estado, "informacion_general", "fachadas_estado")}
                  {renderField("Puerta Entrada", displayData.informacion_general.puerta_entrada_estado, "informacion_general", "puerta_entrada_estado")}
                  {renderField("Vestíbulo", displayData.informacion_general.vestibulo_estado, "informacion_general", "vestibulo_estado")}
                  {renderField("Ascensor", displayData.informacion_general.ascensor_estado, "informacion_general", "ascensor_estado")}
                  {renderField("Posibilidad Ascensor", displayData.informacion_general.posib_ascensor, "informacion_general", "posib_ascensor", "boolean")}
                  {renderField("Patio de Luces", displayData.informacion_general.patio_luces_estado, "informacion_general", "patio_luces_estado")}
                  {renderField("Patio Ventilación", displayData.informacion_general.patio_ventilacion_estado, "informacion_general", "patio_ventilacion_estado")}
                  {renderField("Jardines", displayData.informacion_general.jardines_estado, "informacion_general", "jardines_estado")}
                </div>
                {renderPhotos(displayData.informacion_general.fotos, "Fotografías (Información General)", "informacion_general")}
              </CardContent>
            </Card>
          )}

          {/* Estructura Vertical */}
          {displayData.estructura?.vertical && (
            <Card>
              <CardHeader><CardTitle>Estructura Vertical</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Tipo de Estructura Vertical", displayData.estructura.vertical.tipo_estructura_vertical, "estructura", "tipo_estructura_vertical", "text", { subsection: "vertical" })}
                  {renderField("Tipo de Muros de Carga", displayData.estructura.vertical.tipo_muros_carga, "estructura", "tipo_muros_carga", "text", { subsection: "vertical" })}
                  {renderField("Patologías", displayData.estructura.vertical.patologias_estructura_vertical, "estructura", "patologias_estructura_vertical", "textarea", { subsection: "vertical" })}
                </div>
                {renderPhotos(displayData.estructura.vertical.fotos, "Fotografías (Estructura Vertical)", "estructura", "vertical")}
              </CardContent>
            </Card>
          )}

          {/* Estructura Horizontal */}
          {displayData.estructura?.horizontal && (
            <Card>
              <CardHeader><CardTitle>Estructura Horizontal</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Tipo de Vigas", displayData.estructura.horizontal.tipo_vigas, "estructura", "tipo_vigas", "text", { subsection: "horizontal" })}
                  {renderField("Patologías en Vigas", displayData.estructura.horizontal.patologias_vigas, "estructura", "patologias_vigas", "textarea", { subsection: "horizontal" })}
                  {renderField("Tipo de Viguetas", displayData.estructura.horizontal.tipo_viguetas, "estructura", "tipo_viguetas", "text", { subsection: "horizontal" })}
                  {renderField("Patologías en Viguetas", displayData.estructura.horizontal.patologias_viguetas, "estructura", "patologias_viguetas", "textarea", { subsection: "horizontal" })}
                </div>
                {renderPhotos(displayData.estructura.horizontal.fotos, "Fotografías (Estructura Horizontal)", "estructura", "horizontal")}
              </CardContent>
            </Card>
          )}

          {/* Forjados */}
          {displayData.estructura?.forjados && (
            <Card>
              <CardHeader><CardTitle>Forjados</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Tiene Desniveles", displayData.estructura.forjados.tiene_desniveles, "estructura", "tiene_desniveles", "boolean", { subsection: "forjados" })}
                  {renderField("Patologías en Forjados", displayData.estructura.forjados.patologias_forjados, "estructura", "patologias_forjados", "textarea", { subsection: "forjados" })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Soleras y Losas */}
          {displayData.estructura?.soleras_losas && (
            <Card>
              <CardHeader><CardTitle>Soleras y Losas</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Tiene Soleras", displayData.estructura.soleras_losas.tiene_soleras, "estructura", "tiene_soleras", "boolean", { subsection: "soleras_losas" })}
                  {renderField("Capilaridades", displayData.estructura.soleras_losas.tiene_capilaridades, "estructura", "tiene_capilaridades", "boolean", { subsection: "soleras_losas" })}
                  {renderField("Desniveles", displayData.estructura.soleras_losas.desniveles, "estructura", "desniveles", "boolean", { subsection: "soleras_losas" })}
                  {renderField("Patologías", displayData.estructura.soleras_losas.patologias_soleras_losas, "estructura", "patologias_soleras_losas", "textarea", { subsection: "soleras_losas" })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voladizos */}
          {displayData.estructura?.voladizos && (
            <Card>
              <CardHeader><CardTitle>Voladizos</CardTitle></CardHeader>
              <CardContent>
                {renderField("Patologías en Voladizos", displayData.estructura.voladizos.patologias_voladizos, "estructura", "patologias_voladizos", "textarea", { subsection: "voladizos" })}
              </CardContent>
            </Card>
          )}

          {/* Cubiertas */}
          {displayData.estructura?.cubiertas && (
            <Card>
              <CardHeader><CardTitle>Cubiertas</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Tipo de Cubierta", displayData.estructura.cubiertas.tipo_cubierta, "estructura", "tipo_cubierta", "text", { subsection: "cubiertas" })}
                  {renderField("Subtipo", displayData.estructura.cubiertas.subtipo, "estructura", "subtipo", "text", { subsection: "cubiertas" })}
                  {renderField("Acabado", displayData.estructura.cubiertas.acabado, "estructura", "acabado", "text", { subsection: "cubiertas" })}
                  {renderField("Cubierta Ventilada", displayData.estructura.cubiertas.cubierta_ventilada, "estructura", "cubierta_ventilada", "boolean", { subsection: "cubiertas" })}
                  {renderField("Tiene Aislamiento", displayData.estructura.cubiertas.tiene_aislamiento, "estructura", "tiene_aislamiento", "boolean", { subsection: "cubiertas" })}
                  {renderField("Estado del Aislamiento", displayData.estructura.cubiertas.aislamiento_estado_texto, "estructura", "aislamiento_estado_texto", "textarea", { subsection: "cubiertas" })}
                  {renderField("Impermeabilización", displayData.estructura.cubiertas.impermeabilizacion, "estructura", "impermeabilizacion", "boolean", { subsection: "cubiertas" })}
                  {renderField("Estado de Impermeabilización", displayData.estructura.cubiertas.impermeabilizacion_estado_texto, "estructura", "impermeabilizacion_estado_texto", "textarea", { subsection: "cubiertas" })}
                </div>
                {renderPhotos(displayData.estructura.cubiertas.fotos, "Fotografías (Cubiertas)", "estructura", "cubiertas")}
              </CardContent>
            </Card>
          )}

          {/* Carpinterías */}
          {displayData.estructura?.carpinterias && (
            <Card>
              <CardHeader><CardTitle>Carpinterías</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Material Carpintería", displayData.estructura.carpinterias.material_carpinteria, "estructura", "material_carpinteria", "text", { subsection: "carpinterias" })}
                  {renderField("Rotura Puente Térmico", displayData.estructura.carpinterias.rotura_puente_termico, "estructura", "rotura_puente_termico", "boolean", { subsection: "carpinterias" })}
                  {renderField("Cristales con Cámara (Estado)", displayData.estructura.carpinterias.cristales_con_camara_estado, "estructura", "cristales_con_camara_estado", "text", { subsection: "carpinterias" })}
                  {renderField("Aislamiento Térmico (Estado)", displayData.estructura.carpinterias.aislamiento_termico_ventanas_estado, "estructura", "aislamiento_termico_ventanas_estado", "text", { subsection: "carpinterias" })}
                  {renderField("Aislamiento Acústico (Estado)", displayData.estructura.carpinterias.aislamiento_acustico_ventanas_estado, "estructura", "aislamiento_acustico_ventanas_estado", "text", { subsection: "carpinterias" })}
                  {renderField("Sistema de Oscurecimiento", displayData.estructura.carpinterias.sistema_oscurecimiento, "estructura", "sistema_oscurecimiento", "text", { subsection: "carpinterias" })}
                  {renderField("Material Persianas", displayData.estructura.carpinterias.material_persianas, "estructura", "material_persianas", "text", { subsection: "carpinterias" })}
                  {renderField("Caja Persianas", displayData.estructura.carpinterias.caja_persianas, "estructura", "caja_persianas", "text", { subsection: "carpinterias" })}
                  {renderField("Recogida Persianas", displayData.estructura.carpinterias.recogida_persianas, "estructura", "recogida_persianas", "text", { subsection: "carpinterias" })}
                  {renderField("Tapa Cajón Persianas", displayData.estructura.carpinterias.tapa_cajon_persianas, "estructura", "tapa_cajon_persianas", "text", { subsection: "carpinterias" })}
                  {renderField("Puentes Térmicos en Persiana", displayData.estructura.carpinterias.puentes_termicos_persiana, "estructura", "puentes_termicos_persiana", "boolean", { subsection: "carpinterias" })}
                </div>
                {renderPhotos(displayData.estructura.carpinterias.fotos, "Fotografías (Carpinterías)", "estructura", "carpinterias")}
              </CardContent>
            </Card>
          )}

          {/* Instalación Eléctrica */}
          {displayData.instalaciones?.electrica && (
            <Card>
              <CardHeader><CardTitle>Instalación Eléctrica</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Tiene Instalación", displayData.instalaciones.electrica.tiene_instalacion, "instalaciones", "tiene_instalacion", "boolean", { subsection: "electrica" })}
                  {renderField("Cuadro en Norma", displayData.instalaciones.electrica.cuadro_en_norma, "instalaciones", "cuadro_en_norma", "boolean", { subsection: "electrica" })}
                  {renderField("Toma de Tierra", displayData.instalaciones.electrica.toma_tierra, "instalaciones", "toma_tierra", "boolean", { subsection: "electrica" })}
                  {renderField("Energías Renovables", displayData.instalaciones.electrica.energias_renovables, "instalaciones", "energias_renovables", "boolean", { subsection: "electrica" })}
                  {renderField("Canalizaciones", displayData.instalaciones.electrica.canalizaciones, "instalaciones", "canalizaciones", "text", { subsection: "electrica" })}
                  {renderField("Cableado Exterior", displayData.instalaciones.electrica.cableado_exterior, "instalaciones", "cableado_exterior", "text", { subsection: "electrica" })}
                  {renderField("Cableado Interior", displayData.instalaciones.electrica.cableado_interior, "instalaciones", "cableado_interior", "text", { subsection: "electrica" })}
                  {renderField("Estado Cajas Empalme", displayData.instalaciones.electrica.cajas_empalme_estado, "instalaciones", "cajas_empalme_estado", "text", { subsection: "electrica" })}
                  {renderField("Observaciones", displayData.instalaciones.electrica.observaciones_texto, "instalaciones", "observaciones_texto", "textarea", { subsection: "electrica" })}
                </div>
                {renderPhotos(displayData.instalaciones.electrica.fotos, "Fotografías (Instalación Eléctrica)", "instalaciones", "electrica")}
              </CardContent>
            </Card>
          )}

          {/* Instalación Agua y ACS */}
          {displayData.instalaciones?.agua_acs && (
            <Card>
              <CardHeader><CardTitle>Instalación de Agua y ACS</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Llave de Paso General", displayData.instalaciones.agua_acs.llave_paso_general, "instalaciones", "llave_paso_general", "boolean", { subsection: "agua_acs" })}
                  {renderField("Estado Llave de Paso", displayData.instalaciones.agua_acs.llave_paso_estado, "instalaciones", "llave_paso_estado", "text", { subsection: "agua_acs" })}
                  {renderField("Material de Tuberías", displayData.instalaciones.agua_acs.material_tuberias, "instalaciones", "material_tuberias", "text", { subsection: "agua_acs" })}
                  {renderField("Tuberías Empotradas", displayData.instalaciones.agua_acs.tuberias_empotradas, "instalaciones", "tuberias_empotradas", "boolean", { subsection: "agua_acs" })}
                  {renderField("Bajantes", displayData.instalaciones.agua_acs.bajantes, "instalaciones", "bajantes", "text", { subsection: "agua_acs" })}
                  {renderField("Arquetas", displayData.instalaciones.agua_acs.arquetas, "instalaciones", "arquetas", "text", { subsection: "agua_acs" })}
                  {renderField("Sistema en Normativa", displayData.instalaciones.agua_acs.sistema_normativa, "instalaciones", "sistema_normativa", "boolean", { subsection: "agua_acs" })}
                  {renderField("Dispone de ACS", displayData.instalaciones.agua_acs.dispone_acs, "instalaciones", "dispone_acs", "boolean", { subsection: "agua_acs" })}
                  {renderField("Tipo de ACS", displayData.instalaciones.agua_acs.tipo_acs, "instalaciones", "tipo_acs", "text", { subsection: "agua_acs" })}
                  {renderField("Extracción ACS", displayData.instalaciones.agua_acs.extraccion_acs, "instalaciones", "extraccion_acs", "text", { subsection: "agua_acs" })}
                  {renderField("Observaciones", displayData.instalaciones.agua_acs.observaciones_texto, "instalaciones", "observaciones_texto", "textarea", { subsection: "agua_acs" })}
                </div>
                {renderPhotos(displayData.instalaciones.agua_acs.fotos, "Fotografías (Agua y ACS)", "instalaciones", "agua_acs")}
              </CardContent>
            </Card>
          )}

          {/* Calefacción */}
          {displayData.instalaciones?.calefaccion && (
            <Card>
              <CardHeader><CardTitle>Calefacción</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {renderField("Dispone de Calefacción", displayData.instalaciones.calefaccion.dispone_calefaccion, "instalaciones", "dispone_calefaccion", "boolean", { subsection: "calefaccion" })}
                  {renderField("Tipo de Calefacción", displayData.instalaciones.calefaccion.tipo_calefaccion, "instalaciones", "tipo_calefaccion", "text", { subsection: "calefaccion" })}
                  {renderField("Tipo de Emisor", displayData.instalaciones.calefaccion.tipo_emisor, "instalaciones", "tipo_emisor", "text", { subsection: "calefaccion" })}
                  {renderField("Estado de la Caldera", displayData.instalaciones.calefaccion.estado_caldera, "instalaciones", "estado_caldera", "text", { subsection: "calefaccion" })}
                  {renderField("Tuberías de Calefacción", displayData.instalaciones.calefaccion.tuberias_calefaccion, "instalaciones", "tuberias_calefaccion", "text", { subsection: "calefaccion" })}
                  {renderField("Tuberías Empotradas", displayData.instalaciones.calefaccion.tuberias_empotradas, "instalaciones", "tuberias_empotradas", "boolean", { subsection: "calefaccion" })}
                  {renderField("Extracción", displayData.instalaciones.calefaccion.extraccion_calefaccion, "instalaciones", "extraccion_calefaccion", "text", { subsection: "calefaccion" })}
                  {renderField("Sistema en Normativa", displayData.instalaciones.calefaccion.sistema_normativa, "instalaciones", "sistema_normativa", "boolean", { subsection: "calefaccion" })}
                  {renderField("Observaciones", displayData.instalaciones.calefaccion.observaciones_texto, "instalaciones", "observaciones_texto", "textarea", { subsection: "calefaccion" })}
                </div>
                {renderPhotos(displayData.instalaciones.calefaccion.fotos, "Fotografías (Calefacción)", "instalaciones", "calefaccion")}
              </CardContent>
            </Card>
          )}

          {/* Climatización */}
          {displayData.instalaciones?.climatizacion && (
            <Card>
              <CardHeader><CardTitle>Climatización</CardTitle></CardHeader>
              <CardContent>
                {renderField("Dispone de Climatización", displayData.instalaciones.climatizacion.dispone_climatizacion, "instalaciones", "dispone_climatizacion", "boolean", { subsection: "climatizacion" })}
              </CardContent>
            </Card>
          )}

          {/* Jardín */}
          {displayData.jardin && (
            <Card>
              <CardHeader><CardTitle>Jardín y Exteriores</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {renderField("Descripción Corta", displayData.jardin.descripcion_corta, "jardin", "descripcion_corta")}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["cesped","Césped"],
                      ["arboles","Árboles"],
                      ["zona_pavimentada","Zona Pavimentada"],
                      ["tarimas_madera","Tarimas de Madera"],
                      ["piscina","Piscina"],
                      ["zona_barbacoa","Zona de Barbacoa"],
                      ["pergola_porche","Pérgola/Porche"],
                      ["valla_perimetral","Valla Perimetral"],
                      ["puerta_parcela","Puerta de Parcela"],
                      ["iluminacion_exterior","Iluminación Exterior"],
                      ["riego_automatico","Riego Automático"],
                      ["deposito_agua","Depósito de Agua"],
                      ["pozo","Pozo"],
                      ["zona_ducha","Zona de Ducha"],
                      ["banos_exteriores","Baños Exteriores"],
                      ["camaras_seguridad","Cámaras de Seguridad"],
                    ].map(([key, lab]) => (
                      <div key={key}>
                        {renderField(lab, (displayData.jardin as any)?.[key], "jardin", key)}
                      </div>
                    ))}
                  </div>
                  {renderField("Fachada", displayData.jardin.fachada_texto, "jardin", "fachada_texto", "textarea")}
                  {renderField("Observaciones", displayData.jardin.observaciones_texto, "jardin", "observaciones_texto", "textarea")}
                </div>
                {renderPhotos(displayData.jardin.fotos, "Fotografías (Jardín)", "jardin")}
              </CardContent>
            </Card>
          )}

          {/* estanciass específicas */}
          {displayData.estancias_salon && (
            <Card>
              <CardHeader><CardTitle>estancias — Salón</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Estado General", displayData.estancias_salon.estado_general, "estancias_salon", "estado_general")}
                  {renderField("Pavimento", displayData.estancias_salon.pavimento, "estancias_salon", "pavimento")}
                  {renderField("Paredes y Techos", displayData.estancias_salon.paredes_techos, "estancias_salon", "paredes_techos")}
                  {renderField("Ventanas / Carpintería", displayData.estancias_salon.ventanas_carpinteria, "estancias_salon", "ventanas_carpinteria")}
                  {renderField("Ventilación Natural", displayData.estancias_salon.ventilacion_natural, "estancias_salon", "ventilacion_natural", "boolean")}
                  {renderField("Iluminación Natural", displayData.estancias_salon.iluminacion_natural, "estancias_salon", "iluminacion_natural", "boolean")}
                  {renderField("Observaciones", displayData.estancias_salon.observaciones_texto, "estancias_salon", "observaciones_texto", "textarea")}
                </div>
              </CardContent>
            </Card>
          )}

          {displayData.estancias_cocina && (
            <Card>
              <CardHeader><CardTitle>estancias — Cocina</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Estado General", displayData.estancias_cocina.estado_general, "estancias_cocina", "estado_general")}
                  {renderField("Encimera y Mobiliario", displayData.estancias_cocina.encimera_mobiliario, "estancias_cocina", "encimera_mobiliario")}
                  {renderField("Campana Extractora", displayData.estancias_cocina.campana_extractora, "estancias_cocina", "campana_extractora")}
                  {renderField("Instalación Eléctrica Adecuada", displayData.estancias_cocina.elec_adecuada, "estancias_cocina", "elec_adecuada", "boolean")}
                  {renderField("Salida de Humos", displayData.estancias_cocina.salida_humos, "estancias_cocina", "salida_humos", "boolean")}
                  {renderField("Ventilación Natural", displayData.estancias_cocina.ventilacion_natural, "estancias_cocina", "ventilacion_natural", "boolean")}
                  {renderField("Grifería / Fregadero", displayData.estancias_cocina.griferia_fregadero, "estancias_cocina", "griferia_fregadero")}
                  {renderField("Revestimientos", displayData.estancias_cocina.revestimientos, "estancias_cocina", "revestimientos")}
                  {renderField("Observaciones", displayData.estancias_cocina.observaciones_texto, "estancias_cocina", "observaciones_texto", "textarea")}
                </div>
              </CardContent>
            </Card>
          )}

          {displayData.estancias_dormitorio && (
            <Card>
              <CardHeader><CardTitle>estancias — Dormitorio</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Estado General", displayData.estancias_dormitorio.estado_general, "estancias_dormitorio", "estado_general")}
                  {renderField("Pavimento", displayData.estancias_dormitorio.pavimento, "estancias_dormitorio", "pavimento")}
                  {renderField("Paredes y Techos", displayData.estancias_dormitorio.paredes_techos, "estancias_dormitorio", "paredes_techos")}
                  {renderField("Ventanas / Aislamiento", displayData.estancias_dormitorio.ventanas_aislamiento, "estancias_dormitorio", "ventanas_aislamiento")}
                  {renderField("Ventilación Natural", displayData.estancias_dormitorio.ventilacion_natural, "estancias_dormitorio", "ventilacion_natural", "boolean")}
                  {renderField("Iluminación Natural", displayData.estancias_dormitorio.iluminacion_natural, "estancias_dormitorio", "iluminacion_natural", "boolean")}
                  {renderField("Humedades", displayData.estancias_dormitorio.humedades, "estancias_dormitorio", "humedades", "boolean")}
                  {renderField("Observaciones", displayData.estancias_dormitorio.observaciones_texto, "estancias_dormitorio", "observaciones_texto", "textarea")}
                </div>
              </CardContent>
            </Card>
          )}

          {displayData.estancias_bano && (
            <Card>
              <CardHeader><CardTitle>estancias — Baño</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Estado General", displayData.estancias_bano.estado_general, "estancias_bano", "estado_general")}
                  {renderField("Revestimientos", displayData.estancias_bano.revestimientos, "estancias_bano", "revestimientos")}
                  {renderField("Fontanería y Sanitarios", displayData.estancias_bano.fontaneria_sanitarios, "estancias_bano", "fontaneria_sanitarios")}
                  {renderField("Ventilación", displayData.estancias_bano.ventilacion, "estancias_bano", "ventilacion")}
                  {renderField("Humedades / Filtraciones", displayData.estancias_bano.humedades_filtraciones, "estancias_bano", "humedades_filtraciones", "boolean")}
                  {renderField("Instalación Eléctrica Adecuada", displayData.estancias_bano.elec_adecuada, "estancias_bano", "elec_adecuada", "boolean")}
                  {renderField("Observaciones", displayData.estancias_bano.observaciones_texto, "estancias_bano", "observaciones_texto", "textarea")}
                </div>
              </CardContent>
            </Card>
          )}

          {displayData.estancias_terraza && (
            <Card>
              <CardHeader><CardTitle>estancias — Terraza</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Tipo de Terraza", displayData.estancias_terraza.tipo_terraza, "estancias_terraza", "tipo_terraza")}
                  {renderField("Pavimento Exterior", displayData.estancias_terraza.pavimento_exterior, "estancias_terraza", "pavimento_exterior")}
                  {renderField("Barandilla (Estado)", displayData.estancias_terraza.barandilla_estado, "estancias_terraza", "barandilla_estado")}
                  {renderField("Impermeabilización", displayData.estancias_terraza.impermeabilizacion, "estancias_terraza", "impermeabilizacion", "boolean")}
                  {renderField("Grietas / Fisuras", displayData.estancias_terraza.grietas_fisuras, "estancias_terraza", "grietas_fisuras", "boolean")}
                  {renderField("Observaciones", displayData.estancias_terraza.observaciones_texto, "estancias_terraza", "observaciones_texto", "textarea")}
                </div>
              </CardContent>
            </Card>
          )}

          {displayData.estancias_garaje && (
            <Card>
              <CardHeader><CardTitle>estancias — Garaje</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Estado General", displayData.estancias_garaje.estado_general, "estancias_garaje", "estado_general")}
                  {renderField("Pavimento", displayData.estancias_garaje.pavimento, "estancias_garaje", "pavimento")}
                  {renderField("Paredes y Techos", displayData.estancias_garaje.paredes_techos, "estancias_garaje", "paredes_techos")}
                  {renderField("Ventilación", displayData.estancias_garaje.ventilacion, "estancias_garaje", "ventilacion", "boolean")}
                  {renderField("Iluminación", displayData.estancias_garaje.iluminacion, "estancias_garaje", "iluminacion", "boolean")}
                  {renderField("Modo de Puerta", displayData.estancias_garaje.puerta_modo, "estancias_garaje", "puerta_modo")}
                  {renderField("Filtraciones", displayData.estancias_garaje.filtraciones, "estancias_garaje", "filtraciones", "boolean")}
                  {renderField("Observaciones", displayData.estancias_garaje.observaciones_texto, "estancias_garaje", "observaciones_texto", "textarea")}
                </div>
              </CardContent>
            </Card>
          )}

          {displayData.estancias_sotano && (
            <Card>
              <CardHeader><CardTitle>estancias — Sótano</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderField("Estado General", displayData.estancias_sotano.estado_general, "estancias_sotano", "estado_general")}
                  {renderField("Humedad", displayData.estancias_sotano.humedad, "estancias_sotano", "humedad", "boolean")}
                  {renderField("Ventilación", displayData.estancias_sotano.ventilacion, "estancias_sotano", "ventilacion", "boolean")}
                  {renderField("Iluminación", displayData.estancias_sotano.iluminacion, "estancias_sotano", "iluminacion", "boolean")}
                  {renderField("Revestimientos", displayData.estancias_sotano.revestimientos, "estancias_sotano", "revestimientos")}
                  {renderField("Uso Actual", displayData.estancias_sotano.uso_actual, "estancias_sotano", "uso_actual")}
                  {renderField("Observaciones", displayData.estancias_sotano.observaciones_texto, "estancias_sotano", "observaciones_texto", "textarea")}
                </div>
              </CardContent>
            </Card>
          )}

          

          {/* Eficiencia */}
          {displayData.eficiencia && (
            <Card>
              <CardHeader>
                <CardTitle>Eficiencia Energética</CardTitle>
              </CardHeader>
              <CardContent>
                {renderField("Notas de Eficiencia", displayData.eficiencia.notas_texto, "eficiencia", "notas_texto", "textarea")}
                {renderField("Certificado Energético", displayData.eficiencia.certificado_energetico, "eficiencia", "certificado_energetico", "text")}
                {renderField("Calificación Energética", displayData.eficiencia.calificacion_energetica, "eficiencia", "calificacion_energetica", "text")}
                {renderField("Consumo Anual Estimado", displayData.eficiencia.consumo_anual_estimado, "eficiencia", "consumo_anual_estimado", "text")}
              </CardContent>
            </Card>
          )}


          {/* Siguientes Pasos */}
          {displayData.siguientes_pasos && (
            <Card>
              <CardHeader><CardTitle>Siguientes Pasos</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {renderField("Obtener Presupuestos", displayData.siguientes_pasos.obtener_presupuestos_texto, "siguientes_pasos", "obtener_presupuestos_texto", "textarea")}
                  {renderField("Estudios Complementarios", displayData.siguientes_pasos.estudios_complementarios_texto, "siguientes_pasos", "estudios_complementarios_texto", "textarea")}
                  {renderField("Descripción del Servicio", displayData.siguientes_pasos.descripcion_servicio_texto, "siguientes_pasos", "descripcion_servicio_texto", "textarea")}
                  {renderField("Consejos Antes de Comprar", displayData.siguientes_pasos.consejos_antes_comprar_texto, "siguientes_pasos", "consejos_antes_comprar_texto", "textarea")}
                  {renderField("Consejos de Mantenimiento", displayData.siguientes_pasos.consejos_mantenimiento_texto, "siguientes_pasos", "consejos_mantenimiento_texto", "textarea")}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </DashboardLayout>
  )
}
