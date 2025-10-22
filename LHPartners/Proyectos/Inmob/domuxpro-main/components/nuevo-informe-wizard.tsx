"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { PhotoUploader } from "@/components/photo-uploader"
import { ArrowLeft, ArrowRight, Save, FileText, Building, ClipboardCheck } from "lucide-react"
import { useBrandToast } from "@/hooks/use-brand-toast"

type TipoInforme = "basico" | "tecnico" | "documental"

type NuevoInformeWizardProps = {
  roleLabel: string
  successRedirect: (informeId: number) => string
  clienteId?: number | null
  asignacionId?: number | null
}

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
  
    // nuevas estanciass
    "estancias_salon",
    "estancias_cocina",
    "estancias_dormitorio",
    "estancias_bano",
    "estancias_terraza",
    "estancias_garaje",
    "estancias_sotano",
  
    // cierre documental
    "eficiencia",
    "siguientes_pasos",
  ],
  
}

const CAMPOS_POR_TABLA: Record<string, Array<{ name: string; label: string; type: string; required?: boolean }>> = {
  inmuebles: [
    { name: "direccion", label: "Dirección", type: "text", required: true },
    { name: "ref_catastral", label: "Referencia Catastral", type: "text" },
    { name: "anno_construccion", label: "Año de Construcción", type: "number" },
    { name: "metros_cuadrados", label: "Metros Cuadrados", type: "number" },
    { name: "orientacion", label: "Orientación", type: "text" },
    { name: "parcela", label: "Parcela", type: "text" },
    { name: "tipo_propiedad", label: "Tipo de Propiedad", type: "text" },
    { name: "planta", label: "Planta", type: "text" },
    { name: "ampliado_reformado", label: "Ampliado/Reformado", type: "boolean" },
    { name: "cambio_uso", label: "Cambio de Uso", type: "boolean" },
    { name: "ventilacion_cruzada", label: "Ventilación Cruzada", type: "text" },
    { name: "ventilacion_general", label: "Ventilación General", type: "text" },
    { name: "iluminacion", label: "Iluminación", type: "text" },
  ],
  informes: [
    { name: "created_at", label: "Fecha Creación", type: "date" },
    { name: "resumen_ejecutivo_texto", label: "Resumen Ejecutivo", type: "textarea" },
    { name: "coste_estimado_reparacion", label: "Coste Estimado de Reparación", type: "number" },
  ],
  inspectores: [
    { name: "nombre", label: "Nombre", type: "text", required: true },
    { name: "apellido", label: "Apellido", type: "text", required: true },
    { name: "contacto", label: "Contacto", type: "text" },
    { name: "num_colegiado", label: "Número de Colegiado", type: "text" },
    { name: "titulacion", label: "Titulación", type: "text" },
    { name: "fecha_inspeccion", label: "Fecha de Inspección", type: "date", required: true },
  ],
  servicios_inmueble: [
    { name: "electricidad", label: "Electricidad", type: "boolean" },
    { name: "agua", label: "Agua", type: "boolean" },
    { name: "gas", label: "Gas", type: "boolean" },
    { name: "gasoil", label: "Gasoil", type: "boolean" },
    { name: "internet", label: "Internet", type: "boolean" },
    { name: "renovables", label: "Energías Renovables", type: "boolean" },
  ],
  condiciones_inspeccion: [
    { name: "tiempo_atmosferico", label: "Tiempo Atmosférico", type: "text" },
    { name: "temp_ambiente", label: "Temperatura Ambiente", type: "text" },
    { name: "lluvia_ultimos_3d", label: "Lluvia en los Últimos 3 Días", type: "boolean" },
    { name: "zona_ruidosa", label: "Zona Ruidosa", type: "boolean" },
    { name: "trafico", label: "Tráfico", type: "text" },
    { name: "sup_exterior", label: "Superficie Exterior", type: "text" },
  ],
  informacion_general: [
    { name: "descripcion_general_texto", label: "Descripción General", type: "textarea" },
    { name: "fachadas_estado", label: "Estado de Fachadas", type: "text" },
    { name: "puerta_entrada_estado", label: "Estado Puerta de Entrada", type: "text" },
    { name: "vestibulo_estado", label: "Estado del Vestíbulo", type: "text" },
    { name: "ascensor_estado", label: "Estado del Ascensor", type: "text" },
    { name: "posib_ascensor", label: "Posibilidad de Ascensor", type: "boolean" },
    { name: "patio_luces_estado", label: "Estado Patio de Luces", type: "text" },
    { name: "patio_ventilacion_estado", label: "Estado Patio de Ventilación", type: "text" },
    { name: "jardines_estado", label: "Estado de Jardines", type: "text" },
  ],
  estructura_vertical: [
    { name: "tipo_estructura_vertical", label: "Tipo de Estructura Vertical", type: "text" },
    { name: "tipo_muros_carga", label: "Tipo de Muros de Carga", type: "text" },
    { name: "patologias_estructura_vertical", label: "Patologías", type: "textarea" },
  ],
  estructura_horizontal: [
    { name: "tipo_vigas", label: "Tipo de Vigas", type: "text" },
    { name: "patologias_vigas", label: "Patologías en Vigas", type: "textarea" },
    { name: "tipo_viguetas", label: "Tipo de Viguetas", type: "text" },
    { name: "patologias_viguetas", label: "Patologías en Viguetas", type: "textarea" },
  ],
  forjados: [
    { name: "patologias_forjados", label: "Patologías en Forjados", type: "textarea" },
    { name: "tiene_desniveles", label: "Tiene Desniveles", type: "boolean" },
  ],
  soleras_losas: [
    { name: "tiene_soleras", label: "Tiene Soleras", type: "boolean" },
    { name: "patologias_soleras_losas", label: "Patologías", type: "textarea" },
    { name: "desniveles", label: "Desniveles", type: "boolean" },
    { name: "tiene_capilaridades", label: "Tiene Capilaridades", type: "boolean" },
  ],
  voladizos: [{ name: "patologias_voladizos", label: "Patologías en Voladizos", type: "textarea" }],
  cubiertas: [
    { name: "tipo_cubierta", label: "Tipo de Cubierta", type: "text" },
    { name: "subtipo", label: "Subtipo", type: "text" },
    { name: "acabado", label: "Acabado", type: "text" },
    { name: "cubierta_ventilada", label: "Cubierta Ventilada", type: "boolean" },
    { name: "tiene_aislamiento", label: "Tiene Aislamiento", type: "boolean" },
    { name: "aislamiento_estado_texto", label: "Estado del Aislamiento", type: "textarea" },
    { name: "impermeabilizacion", label: "Impermeabilización", type: "boolean" },
    { name: "impermeabilizacion_estado_texto", label: "Estado de Impermeabilización", type: "textarea" },
  ],
  instalacion_electrica: [
    { name: "tiene_instalacion", label: "Tiene Instalación", type: "boolean" },
    { name: "cuadro_en_norma", label: "Cuadro en Norma", type: "boolean" },
    { name: "toma_tierra", label: "Toma de Tierra", type: "boolean" },
    { name: "energias_renovables", label: "Energías Renovables", type: "boolean" },
    { name: "cableado_interior", label: "Cableado Interior", type: "text" },
    { name: "cableado_exterior", label: "Cableado Exterior", type: "text" },
    { name: "canalizaciones", label: "Canalizaciones", type: "text" },
    { name: "cajas_empalme_estado", label: "Estado Cajas de Empalme", type: "text" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],
  instalacion_agua_acs: [
    { name: "llave_paso_general", label: "Llave de Paso General", type: "boolean" },
    { name: "llave_paso_estado", label: "Estado Llave de Paso", type: "text" },
    { name: "material_tuberias", label: "Material de Tuberías", type: "text" },
    { name: "tuberias_empotradas", label: "Tuberías Empotradas", type: "boolean" },
    { name: "bajantes", label: "Bajantes", type: "text" },
    { name: "arquetas", label: "Arquetas", type: "text" },
    { name: "sistema_normativa", label: "Sistema en Normativa", type: "boolean" },
    { name: "dispone_acs", label: "Dispone de ACS", type: "boolean" },
    { name: "tipo_acs", label: "Tipo de ACS", type: "text" },
    { name: "extraccion_acs", label: "Extracción ACS", type: "text" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],
  calefaccion: [
    { name: "dispone_calefaccion", label: "Dispone de Calefacción", type: "boolean" },
    { name: "tipo_calefaccion", label: "Tipo de Calefacción", type: "text" },
    { name: "tipo_emisor", label: "Tipo de Emisor", type: "text" },
    { name: "estado_caldera", label: "Estado de la Caldera", type: "text" },
    { name: "tuberias_calefaccion", label: "Tuberías de Calefacción", type: "text" },
    { name: "tuberias_empotradas", label: "Tuberías Empotradas", type: "boolean" },
    { name: "extraccion_calefaccion", label: "Extracción", type: "text" },
    { name: "sistema_normativa", label: "Sistema en Normativa", type: "boolean" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],
  climatizacion: [{ name: "dispone_climatizacion", label: "Dispone de Climatización", type: "boolean" }],
  carpinterias: [
    { name: "material_carpinteria", label: "Material de Carpintería", type: "text" },
    { name: "rotura_puente_termico", label: "Rotura de Puente Térmico", type: "boolean" },
    { name: "cristales_con_camara_estado", label: "Estado Cristales con Cámara", type: "text" },
    { name: "aislamiento_termico_ventanas_estado", label: "Estado Aislamiento Térmico Ventanas", type: "text" },
    { name: "aislamiento_acustico_ventanas_estado", label: "Estado Aislamiento Acústico Ventanas", type: "text" },
    { name: "sistema_oscurecimiento", label: "Sistema de Oscurecimiento", type: "text" },
    { name: "material_persianas", label: "Material de Persianas", type: "text" },
    { name: "caja_persianas", label: "Caja de Persianas", type: "text" },
    { name: "recogida_persianas", label: "Recogida de Persianas", type: "text" },
    { name: "tapa_cajon_persianas", label: "Tapa Cajón de Persianas", type: "text" },
    { name: "puentes_termicos_persiana", label: "Puentes Térmicos en Persiana", type: "boolean" },
  ],
  estancias_bano: [
    { name: "estado_general", label: "Estado General", type: "text" },
    { name: "revestimientos", label: "Revestimientos", type: "text" },
    { name: "fontaneria_sanitarios", label: "Fontanería y Sanitarios", type: "text" },
    { name: "ventilacion", label: "Ventilación", type: "text" },
    { name: "humedades_filtraciones", label: "Humedades / Filtraciones", type: "boolean" },
    { name: "elec_adecuada", label: "Instalación Eléctrica Adecuada", type: "boolean" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],

  estancias_salon: [
    { name: "estado_general", label: "Estado General", type: "text" },
    { name: "pavimento", label: "Pavimento", type: "text" },
    { name: "paredes_techos", label: "Paredes y Techos", type: "text" },
    { name: "ventanas_carpinteria", label: "Ventanas / Carpintería", type: "text" },
    { name: "ventilacion_natural", label: "Ventilación Natural", type: "boolean" },
    { name: "iluminacion_natural", label: "Iluminación Natural", type: "boolean" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],

  estancias_cocina: [
    { name: "estado_general", label: "Estado General", type: "text" },
    { name: "encimera_mobiliario", label: "Encimera y Mobiliario", type: "text" },
    { name: "campana_extractora", label: "Campana Extractora", type: "text" },
    { name: "elec_adecuada", label: "Instalación Eléctrica Adecuada", type: "boolean" },
    { name: "salida_humos", label: "Salida de Humos", type: "boolean" },
    { name: "ventilacion_natural", label: "Ventilación Natural", type: "boolean" },
    { name: "griferia_fregadero", label: "Grifería / Fregadero", type: "text" },
    { name: "revestimientos", label: "Revestimientos", type: "text" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],

  estancias_dormitorio: [
    { name: "estado_general", label: "Estado General", type: "text" },
    { name: "pavimento", label: "Pavimento", type: "text" },
    { name: "paredes_techos", label: "Paredes y Techos", type: "text" },
    { name: "ventanas_aislamiento", label: "Ventanas / Aislamiento", type: "text" },
    { name: "ventilacion_natural", label: "Ventilación Natural", type: "boolean" },
    { name: "iluminacion_natural", label: "Iluminación Natural", type: "boolean" },
    { name: "humedades", label: "Humedades", type: "boolean" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],

  estancias_terraza: [
    { name: "tipo_terraza", label: "Tipo de Terraza", type: "text" },
    { name: "pavimento_exterior", label: "Pavimento Exterior", type: "text" },
    { name: "barandilla_estado", label: "Estado de Barandilla", type: "text" },
    { name: "impermeabilizacion", label: "Impermeabilización", type: "boolean" },
    { name: "grietas_fisuras", label: "Grietas / Fisuras", type: "boolean" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],

  estancias_garaje: [
    { name: "estado_general", label: "Estado General", type: "text" },
    { name: "pavimento", label: "Pavimento", type: "text" },
    { name: "paredes_techos", label: "Paredes y Techos", type: "text" },
    { name: "ventilacion", label: "Ventilación", type: "boolean" },
    { name: "iluminacion", label: "Iluminación", type: "boolean" },
    { name: "puerta_modo", label: "Modo de Puerta", type: "text" },
    { name: "filtraciones", label: "Filtraciones", type: "boolean" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],

  estancias_sotano: [
    { name: "estado_general", label: "Estado General", type: "text" },
    { name: "humedad", label: "Humedad", type: "boolean" },
    { name: "ventilacion", label: "Ventilación", type: "boolean" },
    { name: "iluminacion", label: "Iluminación", type: "boolean" },
    { name: "revestimientos", label: "Revestimientos", type: "text" },
    { name: "uso_actual", label: "Uso Actual", type: "text" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],

  jardin: [
    { name: "descripcion_corta", label: "Descripción Corta", type: "text" },
    { name: "cesped", label: "Césped", type: "text" },
    { name: "arboles", label: "Árboles", type: "text" },
    { name: "zona_pavimentada", label: "Zona Pavimentada", type: "text" },
    { name: "tarimas_madera", label: "Tarimas de Madera", type: "text" },
    { name: "piscina", label: "Piscina", type: "text" },
    { name: "zona_barbacoa", label: "Zona de Barbacoa", type: "text" },
    { name: "pergola_porche", label: "Pérgola/Porche", type: "text" },
    { name: "valla_perimetral", label: "Valla Perimetral", type: "text" },
    { name: "puerta_parcela", label: "Puerta de Parcela", type: "text" },
    { name: "iluminacion_exterior", label: "Iluminación Exterior", type: "text" },
    { name: "riego_automatico", label: "Riego Automático", type: "text" },
    { name: "deposito_agua", label: "Depósito de Agua", type: "text" },
    { name: "pozo", label: "Pozo", type: "text" },
    { name: "zona_ducha", label: "Zona de Ducha", type: "text" },
    { name: "banos_exteriores", label: "Baños Exteriores", type: "text" },
    { name: "camaras_seguridad", label: "Cámaras de Seguridad", type: "text" },
    { name: "fachada_texto", label: "Fachada", type: "textarea" },
    { name: "observaciones_texto", label: "Observaciones", type: "textarea" },
  ],

  eficiencia: [
    { name: "notas_texto", label: "Notas de Eficiencia", type: "textarea" },
    { name: "certificado_energetico", label: "Certificado Energético", type: "text" },
    { name: "calificacion_energetica", label: "Calificación Energética", type: "text" },
    { name: "consumo_anual_estimado", label: "Consumo Anual Estimado", type: "text" },
  ],
  
  siguientes_pasos: [
    { name: "consejos_antes_comprar_texto", label: "Consejos Antes de Comprar", type: "textarea" },
    { name: "estudios_complementarios_texto", label: "Estudios Complementarios", type: "textarea" },
    { name: "obtener_presupuestos_texto", label: "Obtener Presupuestos", type: "textarea" },
    { name: "descripcion_servicio_texto", label: "Descripción del Servicio", type: "textarea" },
    { name: "consejos_mantenimiento_texto", label: "Consejos de Mantenimiento", type: "textarea" },
  ],
}

/**
 * Secciones que llevan subida de fotos.
 * IMPORTANTE: aquí añadimos también "inmuebles" para que el informe básico
 * tenga fotos en Datos del Inmueble, como pediste.
 */
const TABLAS_CON_FOTOS = [
  "inmuebles",
  "informacion_general",
  "estructura_horizontal",
  "estructura_vertical",
  "cubiertas",
  "carpinterias",
  "instalacion_agua_acs",
"instalacion_electrica",
"calefaccion",
"jardin",
]

export function NuevoInformeWizard({ roleLabel, successRedirect, clienteId, asignacionId }: NuevoInformeWizardProps) {
  const router = useRouter()
  const brandToast = useBrandToast()
  const [tipoInforme, setTipoInforme] = useState<TipoInforme | null>(null)
  const [pasoActual, setPasoActual] = useState(0)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<Record<string, any>>({})

  const tablas = tipoInforme ? TABLAS_POR_TIPO[tipoInforme] : []
  const tablaActual = tablas[pasoActual]

  const updateFormData = (tabla: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [tabla]: { ...prev[tabla], ...data },
    }))
  }

  const handleSiguiente = () => {
    if (pasoActual < tablas.length - 1) {
      setPasoActual(pasoActual + 1)
    }
  }

  const handleAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/informes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoInforme,
          data: formData, // <-- incluye fotos: { seccion: { ..., fotos: [...] } }
          clienteId: clienteId ?? null,
          asignacionId: asignacionId ?? null,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(successRedirect(result.informeId))
      } else {
        const err = await response.text()
        brandToast.error("No se pudo guardar el informe: " + err)
      }
    } catch (error) {
      console.error("[v0] Error al guardar:", error)
      brandToast.error("Ocurrió un error al guardar el informe.")
    } finally {
      setSaving(false)
    }
  }

  if (!tipoInforme) {
    return (
      <DashboardLayout title="Nuevo Informe" roleLabel={roleLabel}>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Selecciona el Tipo de Informe</h2>
            <p className="text-muted-foreground">Elige el tipo de informe que deseas crear</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setTipoInforme("basico")}
            >
              <CardHeader>
                <FileText className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Informe Básico</CardTitle>
                <CardDescription>Informe esencial con datos fundamentales del inmueble</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Datos del inmueble (con fotos)</li>
                  <li>• Inspector asignado</li>
                  <li>• Servicios disponibles</li>
                  <li>• Condiciones de inspección</li>
                  <li>• Información general (con fotos)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">6 secciones</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setTipoInforme("tecnico")}
            >
              <CardHeader>
                <Building className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Informe Técnico Completo</CardTitle>
                <CardDescription>Análisis detallado de estructura e instalaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Todo lo del informe básico</li>
                  <li>• Estructura vertical/horizontal (con fotos)</li>
                  <li>• Cubiertas & Carpinterías (con fotos)</li>
                  <li>• Instalación eléctrica y Agua/ACS (con fotos)</li>
                  <li>• Calefacción (con fotos) y Jardín (con fotos)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">18 secciones</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setTipoInforme("documental")}
            >
              <CardHeader>
                <ClipboardCheck className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Informe Documental Completo</CardTitle>
                <CardDescription>Documentación exhaustiva con todos los detalles</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Todo lo del informe técnico</li>
                  <li>• Eficiencia energética</li>
                  <li>• Recomendaciones y siguientes pasos</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">23 secciones</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={`Nuevo Informe ${tipoInforme === "basico" ? "Básico" : tipoInforme === "tecnico" ? "Técnico" : "Documental"}`}
      roleLabel={roleLabel}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (tipoInforme && pasoActual === 0 ? setTipoInforme(null) : handleAnterior())}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {pasoActual === 0 ? "Cambiar Tipo" : "Anterior"}
          </Button>
          <div className="text-sm text-muted-foreground">
            Paso {pasoActual + 1} de {tablas.length}: {tablaActual}
          </div>
          {pasoActual < tablas.length - 1 ? (
            <Button onClick={handleSiguiente}>
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Informe"}
            </Button>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((pasoActual + 1) / tablas.length) * 100}%` }}
          />
        </div>

        {renderFormularioTabla(tablaActual, formData[tablaActual] || {}, (data) => updateFormData(tablaActual, data))}
      </div>
    </DashboardLayout>
  )
}

export default NuevoInformeWizard

function renderFormularioTabla(tabla: string, data: any, onChange: (data: any) => void) {
  const campos = CAMPOS_POR_TABLA[tabla] || []

  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  // Títulos descriptivos para cada tabla
  const titulosTablas: Record<string, { titulo: string; descripcion: string }> = {
    inmuebles: { titulo: "Datos del Inmueble", descripcion: "Información básica de la propiedad" },
    informes: { titulo: "Datos del Informe", descripcion: "Información general del informe" },
    inspectores: { titulo: "Datos del Inspector", descripcion: "Información del inspector asignado" },
    servicios_inmueble: { titulo: "Servicios del Inmueble", descripcion: "Servicios disponibles en la propiedad" },
    condiciones_inspeccion: {
      titulo: "Condiciones de Inspección",
      descripcion: "Condiciones ambientales durante la inspección",
    },
    informacion_general: { titulo: "Información General", descripcion: "Descripción general del inmueble" },
    estructura_vertical: { titulo: "Estructura Vertical", descripcion: "Análisis de muros y pilares" },
    estructura_horizontal: { titulo: "Estructura Horizontal", descripcion: "Análisis de vigas y viguetas" },
    forjados: { titulo: "Forjados", descripcion: "Estado de los forjados" },
    soleras_losas: { titulo: "Soleras y Losas", descripcion: "Estado de soleras y losas" },
    voladizos: { titulo: "Voladizos", descripcion: "Estado de voladizos y balcones" },
    cubiertas: { titulo: "Cubiertas", descripcion: "Análisis de la cubierta del edificio" },
    instalacion_electrica: { titulo: "Instalación Eléctrica", descripcion: "Estado de la instalación eléctrica" },
    instalacion_agua_acs: { titulo: "Instalación de Agua y ACS", descripcion: "Sistema de agua y agua caliente" },
    calefaccion: { titulo: "Calefacción", descripcion: "Sistema de calefacción" },
    climatizacion: { titulo: "Climatización", descripcion: "Sistema de climatización" },
    carpinterias: { titulo: "Carpinterías", descripcion: "Estado de ventanas y puertas" },
    jardin: { titulo: "Jardín y Exteriores", descripcion: "Elementos del jardín y zonas exteriores" },
    eficiencia: { titulo: "Eficiencia Energética", descripcion: "Análisis de eficiencia energética" },
    siguientes_pasos: { titulo: "Siguientes Pasos", descripcion: "Recomendaciones y próximos pasos" },
    resumen_inspeccion_metricas: {
      titulo: "Métricas de Inspección",
      descripcion: "Resumen estadístico de la inspección",
    },
    secciones_informe: { titulo: "Secciones del Informe", descripcion: "Estructura del informe" },
  }

  const info = titulosTablas[tabla] || { titulo: tabla, descripcion: "Completa la información de esta sección" }

  const requiereFotos = TABLAS_CON_FOTOS.includes(tabla)

  if (campos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{info.titulo}</CardTitle>
          <CardDescription>{info.descripcion}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Esta sección no requiere datos adicionales. Continúa con el siguiente paso.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{info.titulo}</CardTitle>
        <CardDescription>{info.descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.name} className={campo.type === "textarea" ? "md:col-span-2" : ""}>
              <div className="space-y-2">
                <Label>
                  {campo.label}
                  {campo.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {campo.type === "text" && (
                  <Input
                    value={data[campo.name] || ""}
                    onChange={(e) => updateField(campo.name, e.target.value)}
                    required={campo.required}
                  />
                )}
                {campo.type === "number" && (
                  <Input
                    type="number"
                    value={data[campo.name] || ""}
                    onChange={(e) => updateField(campo.name, e.target.value ? Number(e.target.value) : null)}
                    required={campo.required}
                  />
                )}
                {campo.type === "date" && (
                  <Input
                    type="date"
                    value={data[campo.name] || ""}
                    onChange={(e) => updateField(campo.name, e.target.value)}
                    required={campo.required}
                  />
                )}
                {campo.type === "textarea" && (
                  <Textarea
                    value={data[campo.name] || ""}
                    onChange={(e) => updateField(campo.name, e.target.value)}
                    rows={4}
                    required={campo.required}
                  />
                )}
                {campo.type === "boolean" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={data[campo.name] || false}
                      onCheckedChange={(checked) => updateField(campo.name, checked)}
                    />
                    <span className="text-sm text-muted-foreground">Sí</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {requiereFotos && (
          <div className="border-t pt-6 md:col-span-2">
            <PhotoUploader
              label="Fotografías de esta sección"
              photos={data.fotos || []}
              onChange={(fotos) => updateField("fotos", fotos)}
              maxPhotos={10}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Puedes subir hasta 10 fotos para esta sección.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
