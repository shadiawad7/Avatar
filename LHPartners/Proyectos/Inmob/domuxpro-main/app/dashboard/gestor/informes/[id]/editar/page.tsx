"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, ArrowRight, Upload, Trash2 } from "lucide-react"
import { useBrandToast } from "@/hooks/use-brand-toast"

type TipoInforme = "basico" | "tecnico" | "documental"

/* --------------------------- CONFIG --------------------------- */

// ✅ mismas secciones que en “nuevo informe”
const TABLAS_POR_TIPO: Record<TipoInforme, string[]> = {
  basico: [
    "inmuebles",
    "informes",
    "inspectores",
    "servicios_inmueble",
    "condiciones_inspeccion",
    "informacion_general",
  ],
  tecnico: [
    "inmuebles",
    "informes",
    "inspectores",
    "servicios_inmueble",
    "condiciones_inspeccion",
    "informacion_general",
    "estructura_vertical",
    "estructura_horizontal",
    "forjados",
    "soleras_losas",
    "voladizos",
    "cubiertas",
    "instalacion_electrica",
    "instalacion_agua_acs",
    "calefaccion",
    "climatizacion",
    "carpinterias",
    "jardin",
  ],
  documental: [
    "inmuebles",
    "informes",
    "inspectores",
    "servicios_inmueble",
    "condiciones_inspeccion",
    "informacion_general",
    "estructura_vertical",
    "estructura_horizontal",
    "forjados",
    "soleras_losas",
    "voladizos",
    "cubiertas",
    "instalacion_electrica",
    "instalacion_agua_acs",
    "calefaccion",
    "climatizacion",
    "carpinterias",
    "jardin",
    // estancias
    "estancia_salon",
    "estancia_cocina",
    "estancia_dormitorio",
    "estancia_bano",
    "estancia_terraza",
    "estancia_garaje",
    "estancia_sotano",
  
    // cierre
    "eficiencia",
    "siguientes_pasos",
  ],
}

/* --------------------------- HELPERS --------------------------- */

function toDateInput(value: any): string {
  if (!value) return ""
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
function coerceBool(v: any): boolean {
  return v === true || v === "true" || v === 1 || v === "1"
}

/* --------------------------- Uploader --------------------------- */

// Usa /api/upload que devuelve { urls: string[] }
function PhotoUploader({
  value,
  onChange,
  label = "Fotografías",
}: {
  value: string[] | undefined
  onChange: (urls: string[]) => void
  label?: string
}) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const brandToast = useBrandToast()

  const handleUpload = async () => {
    if (!files?.length) return
    setUploading(true)
    try {
      const form = new FormData()
      Array.from(files).forEach((f) => form.append("files", f))
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      })
      if (!res.ok) throw new Error("Error subiendo imágenes")
      const data = await res.json()
      const urls: string[] = data.urls || []
      onChange([...(value || []), ...urls])
      setFiles(null)
    } catch (e) {
      console.error("[edit] upload error:", e)
      brandToast.error("No se pudieron subir las imágenes. Inténtalo nuevamente.")
    } finally {
      setUploading(false)
    }
  }

  const removeUrl = (url: string) => onChange((value || []).filter((u) => u !== url))

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
        <Button type="button" variant="outline" onClick={handleUpload} disabled={uploading || !files?.length}>
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Subiendo..." : "Subir"}
        </Button>
      </div>

      {value && value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {value.map((url) => (
            <div key={url} className="relative border rounded-md p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="foto" className="w-full h-28 object-cover rounded" />
              <button
                type="button"
                className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded p-1 border"
                onClick={() => removeUrl(url)}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* --------------------------- PAGE --------------------------- */

export default function EditarInformePage() {
  const router = useRouter()
  const params = useParams() as any
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [tipoInforme, setTipoInforme] = useState<TipoInforme>("basico")
  const [pasoActual, setPasoActual] = useState(0)

  useEffect(() => {
    const fetchInforme = async () => {
      try {
        const response = await fetch(`/api/informes/${params.id}`, {
          cache: "no-store",
          credentials: "include",
        })
        if (!response.ok) throw new Error("No se pudo cargar el informe")
        const data = await response.json()

        // Detectar tipo por presencia de secciones "documental"
        const tipo = data.informe?.tipo_informe
          ? (data.informe.tipo_informe as TipoInforme)
          : detectarTipoInforme(data)
        setTipoInforme(tipo)

        const initial: Record<string, any> = {}

        // Inmuebles
        if (data.inmueble) {
          initial.inmuebles = {
            direccion: data.inmueble.direccion ?? "",
            ref_catastral: data.inmueble.ref_catastral ?? "",
            anno_construccion: data.inmueble.anno_construccion ?? null,
            metros_cuadrados: data.inmueble.metros_cuadrados ?? null,
            orientacion: data.inmueble.orientacion ?? "",
            parcela: data.inmueble.parcela ?? "",
            tipo_propiedad: data.inmueble.tipo_propiedad ?? "",
            planta: data.inmueble.planta ?? "",
            ampliado_reformado: coerceBool(data.inmueble.ampliado_reformado),
            cambio_uso: coerceBool(data.inmueble.cambio_uso),
            ventilacion_cruzada: data.inmueble.ventilacion_cruzada ?? "",
            ventilacion_general: data.inmueble.ventilacion_general ?? "",
            iluminacion: data.inmueble.iluminacion ?? "",
            fotos: data.inmueble.fotos ?? [],
          }
        }

        // Informes
        if (data.informe) {
          initial.informes = {
            resumen_ejecutivo_texto: data.informe.resumen_ejecutivo_texto ?? "",
            coste_estimado_reparacion: data.informe.coste_estimado_reparacion ?? null,
          }
        }

        // Inspectores
        if (data.inspector) {
          initial.inspectores = {
            nombre: data.inspector.nombre ?? "",
            apellido: data.inspector.apellido ?? "",
            contacto: data.inspector.contacto ?? "",
            num_colegiado: data.inspector.num_colegiado ?? data.inspector.numero_colegiado ?? "",
            titulacion: data.inspector.titulacion ?? "",
            fecha_inspeccion: toDateInput(data.inspector.fecha_inspeccion),
          }
        }

        // Servicios inmueble
        if (data.servicios) {
          initial.servicios_inmueble = {
            electricidad: coerceBool(data.servicios.electricidad),
            agua: coerceBool(data.servicios.agua),
            gas: coerceBool(data.servicios.gas),
            gasoil: coerceBool(data.servicios.gasoil),
            internet: coerceBool(data.servicios.internet),
            renovables: coerceBool(data.servicios.renovables),
          }
        }

        // Condiciones inspección
        if (data.condiciones) {
          initial.condiciones_inspeccion = {
            tiempo_atmosferico: data.condiciones.tiempo_atmosferico ?? "",
            temp_ambiente: data.condiciones.temp_ambiente ?? "",
            lluvia_ultimos_3d: coerceBool(data.condiciones.lluvia_ultimos_3d),
            zona_ruidosa: coerceBool(data.condiciones.zona_ruidosa),
            trafico: data.condiciones.trafico ?? "",
            sup_exterior: data.condiciones.sup_exterior ?? "",
          }
        }

        // Información general
        if (data.informacion_general) {
          initial.informacion_general = {
            descripcion_general_texto: data.informacion_general.descripcion_general_texto ?? "",
            fachadas_estado: data.informacion_general.fachadas_estado ?? "",
            puerta_entrada_estado: data.informacion_general.puerta_entrada_estado ?? "",
            vestibulo_estado: data.informacion_general.vestibulo_estado ?? "",
            ascensor_estado: data.informacion_general.ascensor_estado ?? "",
            posib_ascensor: coerceBool(data.informacion_general.posib_ascensor),
            patio_luces_estado: data.informacion_general.patio_luces_estado ?? "",
            patio_ventilacion_estado: data.informacion_general.patio_ventilacion_estado ?? "",
            jardines_estado: data.informacion_general.jardines_estado ?? "",
            fotos: data.informacion_general.fotos ?? [],
          }
        }

        // Estructuras
        if (data.estructura_vertical) {
          initial.estructura_vertical = {
            tipo_estructura_vertical: data.estructura_vertical.tipo_estructura_vertical ?? "",
            tipo_muros_carga: data.estructura_vertical.tipo_muros_carga ?? "",
            patologias_estructura_vertical: data.estructura_vertical.patologias_estructura_vertical ?? "",
            fotos: data.estructura_vertical.fotos ?? [],
          }
        }
        if (data.estructura_horizontal) {
          initial.estructura_horizontal = {
            tipo_vigas: data.estructura_horizontal.tipo_vigas ?? "",
            patologias_vigas: data.estructura_horizontal.patologias_vigas ?? "",
            tipo_viguetas: data.estructura_horizontal.tipo_viguetas ?? "",
            patologias_viguetas: data.estructura_horizontal.patologias_viguetas ?? "",
            fotos: data.estructura_horizontal.fotos ?? [],
          }
        }
        if (data.forjados) {
          initial.forjados = {
            patologias_forjados: data.forjados.patologias_forjados ?? "",
            tiene_desniveles: coerceBool(data.forjados.tiene_desniveles),
          }
        }
        if (data.soleras_losas) {
          initial.soleras_losas = {
            tiene_soleras: coerceBool(data.soleras_losas.tiene_soleras),
            patologias_soleras_losas: data.soleras_losas.patologias_soleras_losas ?? "",
            desniveles: coerceBool(data.soleras_losas.desniveles),
            tiene_capilaridades: coerceBool(data.soleras_losas.tiene_capilaridades),
          }
        }
        if (data.voladizos) {
          initial.voladizos = {
            patologias_voladizos: data.voladizos.patologias_voladizos ?? "",
          }
        }
        if (data.cubiertas) {
          initial.cubiertas = {
            tipo_cubierta: data.cubiertas.tipo_cubierta ?? "",
            subtipo: data.cubiertas.subtipo ?? "",
            acabado: data.cubiertas.acabado ?? "",
            cubierta_ventilada: coerceBool(data.cubiertas.cubierta_ventilada),
            tiene_aislamiento: coerceBool(data.cubiertas.tiene_aislamiento),
            aislamiento_estado_texto: data.cubiertas.aislamiento_estado_texto ?? "",
            impermeabilizacion: coerceBool(data.cubiertas.impermeabilizacion),
            impermeabilizacion_estado_texto: data.cubiertas.impermeabilizacion_estado_texto ?? "",
            fotos: data.cubiertas.fotos ?? [],
          }
        }

        // Instalaciones
        if (data.instalacion_electrica) {
          initial.instalacion_electrica = {
            tiene_instalacion: coerceBool(data.instalacion_electrica.tiene_instalacion),
            cuadro_en_norma: coerceBool(data.instalacion_electrica.cuadro_en_norma),
            toma_tierra: coerceBool(data.instalacion_electrica.toma_tierra),
            energias_renovables: coerceBool(data.instalacion_electrica.energias_renovables),
            cableado_interior: data.instalacion_electrica.cableado_interior ?? "",
            cableado_exterior: data.instalacion_electrica.cableado_exterior ?? "",
            canalizaciones: data.instalacion_electrica.canalizaciones ?? "",
            cajas_empalme_estado: data.instalacion_electrica.cajas_empalme_estado ?? "",
            observaciones_texto: data.instalacion_electrica.observaciones_texto ?? "",
            fotos: data.instalacion_electrica.fotos ?? [],
          }
        }
        if (data.instalacion_agua_acs) {
          initial.instalacion_agua_acs = {
            llave_paso_general: coerceBool(data.instalacion_agua_acs.llave_paso_general),
            llave_paso_estado: data.instalacion_agua_acs.llave_paso_estado ?? "",
            material_tuberias: data.instalacion_agua_acs.material_tuberias ?? "",
            tuberias_empotradas: coerceBool(data.instalacion_agua_acs.tuberias_empotradas),
            bajantes: data.instalacion_agua_acs.bajantes ?? "",
            arquetas: data.instalacion_agua_acs.arquetas ?? "",
            sistema_normativa: coerceBool(data.instalacion_agua_acs.sistema_normativa),
            dispone_acs: coerceBool(data.instalacion_agua_acs.dispone_acs),
            tipo_acs: data.instalacion_agua_acs.tipo_acs ?? "",
            extraccion_acs: data.instalacion_agua_acs.extraccion_acs ?? "",
            observaciones_texto: data.instalacion_agua_acs.observaciones_texto ?? "",
            fotos: data.instalacion_agua_acs.fotos ?? [],
          }
        }
        if (data.calefaccion) {
          initial.calefaccion = {
            dispone_calefaccion: coerceBool(data.calefaccion.dispone_calefaccion),
            tipo_calefaccion: data.calefaccion.tipo_calefaccion ?? "",
            tipo_emisor: data.calefaccion.tipo_emisor ?? "",
            estado_caldera: data.calefaccion.estado_caldera ?? "",
            tuberias_calefaccion: data.calefaccion.tuberias_calefaccion ?? "",
            tuberias_empotradas: coerceBool(data.calefaccion.tuberias_empotradas),
            extraccion_calefaccion: data.calefaccion.extraccion_calefaccion ?? "",
            sistema_normativa: coerceBool(data.calefaccion.sistema_normativa),
            observaciones_texto: data.calefaccion.observaciones_texto ?? "",
            fotos: data.calefaccion.fotos ?? [],
          }
        }
        if (data.climatizacion) {
          initial.climatizacion = {
            dispone_climatizacion: coerceBool(data.climatizacion.dispone_climatizacion),
          }
        }

        // Carpinterías
        if (data.carpinterias) {
          initial.carpinterias = {
            material_carpinteria: data.carpinterias.material_carpinteria ?? "",
            rotura_puente_termico: coerceBool(data.carpinterias.rotura_puente_termico),
            cristales_con_camara_estado: data.carpinterias.cristales_con_camara_estado ?? "",
            aislamiento_termico_ventanas_estado: data.carpinterias.aislamiento_termico_ventanas_estado ?? "",
            aislamiento_acustico_ventanas_estado: data.carpinterias.aislamiento_acustico_ventanas_estado ?? "",
            sistema_oscurecimiento: data.carpinterias.sistema_oscurecimiento ?? "",
            material_persianas: data.carpinterias.material_persianas ?? "",
            caja_persianas: data.carpinterias.caja_persianas ?? "",
            recogida_persianas: data.carpinterias.recogida_persianas ?? "",
            tapa_cajon_persianas: data.carpinterias.tapa_cajon_persianas ?? "",
            puentes_termicos_persiana: coerceBool(data.carpinterias.puentes_termicos_persiana),
            fotos: data.carpinterias.fotos ?? [],
          }
        }

        // Jardín
        if (data.jardin) {
          initial.jardin = {
            descripcion_corta: data.jardin.descripcion_corta ?? "",
            cesped: data.jardin.cesped ?? "",
            arboles: data.jardin.arboles ?? "",
            zona_pavimentada: data.jardin.zona_pavimentada ?? "",
            tarimas_madera: data.jardin.tarimas_madera ?? "",
            piscina: data.jardin.piscina ?? "",
            zona_barbacoa: data.jardin.zona_barbacoa ?? "",
            pergola_porche: data.jardin.pergola_porche ?? "",
            valla_perimetral: data.jardin.valla_perimetral ?? "",
            puerta_parcela: data.jardin.puerta_parcela ?? "",
            iluminacion_exterior: data.jardin.iluminacion_exterior ?? "",
            riego_automatico: data.jardin.riego_automatico ?? "",
            deposito_agua: data.jardin.deposito_agua ?? "",
            pozo: data.jardin.pozo ?? "",
            zona_ducha: data.jardin.zona_ducha ?? "",
            banos_exteriores: data.jardin.banos_exteriores ?? "",
            camaras_seguridad: data.jardin.camaras_seguridad ?? "",
            fachada_texto: data.jardin.fachada_texto ?? "",
            observaciones_texto: data.jardin.observaciones_texto ?? "",
            fotos: data.jardin.fotos ?? [],
          }
        }

        // Estancias (si tu API las devuelve con estas claves)
        if (data.estancia_salon)      initial.estancia_salon = { ...data.estancia_salon }
        if (data.estancia_cocina)     initial.estancia_cocina = { ...data.estancia_cocina }
        if (data.estancia_dormitorio) initial.estancia_dormitorio = { ...data.estancia_dormitorio }
        if (data.estancia_bano)       initial.estancia_bano = { ...data.estancia_bano }
        if (data.estancia_terraza)    initial.estancia_terraza = { ...data.estancia_terraza }
        if (data.estancia_garaje)     initial.estancia_garaje = { ...data.estancia_garaje }
        if (data.estancia_sotano)     initial.estancia_sotano = { ...data.estancia_sotano }

        

        // Documental
        if (data.eficiencia) {
          initial.eficiencia = {
            notas_texto: data.eficiencia.notas_texto ?? "",
            certificado_energetico: data.eficiencia.certificado_energetico ?? "",
            calificacion_energetica: data.eficiencia.calificacion_energetica ?? "",
            consumo_anual_estimado: data.eficiencia.consumo_anual_estimado ?? "",
          }
        }
        if (data.siguientes_pasos) {
          initial.siguientes_pasos = {
            consejos_antes_comprar_texto: data.siguientes_pasos.consejos_antes_comprar_texto ?? "",
            estudios_complementarios_texto: data.siguientes_pasos.estudios_complementarios_texto ?? "",
            obtener_presupuestos_texto: data.siguientes_pasos.obtener_presupuestos_texto ?? "",
            descripcion_servicio_texto: data.siguientes_pasos.descripcion_servicio_texto ?? "",
            consejos_mantenimiento_texto: data.siguientes_pasos.consejos_mantenimiento_texto ?? "",
          }
        }


        setFormData(initial)
      } catch (e) {
        console.error("[v0] Error al cargar informe:", e)
      } finally {
        setLoading(false)
      }
    }

    if (params?.id) fetchInforme()
  }, [params?.id])

  const detectarTipoInforme = (data: any): TipoInforme => {
    if (data.eficiencia || data.siguientes_pasos || data.estancia_salon) return "documental"
    if (
      data.estructura_vertical ||
      data.estructura_horizontal ||
      data.cubiertas ||
      data.instalacion_electrica ||
      data.instalacion_agua_acs ||
      data.calefaccion ||
      data.climatizacion ||
      data.carpinterias ||
      data.jardin
    )
      return "tecnico"
    return "basico"
  }

  const tablas = TABLAS_POR_TIPO[tipoInforme]
  const tablaActual = tablas[pasoActual]

  const next = () => pasoActual < tablas.length - 1 && setPasoActual((p) => p + 1)
  const prev = () => pasoActual > 0 && setPasoActual((p) => p - 1)

  const updateFormData = (tabla: string, data: any) =>
    setFormData((prev) => ({ ...prev, [tabla]: { ...(prev[tabla] || {}), ...data } }))

  const updateFotos = (tabla: string, urls: string[]) =>
    setFormData((prev) => ({ ...prev, [tabla]: { ...(prev[tabla] || {}), fotos: urls } }))

  function sanitizePayload(input: any) {
    // Normaliza valores: ""->null, "true"/"false"/"on"/"off"->boolean, "indeterminate"->false, "123"->number, etc.
    const walk = (v: any): any => {
      if (v === undefined) return undefined // luego lo eliminamos del objeto
      if (v === "indeterminate") return false
      if (v === "") return null

      if (typeof v === "string") {
        const s = v.trim().toLowerCase()
        if (s === "true" || s === "on") return true
        if (s === "false" || s === "off") return false
        if (/^-?\d+(\.\d+)?$/.test(s)) {
          const n = Number(v)
          if (!Number.isNaN(n)) return n
        }
        return v
      }

      if (typeof v === "number" || typeof v === "boolean" || v === null) return v

      if (Array.isArray(v)) return v.map(walk).filter((x) => x !== undefined)

      if (v && typeof v === "object") {
        const out: any = {}
        for (const k of Object.keys(v)) {
          const child = walk(v[k])
          if (child !== undefined) out[k] = child
        }
        return out
      }

      return v
    }

    return walk(input)
  }

  const handleSave = async () => {
  setSaving(true)
  try {
    // Reorganiza el payload para que coincida con lo que espera el backend
    const payload = {
      ...formData,
      estructura: {
        vertical: formData.estructura_vertical,
        horizontal: formData.estructura_horizontal,
        forjados: formData.forjados,
        soleras_losas: formData.soleras_losas,
        voladizos: formData.voladizos,
        cubiertas: formData.cubiertas,
      },
      instalaciones: {
        electrica: formData.instalacion_electrica,
        agua_acs: formData.instalacion_agua_acs,
        calefaccion: formData.calefaccion,
        climatizacion: formData.climatizacion,
      },
    }

    // (Opcional pero recomendado) normaliza valores: ""->null, "true"/"false"->bool, etc.
    const normalized = sanitizePayload ? sanitizePayload(payload) : payload

    const res = await fetch(`/api/informes/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(normalized),
    }).catch((e) => {
      console.warn("[edit] fetch fallo, pero seguimos a recargar:", e)
      return null as any
    })

    if (res) {
      const raw = await res.text().catch(() => "")
      try { raw && JSON.parse(raw) } catch { /* no importa si no es JSON */ }
    }
  } catch (e) {
    console.warn("[edit] Error no bloqueante al guardar:", e)
  } finally {
    setSaving(false)
    // Fuerza ver lo actualizado
    window.location.href = `/dashboard/gestor/informes/${params.id}`
    // Alternativas sin recarga completa:
    // router.replace(`/dashboard/gestor/informes/${params.id}?r=${Date.now()}`)
    // router.refresh()
  }
}

  
  

  if (loading) {
    return (
      <DashboardLayout title="Cargando..." roleLabel="Gestor">
        <div className="text-center py-12">Cargando informe...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Editar Informe INF-${params.id}`} roleLabel="Gestor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={prev} disabled={pasoActual === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Paso {pasoActual + 1} de {tablas.length}: {tablaActual}
          </div>
          {pasoActual < tablas.length - 1 ? (
            <Button onClick={next}>
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          )}
        </div>

        {/* barra de progreso */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((pasoActual + 1) / tablas.length) * 100}%` }}
          />
        </div>

        {renderFormularioTabla(
          tablaActual,
          formData[tablaActual] || {},
          (data) => updateFormData(tablaActual, data),
          (urls) => updateFotos(tablaActual, urls)
        )}
      </div>
    </DashboardLayout>
  )
}

/* --------------------------- FORM RENDER --------------------------- */

function renderFormularioTabla(
  tabla: string,
  data: any,
  onChange: (data: any) => void,
  onFotosChange: (urls: string[]) => void
) {
  const update = (k: string, v: any) => onChange({ ...data, [k]: v })
  const FotosField = (label?: string) => (
    <PhotoUploader value={data.fotos || []} onChange={onFotosChange} label={label || "Fotografías"} />
  )

  switch (tabla) {
    case "inmuebles":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Datos del Inmueble</CardTitle>
            <CardDescription>Información básica de la propiedad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["direccion", "Dirección *"],
                ["ref_catastral", "Referencia Catastral"],
                ["anno_construccion", "Año Construcción", "number"],
                ["metros_cuadrados", "Metros Cuadrados", "number"],
                ["orientacion", "Orientación"],
                ["tipo_propiedad", "Tipo Propiedad", "select"],
                ["planta", "Planta"],
                ["parcela", "Parcela"],
              ].map(([k, lab, typ]) => (
                <div key={k as string} className="space-y-2">
                  <Label>{lab}</Label>
                  {typ === "number" ? (
                    <Input type="number" value={data[k as string] || ""} onChange={(e) => update(k as string, e.target.value)} />
                  ) : typ === "select" ? (
                    <select
                      className="w-full p-2 border rounded-md"
                      value={data[k as string] || ""}
                      onChange={(e) => update(k as string, e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="vivienda">Vivienda</option>
                      <option value="local">Local</option>
                      <option value="oficina">Oficina</option>
                      <option value="nave">Nave</option>
                    </select>
                  ) : (
                    <Input value={data[k as string] || ""} onChange={(e) => update(k as string, e.target.value)} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              {[
                ["ampliado_reformado", "Ampliado/Reformado"],
                ["cambio_uso", "Cambio de Uso"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>

            {FotosField("Fotos del Inmueble")}
          </CardContent>
        </Card>
      )

    case "informes":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Datos del Informe</CardTitle>
            <CardDescription>Información general del informe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Coste Estimado Reparación (€)</Label>
              <Input
                type="number"
                value={data.coste_estimado_reparacion || ""}
                onChange={(e) => update("coste_estimado_reparacion", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Resumen Ejecutivo</Label>
              <Textarea
                rows={6}
                value={data.resumen_ejecutivo_texto || ""}
                onChange={(e) => update("resumen_ejecutivo_texto", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )

    case "inspectores":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Inspector</CardTitle>
            <CardDescription>Datos del inspector asignado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["nombre", "Nombre"],
                ["apellido", "Apellido"],
                ["fecha_inspeccion", "Fecha Inspección", "date"],
                ["contacto", "Contacto"],
                ["titulacion", "Titulación"],
                ["num_colegiado", "Nº Colegiado"],
              ].map(([k, lab, typ]) => (
                <div key={k as string} className="space-y-2">
                  <Label>{lab}</Label>
                  {typ === "date" ? (
                    <Input type="date" value={data[k as string] || ""} onChange={(e) => update(k as string, e.target.value)} />
                  ) : (
                    <Input value={data[k as string] || ""} onChange={(e) => update(k as string, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )

    case "servicios_inmueble":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Servicios del Inmueble</CardTitle>
            <CardDescription>Servicios disponibles en la propiedad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["agua", "Agua"],
                ["gas", "Gas"],
                ["electricidad", "Electricidad"],
                ["internet", "Internet"],
                ["gasoil", "Gasoil"],
                ["renovables", "Energías Renovables"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )

    case "condiciones_inspeccion":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Condiciones de Inspección</CardTitle>
            <CardDescription>Condiciones ambientales durante la inspección</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["temp_ambiente", "Temperatura Ambiente"],
                ["tiempo_atmosferico", "Tiempo Atmosférico"],
                ["sup_exterior", "Superficie Exterior"],
                ["trafico", "Tráfico"],
              ].map(([k, lab]) => (
                <div key={k} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[k] || ""} onChange={(e) => update(k, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="flex gap-6">
              {[
                ["lluvia_ultimos_3d", "Lluvia últimos 3 días"],
                ["zona_ruidosa", "Zona ruidosa"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )

    case "informacion_general":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Elementos comunes del edificio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["puerta_entrada_estado", "Estado Puerta Entrada"],
                ["patio_luces_estado", "Estado Patio de Luces"],
                ["patio_ventilacion_estado", "Estado Patio Ventilación"],
                ["ascensor_estado", "Estado Ascensor"],
                ["vestibulo_estado", "Estado Vestíbulo"],
                ["fachadas_estado", "Estado Fachadas"],
                ["jardines_estado", "Estado Jardines"],
              ].map(([k, lab]) => (
                <div key={k} className="space-y-2">
                  <Label>{lab}</Label>
                  <select className="w-full p-2 border rounded-md" value={data[k] || ""} onChange={(e) => update(k, e.target.value)}>
                    <option value="">Seleccionar...</option>
                    <option value="bueno">Bueno</option>
                    <option value="regular">Regular</option>
                    <option value="malo">Malo</option>
                    {(k === "ascensor_estado" || k === "jardines_estado") && <option value="no_tiene">No tiene</option>}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox checked={!!data.posib_ascensor} onCheckedChange={(c) => update("posib_ascensor", c === true)} />
              <Label>Posibilidad de instalar ascensor</Label>
            </div>

            <div className="space-y-2">
              <Label>Descripción General</Label>
              <Textarea rows={4} value={data.descripcion_general_texto || ""} onChange={(e) => update("descripcion_general_texto", e.target.value)} />
            </div>

            {FotosField("Fotos (Información General)")}
          </CardContent>
        </Card>
      )

    case "estructura_vertical":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estructura Vertical</CardTitle>
            <CardDescription>Muros y pilares</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["tipo_estructura_vertical", "Tipo de estructura vertical"],
                ["tipo_muros_carga", "Tipo de muros de carga"],
              ].map(([k, lab]) => (
                <div key={k} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[k] || ""} onChange={(e) => update(k, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Patologías</Label>
              <Textarea rows={4} value={data.patologias_estructura_vertical || ""} onChange={(e) => update("patologias_estructura_vertical", e.target.value)} />
            </div>
            {FotosField("Fotos Estructura Vertical")}
          </CardContent>
        </Card>
      )

    case "estructura_horizontal":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estructura Horizontal</CardTitle>
            <CardDescription>Vigas y viguetas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["tipo_vigas", "Tipo de vigas"],
                ["tipo_viguetas", "Tipo de viguetas"],
              ].map(([k, lab]) => (
                <div key={k} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[k] || ""} onChange={(e) => update(k, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Patologías en vigas</Label>
              <Textarea rows={3} value={data.patologias_vigas || ""} onChange={(e) => update("patologias_vigas", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Patologías en viguetas</Label>
              <Textarea rows={3} value={data.patologias_viguetas || ""} onChange={(e) => update("patologias_viguetas", e.target.value)} />
            </div>
            {FotosField("Fotos Estructura Horizontal")}
          </CardContent>
        </Card>
      )

    case "forjados":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Forjados</CardTitle>
            <CardDescription>Estado general</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox checked={!!data.tiene_desniveles} onCheckedChange={(c) => update("tiene_desniveles", c === true)} />
              <Label>Tiene desniveles</Label>
            </div>
            <div className="space-y-2">
              <Label>Patologías en forjados</Label>
              <Textarea rows={4} value={data.patologias_forjados || ""} onChange={(e) => update("patologias_forjados", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "soleras_losas":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Soleras y Losas</CardTitle>
            <CardDescription>Estado general</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              {[
                ["tiene_soleras", "Tiene soleras"],
                ["tiene_capilaridades", "Tiene capilaridades"],
                ["desniveles", "Desniveles"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Patologías</Label>
              <Textarea rows={4} value={data.patologias_soleras_losas || ""} onChange={(e) => update("patologias_soleras_losas", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "voladizos":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Voladizos</CardTitle>
            <CardDescription>Balcones y vuelos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Patologías en voladizos</Label>
            <Textarea rows={4} value={data.patologias_voladizos || ""} onChange={(e) => update("patologias_voladizos", e.target.value)} />
          </CardContent>
        </Card>
      )

    case "cubiertas":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Cubiertas</CardTitle>
            <CardDescription>Análisis de cubierta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de cubierta</Label>
                <select className="w-full p-2 border rounded-md" value={data.tipo_cubierta || ""} onChange={(e) => update("tipo_cubierta", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="plana">Plana</option>
                  <option value="inclinada">Inclinada</option>
                  <option value="mixta">Mixta</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Subtipo</Label>
                <Input value={data.subtipo || ""} onChange={(e) => update("subtipo", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Acabado</Label>
                <Input value={data.acabado || ""} onChange={(e) => update("acabado", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-6">
              {[
                ["cubierta_ventilada", "Cubierta ventilada"],
                ["tiene_aislamiento", "Tiene aislamiento"],
                ["impermeabilizacion", "Impermeabilización"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Estado del aislamiento</Label>
              <Textarea rows={2} value={data.aislamiento_estado_texto || ""} onChange={(e) => update("aislamiento_estado_texto", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Estado de la impermeabilización</Label>
              <Textarea rows={2} value={data.impermeabilizacion_estado_texto || ""} onChange={(e) => update("impermeabilizacion_estado_texto", e.target.value)} />
            </div>

            {FotosField("Fotos Cubiertas")}
          </CardContent>
        </Card>
      )

    case "instalacion_electrica":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Instalación Eléctrica</CardTitle>
            <CardDescription>Cuadro, canalizaciones y cableado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              {[
                ["tiene_instalacion", "Tiene instalación"],
                ["cuadro_en_norma", "Cuadro en norma"],
                ["toma_tierra", "Toma de tierra"],
                ["energias_renovables", "Energías renovables"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["canalizaciones", "Canalizaciones"],
                ["cableado_exterior", "Cableado exterior"],
                ["cableado_interior", "Cableado interior"],
              ].map(([k, lab]) => (
                <div key={k} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[k] || ""} onChange={(e) => update(k, e.target.value)} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Estado cajas de empalme</Label>
                <select className="w-full p-2 border rounded-md" value={data.cajas_empalme_estado || ""} onChange={(e) => update("cajas_empalme_estado", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e) => update("observaciones_texto", e.target.value)} />
            </div>

            {FotosField("Fotos Instalación Eléctrica")}
          </CardContent>
        </Card>
      )

    case "instalacion_agua_acs":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Instalación de Agua y ACS</CardTitle>
            <CardDescription>Llaves, materiales y normativa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              {[
                ["dispone_acs", "Dispone ACS"],
                ["sistema_normativa", "Sistema en normativa"],
                ["llave_paso_general", "Llave de paso general"],
                ["tuberias_empotradas", "Tuberías empotradas"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["tipo_acs", "Tipo de ACS"],
                ["extraccion_acs", "Extracción ACS"],
                ["material_tuberias", "Material de tuberías"],
                ["bajantes", "Bajantes"],
                ["arquetas", "Arquetas"],
              ].map(([k, lab]) => (
                <div key={k} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[k] || ""} onChange={(e) => update(k, e.target.value)} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Estado llave de paso</Label>
                <select className="w-full p-2 border rounded-md" value={data.llave_paso_estado || ""} onChange={(e) => update("llave_paso_estado", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e) => update("observaciones_texto", e.target.value)} />
            </div>

            {FotosField("Fotos Instalación Agua y ACS")}
          </CardContent>
        </Card>
      )

    case "calefaccion":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Calefacción</CardTitle>
            <CardDescription>Caldera, emisores y tuberías</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              {[
                ["dispone_calefaccion", "Dispone calefacción"],
                ["sistema_normativa", "Sistema en normativa"],
                ["tuberias_empotradas", "Tuberías empotradas"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["tipo_calefaccion", "Tipo de calefacción"],
                ["estado_caldera", "Estado caldera"],
                ["tuberias_calefaccion", "Tuberías calefacción"],
                ["tipo_emisor", "Tipo de emisor"],
                ["extraccion_calefaccion", "Extracción calefacción"],
              ].map(([k, lab]) => (
                <div key={k} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[k] || ""} onChange={(e) => update(k, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e) => update("observaciones_texto", e.target.value)} />
            </div>

            {FotosField("Fotos Calefacción")}
          </CardContent>
        </Card>
      )

    case "climatizacion":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Climatización</CardTitle>
            <CardDescription>Equipos y disponibilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox checked={!!data.dispone_climatizacion} onCheckedChange={(c) => update("dispone_climatizacion", c === true)} />
              <Label>Dispone de climatización</Label>
            </div>
          </CardContent>
        </Card>
      )

    case "carpinterias":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Carpinterías</CardTitle>
            <CardDescription>Ventanas, puertas y persianas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              {[
                ["rotura_puente_termico", "Rotura puente térmico"],
                ["puentes_termicos_persiana", "Puentes térmicos persiana"],
              ].map(([k, lab]) => (
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c) => update(k, c === true)} />
                  <Label>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["material_carpinteria", "Material carpintería"],
                ["aislamiento_termico_ventanas_estado", "Estado aislamiento térmico ventanas", "estado"],
                ["aislamiento_acustico_ventanas_estado", "Estado aislamiento acústico ventanas", "estado"],
                ["sistema_oscurecimiento", "Sistema de oscurecimiento"],
                ["material_persianas", "Material persianas"],
                ["recogida_persianas", "Recogida persianas"],
                ["caja_persianas", "Caja persianas"],
                ["tapa_cajon_persianas", "Tapa cajón persianas"],
              ].map(([k, lab, typ]) => (
                <div key={k as string} className="space-y-2">
                  <Label>{lab}</Label>
                  {typ === "estado" ? (
                    <select className="w-full p-2 border rounded-md" value={data[k as string] || ""} onChange={(e) => update(k as string, e.target.value)}>
                      <option value="">Seleccionar...</option>
                      <option value="bueno">Bueno</option>
                      <option value="regular">Regular</option>
                      <option value="malo">Malo</option>
                      {k === "aislamiento_acustico_ventanas_estado" && <option value="no_tiene">No tiene</option>}
                    </select>
                  ) : (
                    <Input value={data[k as string] || ""} onChange={(e) => update(k as string, e.target.value)} />
                  )}
                </div>
              ))}
            </div>

            {FotosField("Fotos Carpinterías")}
          </CardContent>
        </Card>
      )

    case "jardin":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Jardín y Exteriores</CardTitle>
            <CardDescription>Elementos y observaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Descripción corta</Label>
              <Input value={data.descripcion_corta || ""} onChange={(e) => update("descripcion_corta", e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["puerta_parcela", "Puerta parcela"],
                ["valla_perimetral", "Valla perimetral"],
                ["cesped", "Césped"],
                ["arboles", "Árboles"],
                ["zona_pavimentada", "Zona pavimentada"],
                ["tarimas_madera", "Tarimas de madera"],
                ["pergola_porche", "Pérgola/Porche"],
                ["piscina", "Piscina"],
                ["zona_barbacoa", "Zona barbacoa"],
                ["zona_ducha", "Zona ducha"],
                ["banos_exteriores", "Baños exteriores"],
                ["iluminacion_exterior", "Iluminación exterior"],
                ["riego_automatico", "Riego automático"],
                ["pozo", "Pozo"],
                ["deposito_agua", "Depósito de agua"],
                ["camaras_seguridad", "Cámaras de seguridad"],
              ].map(([k, lab]) => (
                <div key={k} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[k] || ""} onChange={(e) => update(k, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Fachada</Label>
              <Textarea rows={2} value={data.fachada_texto || ""} onChange={(e) => update("fachada_texto", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e) => update("observaciones_texto", e.target.value)} />
            </div>

            {FotosField("Fotos Jardín/Exteriores")}
          </CardContent>
        </Card>
      )

    /* ---------- ESTANCIAS ---------- */

    case "estancia_salon":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estancia: Salón</CardTitle>
            <CardDescription>Estado del salón</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado general"],
              ["pavimento","Pavimento"],
              ["paredes_techos","Paredes y techos"],
              ["ventanas_carpinteria","Ventanas / carpintería"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>update(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-6">
              {[
                ["ventilacion_natural","Ventilación natural"],
                ["iluminacion_natural","Iluminación natural"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c)=>update(k, c === true)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>update("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancia_cocina":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estancia: Cocina</CardTitle>
            <CardDescription>Estado de la cocina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado general"],
              ["encimera_mobiliario","Encimera y mobiliario"],
              ["campana_extractora","Campana extractora"],
              ["griferia_fregadero","Grifería / fregadero"],
              ["revestimientos","Revestimientos"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>update(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-6">
              {[
                ["elec_adecuada","Instalación eléctrica adecuada"],
                ["salida_humos","Salida de humos"],
                ["ventilacion_natural","Ventilación natural"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c)=>update(k, c === true)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>update("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancia_dormitorio":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estancia: Dormitorio</CardTitle>
            <CardDescription>Estado de dormitorios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado general"],
              ["pavimento","Pavimento"],
              ["paredes_techos","Paredes y techos"],
              ["ventanas_aislamiento","Ventanas / aislamiento"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>update(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-6">
              {[
                ["ventilacion_natural","Ventilación natural"],
                ["iluminacion_natural","Iluminación natural"],
                ["humedades","Humedades"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c)=>update(k, c === true)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>update("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancia_bano":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estancia: Baño</CardTitle>
            <CardDescription>Estado de baños</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado general"],
              ["revestimientos","Revestimientos"],
              ["fontaneria_sanitarios","Fontanería y sanitarios"],
              ["ventilacion","Ventilación"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>update(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-6">
              {[
                ["humedades_filtraciones","Humedades / filtraciones"],
                ["elec_adecuada","Instalación eléctrica adecuada"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c)=>update(k, c === true)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>update("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancia_terraza":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estancia: Terraza</CardTitle>
            <CardDescription>Exterior privado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["tipo_terraza","Tipo de terraza"],
              ["pavimento_exterior","Pavimento exterior"],
              ["barandilla_estado","Estado de barandilla"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>update(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-6">
              {[
                ["impermeabilizacion","Impermeabilización"],
                ["grietas_fisuras","Grietas / fisuras"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c)=>update(k, c === true)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>update("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancia_garaje":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estancia: Garaje</CardTitle>
            <CardDescription>Estado del garaje</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado general"],
              ["pavimento","Pavimento"],
              ["paredes_techos","Paredes y techos"],
              ["puerta_modo","Modo de puerta"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>update(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-6">
              {[
                ["ventilacion","Ventilación"],
                ["iluminacion","Iluminación"],
                ["filtraciones","Filtraciones"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c)=>update(k, c === true)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>update("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancia_sotano":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Estancia: Sótano</CardTitle>
            <CardDescription>Uso y condiciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado general"],
              ["revestimientos","Revestimientos"],
              ["uso_actual","Uso actual"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>update(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-6">
              {[
                ["humedad","Humedad"],
                ["ventilacion","Ventilación"],
                ["iluminacion","Iluminación"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={!!data[k]} onCheckedChange={(c)=>update(k, c === true)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>update("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    /* ---------- OTRAS / CIERRE ---------- */

    

    case "eficiencia":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Eficiencia Energética</CardTitle>
            <CardDescription>Notas y detalles de eficiencia energética</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Notas de eficiencia</Label>
              <Textarea
                rows={6}
                value={data.notas_texto || ""}
                onChange={(e) => update("notas_texto", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Certificado Energético</Label>
              <Input
                type="text"
                value={data.certificado_energetico || ""}
                onChange={(e) => update("certificado_energetico", e.target.value)}
                placeholder="Ejemplo: Certificado ABC123"
              />
            </div>

            <div className="space-y-2">
              <Label>Calificación Energética</Label>
              <Input
                type="text"
                value={data.calificacion_energetica || ""}
                onChange={(e) => update("calificacion_energetica", e.target.value)}
                placeholder="Ejemplo: A+, B, C..."
              />
            </div>

            <div className="space-y-2">
              <Label>Consumo Anual Estimado</Label>
              <Input
                type="text"
                value={data.consumo_anual_estimado || ""}
                onChange={(e) => update("consumo_anual_estimado", e.target.value)}
                placeholder="Ejemplo: 120 kWh/m² año"
              />
            </div>
          </CardContent>
        </Card>
      )

    case "siguientes_pasos":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Siguientes Pasos</CardTitle>
            <CardDescription>Recomendaciones y acciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["obtener_presupuestos_texto", "Obtener presupuestos"],
              ["estudios_complementarios_texto", "Estudios complementarios"],
              ["descripcion_servicio_texto", "Descripción del servicio"],
              ["consejos_antes_comprar_texto", "Consejos antes de comprar"],
              ["consejos_mantenimiento_texto", "Consejos de mantenimiento"],
            ].map(([k, lab]) => (
              <div key={k} className="space-y-2">
                <Label>{lab}</Label>
                <Textarea rows={3} value={data[k] || ""} onChange={(e) => update(k, e.target.value)} />
              </div>
            ))}
          </CardContent>
        </Card>
      )

    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle>{tabla}</CardTitle>
            <CardDescription>Sección en desarrollo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Esta sección está en desarrollo.</p>
          </CardContent>
        </Card>
      )
  }
}
