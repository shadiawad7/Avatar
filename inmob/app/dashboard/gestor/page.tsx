"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { useBrandConfirm } from "@/components/brand-confirm-dialog"
import { useBrandToast } from "@/hooks/use-brand-toast"
import {
  BarChart3,
  Building2,
  FileText,
  ClipboardList,
  UserCheck,
  Mail,
  Phone,
  Plus,
  Download,
  Trash2,
  MessageSquare,
} from "lucide-react"

/* ======================= Tipos ======================= */

interface Informe {
  id: number
  estado: string
  coste_estimado_reparacion: number
  created_at: string
  direccion: string
  resumen_ejecutivo_texto: string
  ref_catastral: string
  tipo_propiedad: string
  inspector_nombre: string
  inspector_apellido: string
  tipo_informe?: string
  cliente_id?: number
}

interface InformeCompleto {
  informe?: {
    id: number
    estado: string
    coste_estimado_reparacion: number | null
    resumen_ejecutivo_texto: string
    created_at: string
    direccion: string
    ref_catastral: string
    tipo_propiedad: string
    inspector_nombre: string
    inspector_apellido: string
    tipo_informe?: string
  }
  inmueble?: {
    direccion: string | null
    ref_catastral: string | null
    anno_construccion: number | null
    metros_cuadrados: number | null
    orientacion: string | null
    tipo_propiedad: string | null
    planta: string | null
    parcela: string | null
    fotos?: string[]
    ampliado_reformado?: boolean | null
    cambio_uso?: boolean | null
    ventilacion_cruzada?: boolean | null
    ventilacion_general?: boolean | null
    iluminacion?: string | null
  }
  servicios?: {
    agua: boolean
    gas: boolean
    electricidad: boolean
    internet: boolean
    gasoil: boolean
    renovables: boolean
  }
  inspector?: {
    nombre: string | null
    apellido: string | null
    num_colegiado: string | null
    fecha_inspeccion: string | null
    titulacion: string | null
    contacto?: string | null
  }
  condiciones_inspeccion?: {
    tiempo_atmosferico: string | null
    temp_ambiente: string | null
    lluvia_ultimos_3d: boolean | null
    zona_ruidosa: boolean | null
    trafico: string | null
    sup_exterior: string | null
  }
  informacion_general?: {
    descripcion_general_texto: string | null
    fachadas_estado: string | null
    puerta_entrada_estado: string | null
    vestibulo_estado: string | null
    ascensor_estado: string | null
    posib_ascensor: boolean | null
    patio_luces_estado: string | null
    patio_ventilacion_estado: string | null
    jardines_estado: string | null
    fotos?: string[]
  }
  estructura?: {
    vertical?: {
      tipo_estructura_vertical: string | null
      tipo_muros_carga: string | null
      patologias_estructura_vertical: string | null
      fotos?: string[]
    }
    horizontal?: {
      tipo_vigas: string | null
      patologias_vigas: string | null
      tipo_viguetas: string | null
      patologias_viguetas: string | null
      fotos?: string[]
    }
    forjados?: {
    patologias_forjados: string | null
    tiene_desniveles: boolean | null
    }
    soleras_losas?: {
      tiene_soleras : boolean | null
      patologias_soleras_losas : string | null
      desniveles : boolean | null
      tiene_capilaridades : boolean | null
    }
    voladizos?: {
      patologias_voladizos : string | null
    }
    cubiertas?: {
      tipo_cubierta: string | null
      acabado: string | null
      cubierta_ventilada: boolean | null
      tiene_aislamiento: boolean | null
      impermeabilizacion: boolean | null
      patologias_cubiertas?: string | null
      aislamiento_estado_texto?: string | null
      impermeabilizacion_estado_texto?: string | null
      subtipo: string | null
      fotos?: string[]
    }
    carpinterias?: {
      fotos?: string[]
    }
  }
  instalaciones?: {
    electrica?: {
      tiene_instalacion: boolean | null
      cuadro_en_norma: boolean | null
      toma_tierra: boolean | null
      canalizaciones?: string | null
      cajas_empalme_estado?: string | null
      cableado_exterior?: string | null
      cableado_interior?: string | null
      observaciones_texto?: string | null
      fotos?: string[]
    }
    agua_acs?: {
      dispone_acs: boolean | null
      tipo_acs: string | null
      extraccion_acs?: string | null
      llave_paso_general?: boolean | null
      llave_paso_estado?: string | null
      tuberias_empotradas?: boolean | null
      material_tuberias?: string | null
      bajantes?: string | null
      arquetas?: string | null
      observaciones_texto?: string | null
      fotos?: string[]
    }
    calefaccion?: {
      dispone_calefaccion: boolean | null
      tipo_calefaccion: string | null
      sistema_normativa?: boolean | null
      estado_caldera?: string | null
      tuberias_calefaccion?: string | null
      tuberias_empotradas?: boolean | null
      tipo_emisor?: string | null
      extraccion_calefaccion?: string | null
      observaciones_texto?: string | null
      fotos?: string[]
    }
  }
  jardin?: {
    descripcion_corta?: string | null
    cesped?: string | null
    arboles?: string | null
    riego_automatico?: boolean | null
    iluminacion_exterior?: string | null
    piscina?: string | null
    zona_barbacoa?: string | null
    pergola_porche?: string | null
    observaciones_texto?: string | null
    fotos?: string[]
  }
  estancias_salon?: {
  estado_general?: string | null
  pavimento?: string | null
  paredes_techos?: string | null
  ventanas_carpinteria?: string | null
  ventilacion_natural?: boolean | null
  iluminacion_natural?: boolean | null
  observaciones_texto?: string | null
}

estancias_cocina?: {
  estado_general?: string | null
  encimera_mobiliario?: string | null
  campana_extractora?: string | null
  elec_adecuada?: boolean | null
  salida_humos?: boolean | null
  ventilacion_natural?: boolean | null
  griferia_fregadero?: string | null
  revestimientos?: string | null
  observaciones_texto?: string | null
}

estancias_dormitorio?: {
  estado_general?: string | null
  pavimento?: string | null
  paredes_techos?: string | null
  ventanas_aislamiento?: string | null
  ventilacion_natural?: boolean | null
  iluminacion_natural?: boolean | null
  humedades?: boolean | null
  observaciones_texto?: string | null
}

estancias_bano?: {
  estado_general?: string | null
  revestimientos?: string | null
  fontaneria_sanitarios?: string | null
  ventilacion?: string | null
  humedades_filtraciones?: boolean | null
  elec_adecuada?: boolean | null
  observaciones_texto?: string | null
}

estancias_terraza?: {
  tipo_terraza?: string | null
  pavimento_exterior?: string | null
  barandilla_estado?: string | null
  impermeabilizacion?: boolean | null
  grietas_fisuras?: boolean | null
  observaciones_texto?: string | null
}

estancias_garaje?: {
  estado_general?: string | null
  pavimento?: string | null
  paredes_techos?: string | null
  ventilacion?: boolean | null
  iluminacion?: boolean | null
  puerta_modo?: string | null
  filtraciones?: boolean | null
  observaciones_texto?: string | null
}

estancias_sotano?: {
  estado_general?: string | null
  humedad?: boolean | null
  ventilacion?: boolean | null
  iluminacion?: boolean | null
  revestimientos?: string | null
  uso_actual?: string | null
  observaciones_texto?: string | null
}


  eficiencia?: {
    certificado_energetico?: string | null
    calificacion_energetica?: string | null
    consumo_anual_estimado?: string | null
  }
  siguientes_pasos?: {
    reparaciones_urgentes?: string | null
    reparaciones_recomendadas?: string | null
    mantenimiento_preventivo?: string | null
    mejoras_sugeridas?: string | null
    obtener_presupuestos_texto?: string | null
    estudios_complementarios_texto?: string | null
    descripcion_servicio_texto?: string | null
    consejos_antes_comprar_texto?: string | null
    consejos_mantenimiento_texto?: string | null
  }
}

interface Asignacion {
  id: number
  informe_id: number
  arquitecto_id: number
  cliente_id: number | null
  notas: string | null
  estado: "pendiente" | "aceptada" | "rechazada"
  fecha_asignacion?: string | null
  created_at: string
  updated_at: string
  fecha_respuesta?: string | null
  informe_direccion?: string
  arquitecto_nombre?: string
  arquitecto_apellido?: string
}

interface Arquitecto {
  id: number
  nombre: string
  apellido: string
  email: string
}

interface MensajeContacto {
  id: number
  cliente_id: number
  cliente_nombre: string
  cliente_apellido: string
  cliente_email: string
  asunto: string
  mensaje: string
  estado: "pendiente" | "respondido" | "rechazado" | "en_proceso"
  fecha_creacion: string
  fecha_respuesta?: string | null
}

interface Cliente {
  id: number
  nombre: string
  apellido: string
  email: string
}

/* =================== Helpers para PDF (solo JPG/PNG) =================== */
async function blobToDataURL(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onloadend = () => resolve(fr.result as string)
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(blob)
  })
}

async function fetchImageIfSupported(url: string): Promise<{ dataUrl: string; format: "JPEG" | "PNG" }> {
  const resp = await fetch(url, { cache: "no-store" })
  if (!resp.ok) throw new Error(`HTTP ${resp.status} al descargar ${url}`)
  const blob = await resp.blob()
  const type = (blob.type || "").toLowerCase()

  const isJpeg = type.includes("jpeg") || type.includes("jpg")
  const isPng = type.includes("png")

  if (!isJpeg && !isPng) throw new Error(`Formato no soportado: ${type || "desconocido"}`)

  const dataUrl = await blobToDataURL(blob)
  return { dataUrl, format: isPng ? "PNG" : "JPEG" }
}

/* ======================= Página ======================= */
export default function GestorDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const brandConfirm = useBrandConfirm()
  const brandToast = useBrandToast()
  const [activeTab, setActiveTab] = useState("informes")
  const [informes, setInformes] = useState<Informe[]>([])
  const [loading, setLoading] = useState(true)

  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [arquitectos, setArquitectos] = useState<Arquitecto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [mensajes, setMensajes] = useState<MensajeContacto[]>([])
  const [_selectedInforme, _setSelectedInforme] = useState<number | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null)
  const [selectedArquitecto, setSelectedArquitecto] = useState<number | null>(null)
  const [notasAsignacion, setNotasAsignacion] = useState("")

  useEffect(() => {
    const fetchInformes = async () => {
      try {
        const response = await fetch("/api/informes")
        if (response.ok) {
          const data = await response.json()
          setInformes(data.informes)
        }
      } catch (error) {
        console.error("[v0] Error al cargar informes:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInformes()
  }, [])

  useEffect(() => {
    const fetchAsignaciones = async () => {
      try {
        const response = await fetch("/api/asignaciones")
        if (response.ok) {
          const data = await response.json()
          setAsignaciones(data.asignaciones)
        }
      } catch (error) {
        console.error("[v0] Error al cargar asignaciones:", error)
      }
    }
    fetchAsignaciones()
  }, [])

  useEffect(() => {
    const fetchArquitectos = async () => {
      try {
        const response = await fetch("/api/arquitectos")
        if (response.ok) {
          const data = await response.json()
          setArquitectos(data.arquitectos || [])
        }
      } catch (error) {
        console.error("[v0] Error al cargar arquitectos:", error)
      }
    }
    fetchArquitectos()
  }, [])

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("/api/clientes")
        if (response.ok) {
          const data = await response.json()
          setClientes(data.clientes || [])
        }
      } catch (error) {
        console.error("[v0] Error al cargar clientes:", error)
      }
    }
    fetchClientes()
  }, [])

  useEffect(() => {
    const fetchMensajes = async () => {
      try {
        const response = await fetch("/api/contacto")
        if (response.ok) {
          const data = await response.json()
          setMensajes(data.mensajes || [])
        }
      } catch (error) {
        console.error("[v0] Error al cargar mensajes:", error)
      }
    }
    fetchMensajes()
  }, [])

  const totalInformes = informes.length
  const totalAsignaciones = asignaciones.length
  const asignacionesPendientes = asignaciones.filter((a) => a.estado === "pendiente").length
  const asignacionesAceptadas = asignaciones.filter((a) => a.estado === "aceptada").length

  const handleNuevoInforme = () => router.push("/dashboard/gestor/nuevo-informe")
  const handleVerInforme = (id: number) => router.push(`/dashboard/gestor/informes/${id}`)

  const handleCrearAsignacion = async () => {
    if (!selectedCliente || !selectedArquitecto) {
      brandToast.info("Selecciona un cliente y un arquitecto antes de crear la asignación.")
      return
    }

    try {
      const response = await fetch("/api/asignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: selectedCliente,
          arquitecto_id: selectedArquitecto,
          notas: notasAsignacion,
          estado: "pendiente",
        }),
      })

      if (response.ok) {
        brandToast.success("Asignación creada correctamente.")
        const data = await response.json()
        setAsignaciones([...asignaciones, data.asignacion])
        setSelectedCliente(null)
        setSelectedArquitecto(null)
        setNotasAsignacion("")
      } else {
        let errorMessage = "Error al crear asignación"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {}
        brandToast.error(errorMessage)
      }
    } catch (error) {
      console.error("[v0] Error al crear asignación:", error)
      brandToast.error("Ocurrió un error al crear la asignación.")
    }
  }

  const handleDescargarPDF = async (informe: Informe) => {
    try {
      const response = await fetch(`/api/informes/${informe.id}`)
      if (!response.ok) throw new Error("Error al obtener datos del informe")
      const informeCompleto: InformeCompleto = await response.json()
      const jsPDF = (await import("jspdf")).default

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      // Paleta
      const colors = {
        primary: [45, 69, 71], // #2d4547
        headerBand: [45, 69, 71],
        text: [45, 69, 71],
        gray: [45, 69, 71],
        accent: [253, 180, 155], // #fdb49b
        white: [255, 255, 255],
      }

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const M = 16
      const bottomMargin = 25
      const titleBandHeight = 13 // el addSectionTitle retorna y + 13
      const bandHeight = 18

      const fmt = (v: any) => {
        if (v === null || v === undefined || v === "") return "-"
        if (typeof v === "boolean") return v ? "Sí" : "No"
        if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
          const d = new Date(v)
          if (!isNaN(d.getTime())) return d.toLocaleDateString("es-ES")
        }
        return String(v)
      }

      // ===== Helpers =====
      let pageNum = 1

      const drawPageBackground = (n: number) => {
        if (n === 1) return

        pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
        pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2])
        pdf.rect(0, 0, pageW, pageH, "F")
      }

      const addHeaderFooter = (n: number) => {
        drawPageBackground(n)

        pdf.setFillColor(`rgb(${colors.primary.join(", ")})`)
        pdf.rect(0, 0, pageW, 12, "F")
        pdf.setTextColor(255, 255, 255)
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(9)
        pdf.text("INFORME INSPECCIÓN DE INMUEBLE", M, 8)
        pdf.text(`INF-${informe.id}`, pageW - M, 8, { align: "right" })

        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(`rgb(${colors.white.join(", ")})`)
        pdf.setFontSize(8)
        pdf.text(`Página ${n}`, pageW / 2, pageH - 8, { align: "center" })
      }

      const addSectionTitle = (title: string, y: number) => {
        pdf.setFillColor(`rgb(${colors.white.join(", ")})`)
        pdf.rect(M, y, pageW - M * 2, 9, "F")
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(`rgb(${colors.primary.join(", ")})`)
        pdf.setFontSize(12)
        pdf.text(title, M + 2, y + 6.5)
        return y + titleBandHeight
      }

      const ensureSpace = (y: number, minBlock: number) => {
        if (y + minBlock > pageH - bottomMargin) {
          pdf.addPage()
          pageNum++
          addHeaderFooter(pageNum)
          return 20
        }
        return y
      }

      // ===== Render de fotos (título + al menos 1 fila juntos) =====
      const renderPhotos = async (photos: string[] | undefined | null, y: number) => {
        if (!photos || photos.length === 0) return y
        const w = 80
        const h = 60
        const gap = 6
        const titleHeight = 5

        let x = M
        let yPos = ensureSpace(y, titleHeight + h)

        // Título
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(`rgb(${colors.white.join(", ")})`)
        pdf.text("Fotografías", M, yPos)
        yPos += titleHeight

        for (let i = 0; i < photos.length; i++) {
          if (x + w > pageW - M) {
            x = M
            yPos += h + gap
          }

          // ¿Cabe la fila actual?
          if (yPos + h > pageH - bottomMargin) {
            pdf.addPage()
            pageNum++
            addHeaderFooter(pageNum)
            yPos = 20

            pdf.setFont("helvetica", "bold")
            pdf.setTextColor(`rgb(${colors.white.join(", ")})`)
            pdf.text("Fotografías", M, yPos)
            yPos += titleHeight

            x = M
          }

          try {
            const { dataUrl, format } = await fetchImageIfSupported(photos[i])
            pdf.addImage(dataUrl, format, x, yPos, w, h)
          } catch (error) {
            console.warn("[pdf] Foto omitida (no JPG/PNG o error de carga):", photos[i], error)
          }

          x += w + gap
        }

        return yPos + h + 6
      }


      // Calcula la altura real de UNA fila (primer slice) con el mismo cálculo que twoRowBandGrid
function measureRowHeight(
  pdf: any,
  itemsSlice: Array<{ label: string; value: any }>,
  perRow: number,
  pageW: number,
  M: number,
  colGap: number,
  fontSize: number
) {
  const scale = pdf.internal?.scaleFactor || 1
  const usableW = pageW - M * 2
  const colW = (usableW - (perRow - 1) * colGap) / perRow

  pdf.setFontSize(fontSize)
  const oneLineH =
    typeof pdf.getLineHeight === "function"
      ? pdf.getLineHeight() / scale
      : (fontSize * 1.2) / scale

  const labelTopPad = 6
  const valueTopPad = 12
  const sidePad = 2
  const bottomPad = 4

  const fmt = (v: any) => {
    if (v === null || v === undefined || v === "") return "-"
    if (typeof v === "boolean") return v ? "Sí" : "No"
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d.toLocaleDateString("es-ES")
    }
    return String(v)
  }

  // nº líneas del valor más alto en la fila
  let maxLines = 1
  for (const it of itemsSlice) {
    const v = fmt(it.value)
    const lines = pdf.splitTextToSize(v, colW - sidePad * 2) as string[]
    maxLines = Math.max(maxLines, Math.max(1, lines.length))
  }

  // misma fórmula que usas en twoRowBandGrid
  const rowHeight = oneLineH + (valueTopPad - labelTopPad) + maxLines * oneLineH + bottomPad
  return rowHeight
}


      // Renderizador de sección (asegura título + 1 banda juntos)
      const renderSectionGrid = (
  yStart: number,
  title: string,
  items: Array<{ label: string; value: any }>,
  perRow: number
) => {
  if (!items || items.length === 0) return yStart
  if (!perRow || perRow < 1) perRow = 1

  // === calcular altura real de la PRIMERA fila ===
  const fontSize = 10
  const colGap = 8
  const firstSlice = items.slice(0, perRow)
  const firstRowH = measureRowHeight(pdf, firstSlice, perRow, pageW, M, colGap, fontSize)

  // altura del título (tu banda)
  const titleH = titleBandHeight

  // asegura que caben título + primera fila JUNTOS
  let yLocal = ensureSpace(yStart, titleH + firstRowH)

  // ahora sí, pinta el título y el grid completo
  yLocal = addSectionTitle(title, yLocal)
  yLocal = twoRowBandGrid(
    yLocal,
    items,
    perRow,
    pdf,
    pageW,
    pageH,
    M,
    colors,
    addHeaderFooter,
    () => (pageNum += 1),
    bottomMargin
  )
  return yLocal
}


      // ===== Portada =====
      pdf.setFillColor(`rgb(${colors.primary.join(", ")})`)
      pdf.rect(0, 0, pageW, pageH, "F")

      pdf.setTextColor(255, 255, 255)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(42)
      pdf.text("Informe", M, 70)
      pdf.text("de Inspección", M, 95)
      pdf.text("de Inmueble", M, 120)

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(16)
      pdf.text(informeCompleto.inmueble?.direccion || "Dirección no especificada", M, 145)

      // ===== Página de contenido =====
      pdf.addPage()
      pageNum++
      addHeaderFooter(pageNum)
      let y = 20

      // 0. Datos del informe
      const inf = informeCompleto.informe
      if (inf) {
        y = renderSectionGrid(y, "1. Datos del Informe", [
          { label: "Fecha creación", value: inf.created_at },
          { label: "Resumen ejecutivo", value: inf.resumen_ejecutivo_texto },
        ], 2)
      }

      // 1. Datos del Inmueble
      const inm = informeCompleto.inmueble
      if (inm) {
        y = renderSectionGrid("".length || y, "2. Datos del Inmueble", [
          { label: "Dirección", value: inm.direccion },
          { label: "Ref. catastral", value: inm.ref_catastral },
          { label: "Año construcción", value: inm.anno_construccion },
          { label: "Superficie", value: inm.metros_cuadrados ? `${inm.metros_cuadrados} m²` : null },
          { label: "Orientación", value: inm.orientacion },
          { label: "Tipo propiedad", value: inm.tipo_propiedad },
          { label: "Planta", value: inm.planta },
          { label: "Parcela", value: inm.parcela },
          { label: "Ampliado/Reformado", value: inm.ampliado_reformado },
          { label: "Cambio de uso", value: inm.cambio_uso },
          { label: "Vent. cruzada", value: inm.ventilacion_cruzada },
          { label: "Vent. general", value: inm.ventilacion_general },
          { label: "Iluminación", value: inm.iluminacion },
        ], 3)
        y += 10
        y = await renderPhotos(inm.fotos, y)
      }

      // 2. Datos del Inspector
      const insp = informeCompleto.inspector
      if (insp) {
        y = renderSectionGrid(y, "3. Datos del Inspector", [
          { label: "Nombre", value: [insp.nombre, insp.apellido].filter(Boolean).join(" ") || insp.nombre },
          { label: "Fecha inspección", value: insp.fecha_inspeccion },
          { label: "Contacto", value: insp.contacto },
          { label: "Nº colegiado", value: insp.num_colegiado },
          { label: "Titulación", value: insp.titulacion },
        ], 3)
      }

      // 3. Información General
      const info = informeCompleto.informacion_general
      if (info) {
        y = renderSectionGrid(y, "4. Información General", [
          { label: "Puerta entrada", value: info.puerta_entrada_estado },
          { label: "Patio de luces", value: info.patio_luces_estado },
          { label: "Patio de ventilación", value: info.patio_ventilacion_estado },
          { label: "Ascensor", value: info.ascensor_estado },
          { label: "Vestíbulo", value: info.vestibulo_estado },
          { label: "Fachadas", value: info.fachadas_estado },
          { label: "Jardines", value: info.jardines_estado },
          { label: "Posib. ascensor", value: info.posib_ascensor },
          { label: "Descripción general", value: info.descripcion_general_texto },
        ], 3)
        y += 10
        y = await renderPhotos(info.fotos, y)
      }

      // 4. Servicios
      if (informeCompleto.servicios) {
        y = renderSectionGrid(y, "5. Servicios", [
          { label: "Agua", value: informeCompleto.servicios.agua },
          { label: "Gas", value: informeCompleto.servicios.gas },
          { label: "Electricidad", value: informeCompleto.servicios.electricidad },
          { label: "Internet", value: informeCompleto.servicios.internet },
          { label: "Gasoil", value: informeCompleto.servicios.gasoil },
          { label: "Renovables", value: informeCompleto.servicios.renovables },
        ], 3)
      }

      // 5. Condiciones de la inspección (con fallback)
      const condiciones =
        (informeCompleto as any).condiciones_inspeccion ??
        (informeCompleto as any).condiciones
      if (condiciones) {
        const c = condiciones
        y = renderSectionGrid(y, "6. Condiciones de la inspección", [
          { label: "Temp. Amb.", value: c.temp_ambiente },
          { label: "Lluvia ult. 3d", value: c.lluvia_ultimos_3d },
          { label: "T. Atmosf.", value: c.tiempo_atmosferico },
          { label: "Zona ruidosa", value: c.zona_ruidosa },
          { label: "Sup. Exterior", value: c.sup_exterior },
          { label: "Tráfico", value: c.trafico },
        ], 3)
      }

      // 6. Estructura
      if (informeCompleto.estructura) {
        const ev = informeCompleto.estructura.vertical
        if (ev) {
          y = renderSectionGrid(y, "7. Estructura Vertical", [
            { label: "Tipo estructura vertical", value: ev.tipo_estructura_vertical },
            { label: "Muros de carga", value: ev.tipo_muros_carga },
            { label: "Patologías", value: ev.patologias_estructura_vertical },
          ], 3)
          y += 10
          y = await renderPhotos(ev.fotos, y)
          y += 10
        }

        const eh = informeCompleto.estructura.horizontal
        if (eh) {
          y = renderSectionGrid(y, "8. Estructura Horizontal", [
            { label: "Tipo vigas", value: eh.tipo_vigas },
            { label: "Patologías vigas", value: eh.patologias_vigas },
            { label: "Tipo viguetas", value: eh.tipo_viguetas },
            { label: "Patologías viguetas", value: eh.patologias_viguetas },
          ], 4)
          y += 10
          y = await renderPhotos(eh.fotos, y)
        }

        const fs = informeCompleto.estructura.forjados
        if (fs) {
          y = renderSectionGrid(y, "9. Forjados", [
            { label: "Tiene Desniveles", value: fs.tiene_desniveles },
            { label: "Patologías en Forjados", value: fs.patologias_forjados },
          ], 2)
        }

        const sl = informeCompleto.estructura.soleras_losas
        if (sl) {
          y = renderSectionGrid(y, "10. soleras_losas", [
            { label: "Tiene_soleras", value: sl.tiene_soleras },
            { label: "Patologias_soleras_losas", value: sl.patologias_soleras_losas },
            { label: "desniveles", value: sl.desniveles },
            { label: "tiene_capilaridades", value: sl.tiene_capilaridades },
          ], 2)
        }

        const vs = informeCompleto.estructura.voladizos
        if (vs) {
          y = renderSectionGrid(y, "11. voladizos", [
            { label: "patologias_voladizos", value: vs.patologias_voladizos },
          ], 2)
        }

        const cu = informeCompleto.estructura.cubiertas
        if (cu) {
          y = renderSectionGrid(y, "12. Estructura Cubiertas", [
            { label: "Tipo cubierta", value: cu.tipo_cubierta },
            { label: "Acabado", value: cu.acabado },
            { label: "Cubierta ventilada", value: cu.cubierta_ventilada },
            { label: "Aislamiento", value: cu.tiene_aislamiento },
            { label: "Impermeabilización", value: cu.impermeabilizacion },
            { label: "Subtipo", value: cu.subtipo },
            { label: "Estado del Aislamiento", value: cu.aislamiento_estado_texto },
            { label: "Estado de Impermeabilización", value: cu.impermeabilizacion_estado_texto },
          ], 3)
          y += 10
          y = await renderPhotos(cu.fotos, y)
        }
      }

      // 7. Instalaciones
      if (informeCompleto.instalaciones) {
        const el = informeCompleto.instalaciones.electrica
        if (el) {
          y = renderSectionGrid(y, "13. Instalaciones Eléctrica", [
            { label: "Tiene instalación", value: el.tiene_instalacion },
            { label: "Cuadro en norma", value: el.cuadro_en_norma },
            { label: "Toma de tierra", value: el.toma_tierra },
            { label: "Canalizaciones", value: el.canalizaciones },
            { label: "Cajas empalme", value: el.cajas_empalme_estado },
            { label: "Cableado exterior", value: el.cableado_exterior },
            { label: "Cableado interior", value: el.cableado_interior },
            { label: "Observaciones", value: el.observaciones_texto },
          ], 3)
          y += 10
          y = await renderPhotos(el.fotos, y)
        }

        const ag = informeCompleto.instalaciones.agua_acs
        if (ag) {
          y = renderSectionGrid(y, "14. Instalaciones Agua y ACS", [
            { label: "Dispone ACS", value: ag.dispone_acs },
            { label: "Tipo ACS", value: ag.tipo_acs },
            { label: "Extracción ACS", value: ag.extraccion_acs },
            { label: "Llave paso gral.", value: ag.llave_paso_general },
            { label: "Estado llave", value: ag.llave_paso_estado },
            { label: "Tuberías empotradas", value: ag.tuberias_empotradas },
            { label: "Material tuberías", value: ag.material_tuberias },
            { label: "Bajantes", value: ag.bajantes },
            { label: "Arquetas", value: ag.arquetas },
            { label: "Observaciones", value: ag.observaciones_texto },
          ], 3)
          y += 10
          y = await renderPhotos(ag.fotos, y)
        }

        const ca = informeCompleto.instalaciones.calefaccion
        if (ca) {
          y = renderSectionGrid(y, "15. Instalaciones Calefacción", [
            { label: "Dispone calefacción", value: ca.dispone_calefaccion },
            { label: "Tipo calefacción", value: ca.tipo_calefaccion },
            { label: "En normativa", value: ca.sistema_normativa },
            { label: "Estado caldera", value: ca.estado_caldera },
            { label: "Tuberías calefacción", value: ca.tuberias_calefaccion },
            { label: "Tuberías empotradas", value: ca.tuberias_empotradas },
            { label: "Tipo emisor", value: ca.tipo_emisor },
            { label: "Extracción", value: ca.extraccion_calefaccion },
            { label: "Observaciones", value: ca.observaciones_texto },
          ], 3)
          y += 10
          y = await renderPhotos(ca.fotos, y)
        }
      }

      // 16. Jardín
      if (informeCompleto.jardin) {
        const j = informeCompleto.jardin as any
        y = renderSectionGrid(y, "16. Jardín y Exteriores", [
          { label: "Descripción", value: j.descripcion_corta },
          { label: "Césped", value: j.cesped },
          { label: "Árboles", value: j.arboles },
          { label: "Riego automático", value: j.riego_automatico },
          { label: "Iluminación exterior", value: j.iluminacion_exterior },
          { label: "Piscina", value: j.piscina },
          { label: "Zona barbacoa", value: j.zona_barbacoa },
          { label: "Pérgola/Porche", value: j.pergola_porche },
          { label: "observaciones", value: j.observaciones_texto },
        ], 3)
        y += 10
        y = await renderPhotos(j.fotos, y)
      }

      // 17. Salón
if (informeCompleto.estancias_salon) {
  const s = informeCompleto.estancias_salon as any
  y = renderSectionGrid(y, "17. Salón", [
    { label: "Estado general", value: s.estado_general },
    { label: "Pavimento", value: s.pavimento },
    { label: "Paredes y techos", value: s.paredes_techos },
    { label: "Ventanas / Carpintería", value: s.ventanas_carpinteria },
    { label: "Ventilación natural", value: s.ventilacion_natural },
    { label: "Iluminación natural", value: s.iluminacion_natural },
    { label: "Observaciones", value: s.observaciones_texto },
  ], 3)
  y += 10
  y = await renderPhotos(s.fotos, y)
}

// 18. Cocina
if (informeCompleto.estancias_cocina) {
  const c = informeCompleto.estancias_cocina as any
  y = renderSectionGrid(y, "18. Cocina", [
    { label: "Estado general", value: c.estado_general },
    { label: "Encimera y mobiliario", value: c.encimera_mobiliario },
    { label: "Campana extractora", value: c.campana_extractora },
    { label: "Instalación eléctrica adecuada", value: c.elec_adecuada },
    { label: "Salida de humos", value: c.salida_humos },
    { label: "Ventilación natural", value: c.ventilacion_natural },
    { label: "Grifería / Fregadero", value: c.griferia_fregadero },
    { label: "Revestimientos", value: c.revestimientos },
    { label: "Observaciones", value: c.observaciones_texto },
  ], 3)
  y += 10
  y = await renderPhotos(c.fotos, y)
}

// 19. Dormitorio
if (informeCompleto.estancias_dormitorio) {
  const d = informeCompleto.estancias_dormitorio as any
  y = renderSectionGrid(y, "19. Dormitorio", [
    { label: "Estado general", value: d.estado_general },
    { label: "Pavimento", value: d.pavimento },
    { label: "Paredes y techos", value: d.paredes_techos },
    { label: "Ventanas / Aislamiento", value: d.ventanas_aislamiento },
    { label: "Ventilación natural", value: d.ventilacion_natural },
    { label: "Iluminación natural", value: d.iluminacion_natural },
    { label: "Humedades", value: d.humedades },
    { label: "Observaciones", value: d.observaciones_texto },
  ], 3)
  y += 10
  y = await renderPhotos(d.fotos, y)
}

// 20. Baño
if (informeCompleto.estancias_bano) {
  const b = informeCompleto.estancias_bano as any
  y = renderSectionGrid(y, "20. Baño", [
    { label: "Estado general", value: b.estado_general },
    { label: "Revestimientos", value: b.revestimientos },
    { label: "Fontanería y sanitarios", value: b.fontaneria_sanitarios },
    { label: "Ventilación", value: b.ventilacion },
    { label: "Humedades / Filtraciones", value: b.humedades_filtraciones },
    { label: "Instalación eléctrica adecuada", value: b.elec_adecuada },
    { label: "Observaciones", value: b.observaciones_texto },
  ], 3)
  y += 10
  y = await renderPhotos(b.fotos, y)
}

// 21. Terraza
if (informeCompleto.estancias_terraza) {
  const t = informeCompleto.estancias_terraza as any
  y = renderSectionGrid(y, "21. Terraza", [
    { label: "Tipo de terraza", value: t.tipo_terraza },
    { label: "Pavimento exterior", value: t.pavimento_exterior },
    { label: "Estado de barandilla", value: t.barandilla_estado },
    { label: "Impermeabilización", value: t.impermeabilizacion },
    { label: "Grietas / Fisuras", value: t.grietas_fisuras },
    { label: "Observaciones", value: t.observaciones_texto },
  ], 3)
  y += 10
  y = await renderPhotos(t.fotos, y)
}

// 22. Garaje
if (informeCompleto.estancias_garaje) {
  const g = informeCompleto.estancias_garaje as any
  y = renderSectionGrid(y, "22. Garaje", [
    { label: "Estado general", value: g.estado_general },
    { label: "Pavimento", value: g.pavimento },
    { label: "Paredes y techos", value: g.paredes_techos },
    { label: "Ventilación", value: g.ventilacion },
    { label: "Iluminación", value: g.iluminacion },
    { label: "Modo de puerta", value: g.puerta_modo },
    { label: "Filtraciones", value: g.filtraciones },
    { label: "Observaciones", value: g.observaciones_texto },
  ], 3)
  y += 10
  y = await renderPhotos(g.fotos, y)
}

// 23. Sótano
if (informeCompleto.estancias_sotano) {
  const s = informeCompleto.estancias_sotano as any
  y = renderSectionGrid(y, "23. Sótano", [
    { label: "Estado general", value: s.estado_general },
    { label: "Humedad", value: s.humedad },
    { label: "Ventilación", value: s.ventilacion },
    { label: "Iluminación", value: s.iluminacion },
    { label: "Revestimientos", value: s.revestimientos },
    { label: "Uso actual", value: s.uso_actual },
    { label: "Observaciones", value: s.observaciones_texto },
  ], 3)
  y += 10
  y = await renderPhotos(s.fotos, y)
}


      // 24. Eficiencia
      if (informeCompleto.eficiencia) {
        const e = informeCompleto.eficiencia
        y = renderSectionGrid(y, "24. Eficiencia energética", [
          { label: "Certificado", value: e?.certificado_energetico },
          { label: "Calificación", value: e?.calificacion_energetica },
          { label: "Consumo anual", value: e?.consumo_anual_estimado },
        ], 3)
      }

      // 25. Siguientes Pasos
if (informeCompleto.siguientes_pasos) {
  const sp = informeCompleto.siguientes_pasos as any
  y = renderSectionGrid(y, "25. Siguientes Pasos", [
    { label: "Consejos antes de comprar", value: sp.consejos_antes_comprar_texto },
    { label: "Estudios complementarios", value: sp.estudios_complementarios_texto },
    { label: "Obtener presupuestos", value: sp.obtener_presupuestos_texto },
    { label: "Descripción del servicio", value: sp.descripcion_servicio_texto },
    { label: "Consejos de mantenimiento", value: sp.consejos_mantenimiento_texto },
  ], 2)
  y += 10
}


      // Coste
      if (y > pageH - 50) {
        pdf.addPage()
        pageNum++
        addHeaderFooter(pageNum)
        y = 20
      }
      const coste = informeCompleto.informe?.coste_estimado_reparacion ?? null
      if (coste !== null) {
        const cardH = 26
        pdf.setFillColor(`rgb(${colors.headerBand.join(", ")})`)
        pdf.roundedRect(M, y, pageW - 2 * M, cardH, 3, 3, "F")

        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(`rgb(${colors.white.join(", ")})`)
        pdf.setFontSize(11)
        pdf.text("Coste estimado de reparación de patologías", M + 4, y + 8)

        pdf.setTextColor(`rgb(${colors.white.join(", ")})`)
        pdf.setFontSize(20)
        pdf.text(`${Number(coste).toLocaleString("es-ES")} €`, M + 4, y + 20)

        pdf.setFillColor(`rgb(${colors.accent.join(", ")})`)
        pdf.roundedRect(pageW - M - 28, y + 4, 24, 18, 3, 3, "F")
        pdf.setFontSize(10)
        pdf.setTextColor(255, 255, 255)
        pdf.text("Total", pageW - M - 16, y + 15, { align: "center" })
      }

      pdf.save(`Informe-${informe.id}.pdf`)
    } catch (error) {
      console.error("[v0] Error generando PDF:", error)
      brandToast.error("No se pudo generar el PDF. Inténtalo nuevamente en unos segundos.")
    }
  }

  const twoRowBandGrid = (
  y: number,
  items: Array<{ label: string; value: any }>,
  perRow: number,
  pdf: any,
  pageW: number,
  pageH: number,
  M: number,
  colors: any,
  addHeaderFooter: (n: number) => void,
  incPage: () => void,
  bottomMargin: number = 25
) => {
  if (!items || items.length === 0) return y
  if (!perRow || perRow < 1) perRow = 1

  const fmt = (v: any) => {
    if (v === null || v === undefined || v === "") return "-"
    if (typeof v === "boolean") return v ? "Sí" : "No"
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d.toLocaleDateString("es-ES")
    }
    return String(v)
  }

  const usableW = pageW - M * 2
  const colGap = 8
  const colW = (usableW - (perRow - 1) * colGap) / perRow

  const fontSize = 10
  pdf.setFontSize(fontSize)
  const scale = pdf.internal?.scaleFactor || 1
  const oneLineH =
    typeof pdf.getLineHeight === "function"
      ? pdf.getLineHeight() / scale
      : (fontSize * 1.2) / scale

  const labelTopPad = 6
  const valueTopPad = 12
  const sidePad = 2
  const bottomPad = 4

  for (let i = 0; i < items.length; i += perRow) {
    const slice = items.slice(i, i + perRow)

    // 1) Medición de alturas (nº de líneas × altura de línea)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(fontSize)

    const valueLinesPerCell: string[][] = []
    const blockHeights: number[] = []

    for (const it of slice) {
      const v = fmt(it.value)
      const lines = pdf.splitTextToSize(v, colW - sidePad * 2) as string[]
      valueLinesPerCell.push(lines)
      blockHeights.push(Math.max(1, lines.length) * oneLineH)
    }

    const rowHeight = oneLineH + (valueTopPad - labelTopPad) + Math.max(...blockHeights, 0) + bottomPad

    // 2) Salto de página si no cabe la fila entera
    if (y + rowHeight > pageH - bottomMargin) {
      pdf.addPage()
      incPage()
      const n = typeof pdf.getNumberOfPages === "function" ? pdf.getNumberOfPages() : 1
      addHeaderFooter(n)
      y = 20
    }

    // 3) Etiquetas (centradas)
    pdf.setFont("helvetica", "bold")
    pdf.setTextColor(`rgb(${colors.white.join(", ")})`)
    pdf.setFontSize(fontSize)
    let x = M
    for (const it of slice) {
      const cx = x + colW / 2
      pdf.text(it.label, cx, y + labelTopPad, { align: "center" })
      x += colW + colGap
    }

    // 4) Valores (centrados y en varias líneas)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(`rgb(${colors.white.join(", ")})`)
    pdf.setFontSize(fontSize)
    x = M
    for (let idx = 0; idx < slice.length; idx++) {
      const lines = valueLinesPerCell[idx]
      const cx = x + colW / 2
      // aunque centramos, mantenemos el split al ancho de la columna
      pdf.text(lines, cx, y + valueTopPad, { align: "center" })
      x += colW + colGap
    }

    // 5) Avance vertical según altura real
    y += rowHeight
  }

  return y
}




  const handleEliminarInforme = async (id: number) => {
    const confirmed = await brandConfirm({
      title: "Eliminar informe",
      description: (
        <p>
          Esta acción eliminará de forma permanente el informe INF-{id}. La operación no se puede deshacer. ¿Deseas
          continuar?
        </p>
      ),
      confirmText: "Eliminar informe",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!confirmed) return

    try {
      const response = await fetch(`/api/informes/${id}`, { method: "DELETE" })
      if (response.ok) {
        brandToast.success(`Informe INF-${id} eliminado correctamente.`)
        setInformes(informes.filter((inf) => inf.id !== id))
      } else {
        const error = await response.json()
        brandToast.error(`Error al eliminar el informe: ${error.error || "Motivo desconocido"}.`)
      }
    } catch (error) {
      console.error("[v0] Error al eliminar informe:", error)
      brandToast.error("Ocurrió un error al eliminar el informe.")
    }
  }

  const handleAceptarMensaje = async (mensajeId: number) => {
    try {
      const response = await fetch(`/api/contacto`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mensajeId, estado: "respondido" }),
      })
      if (response.ok) {
        brandToast.success("Mensaje marcado como respondido.")
        const payload = await response.json().catch(() => null)
        const updatedMensaje = payload?.mensaje as MensajeContacto | undefined
        setMensajes((prev) =>
          prev.map((m) =>
            m.id === mensajeId
              ? {
                  ...m,
                  ...(updatedMensaje || {}),
                  estado: "respondido",
                  fecha_respuesta: updatedMensaje?.fecha_respuesta ?? new Date().toISOString(),
                }
              : m,
          ),
        )
      } else {
        const err = await response.json().catch(() => ({}))
        brandToast.error(err?.error || "No se pudo actualizar el mensaje.")
      }
    } catch (error) {
      console.error("[v0] Error al actualizar mensaje:", error)
      brandToast.error("Ocurrió un error al actualizar el mensaje.")
    }
  }

  const handleRechazarMensaje = async (mensajeId: number) => {
    const confirmed = await brandConfirm({
      title: "Rechazar mensaje",
      description: <p>El mensaje quedará marcado como rechazado y se notificará al remitente. ¿Confirmas la acción?</p>,
      confirmText: "Rechazar mensaje",
      cancelText: "Cancelar",
      tone: "danger",
    })
    if (!confirmed) return

    try {
      const response = await fetch(`/api/contacto`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mensajeId, estado: "rechazado" }),
      })
      if (response.ok) {
        brandToast.success("Mensaje marcado como rechazado.")
        const payload = await response.json().catch(() => null)
        const updatedMensaje = payload?.mensaje as MensajeContacto | undefined
        setMensajes((prev) =>
          prev.map((m) =>
            m.id === mensajeId
              ? {
                  ...m,
                  ...(updatedMensaje || {}),
                  estado: "rechazado",
                  fecha_respuesta: updatedMensaje?.fecha_respuesta ?? new Date().toISOString(),
                }
              : m,
          ),
        )
      } else {
        const err = await response.json().catch(() => ({}))
        brandToast.error(err?.error || "No se pudo actualizar el mensaje.")
      }
    } catch (error) {
      console.error("[v0] Error al actualizar mensaje:", error)
      brandToast.error("Ocurrió un error al actualizar el mensaje.")
    }
  }

  return (
    <DashboardLayout title="Panel de Gestor" roleLabel="Gestor">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="informes">Informes</TabsTrigger>
          <TabsTrigger value="asignacion">Asignación</TabsTrigger>
          <TabsTrigger value="asignaciones">Asignaciones</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="informes" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 max-w-md">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Informes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInformes}</div>
                <p className="text-xs text-muted-foreground mt-1">Informes en el sistema</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Informes</CardTitle>
                <CardDescription>Todos los informes en el sistema</CardDescription>
              </div>
              <Button onClick={handleNuevoInforme}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Informe
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando informes...</div>
              ) : informes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay informes todavía. Haz clic en "Añadir Informe" para crear uno.
                </div>
              ) : (
                <div className="space-y-4">
                  {informes.map((informe) => (
                    <div key={informe.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">INF-{informe.id}</span>
                          <Badge
                            variant={
                              informe.estado === "completo"
                                ? "default"
                                : informe.estado === "en_progreso"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {informe.estado === "completo"
                              ? "Completado"
                              : informe.estado === "en_progreso"
                                ? "En Progreso"
                                : "Borrador"}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{informe.direccion || "Sin dirección"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {informe.inspector_nombre && informe.inspector_apellido
                            ? `Por ${informe.inspector_nombre} ${informe.inspector_apellido}`
                            : "Sin inspector asignado"}{" "}
                          • {new Date(informe.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDescargarPDF(informe)}
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleVerInforme(informe.id)}>
                          Ver Detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEliminarInforme(informe.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Eliminar informe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asignacion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Asignación</CardTitle>
              <CardDescription>Asignar un cliente a un arquitecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedCliente === null ? "" : selectedCliente}
                  onChange={(e) => setSelectedCliente(e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido} - {cliente.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Arquitecto</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedArquitecto === null ? "" : selectedArquitecto}
                  onChange={(e) => setSelectedArquitecto(e.target.value === "" ? null : Number(e.target.value))}
                >
                  <option value="">Seleccionar arquitecto...</option>
                  {arquitectos.map((arq) => (
                    <option key={arq.id} value={arq.id}>
                      {arq.nombre} {arq.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Instrucciones adicionales..."
                  value={notasAsignacion}
                  onChange={(e) => setNotasAsignacion(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleCrearAsignacion}>
                Crear Asignación
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nuevas Asignaciones</CardTitle>
              <CardDescription>Asignaciones creadas recientemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asignaciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay asignaciones todavía</div>
                ) : (
                  asignaciones.map((asignacion) => (
                    <div key={asignacion.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">CLT-{asignacion.cliente_id}</span>
                          <Badge
                            variant={
                              asignacion.estado === "aceptada"
                                ? "default"
                                : asignacion.estado === "pendiente"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {asignacion.estado === "aceptada"
                              ? "Aceptada"
                              : asignacion.estado === "pendiente"
                                ? "Pendiente"
                                : "Rechazada"}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">
                          {asignacion.arquitecto_nombre} {asignacion.arquitecto_apellido}
                        </h4>
                        <p className="text-sm text-muted-foreground">Cliente: {asignacion.cliente_id}</p>
                        {asignacion.notas && (
                          <p className="text-sm text-muted-foreground mt-1">Notas: {asignacion.notas}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asignaciones Aceptadas</CardTitle>
              <CardDescription>Solicitudes aceptadas por arquitectos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asignaciones.filter((a) => a.estado === "aceptada").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay asignaciones aceptadas todavía</div>
                ) : (
                  asignaciones
                    .filter((a) => a.estado === "aceptada")
                    .map((asignacion) => (
                      <div key={asignacion.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">CLT-{asignacion.cliente_id}</span>
                            <Badge variant="default">Aceptada</Badge>
                          </div>
                          <h4 className="font-semibold">
                            {asignacion.arquitecto_nombre} {asignacion.arquitecto_apellido}
                          </h4>
                          <p className="text-sm text-muted-foreground">Cliente: {asignacion.cliente_id}</p>
                          {asignacion.fecha_respuesta && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Aceptada: {new Date(asignacion.fecha_respuesta).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asignaciones" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Asignaciones</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAsignaciones}</div>
                <p className="text-xs text-muted-foreground mt-1">Todas las solicitudes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{asignacionesPendientes}</div>
                <p className="text-xs text-muted-foreground mt-1">Esperando respuesta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aceptadas</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{asignacionesAceptadas}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalAsignaciones > 0 ? Math.round((asignacionesAceptadas / totalAsignaciones) * 100) : 0}% tasa
                  aceptación
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Todas las Asignaciones</CardTitle>
              <CardDescription>Historial completo de asignaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asignaciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay asignaciones todavía. Crea una nueva asignación en la pestaña "Asignación".
                  </div>
                ) : (
                  asignaciones.map((asignacion) => (
                    <div key={asignacion.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              asignacion.estado === "aceptada"
                                ? "default"
                                : asignacion.estado === "pendiente"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {asignacion.estado === "aceptada"
                              ? "Aceptada"
                              : asignacion.estado === "pendiente"
                                ? "Pendiente"
                                : "Rechazada"}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{asignacion.informe_direccion || "Sin dirección"}</h4>
                        <p className="text-sm text-muted-foreground">
                          Asignado a {asignacion.arquitecto_nombre} {asignacion.arquitecto_apellido} •{" "}
                          {(() => {
                            const fecha = asignacion.fecha_asignacion ?? asignacion.created_at
                            return fecha ? new Date(fecha).toLocaleDateString() : "Sin fecha"
                          })()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensajes" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Mensajes</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mensajes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Mensajes recibidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mensajes.filter((m) => m.estado === "pendiente").length}</div>
                <p className="text-xs text-muted-foreground mt-1">Sin responder</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Respondidos</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mensajes.filter((m) => m.estado === "respondido").length}</div>
                <p className="text-xs text-muted-foreground mt-1">Atendidos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mensajes de Clientes</CardTitle>
              <CardDescription>Mensajes recibidos del formulario de contacto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mensajes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay mensajes todavía</div>
                ) : (
                  mensajes.map((mensaje) => (
                    <div key={mensaje.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              mensaje.estado === "pendiente"
                                ? "secondary"
                                : mensaje.estado === "rechazado"
                                  ? "destructive"
                                  : "default"
                            }
                          >
                            {mensaje.estado === "pendiente"
                              ? "Pendiente"
                              : mensaje.estado === "rechazado"
                                ? "Rechazado"
                                : mensaje.estado === "respondido"
                                  ? "Respondido"
                                  : "En proceso"}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(mensaje.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mb-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm font-medium">
                          {mensaje.cliente_nombre} {mensaje.cliente_apellido}
                        </p>
                        <p className="text-sm text-muted-foreground">{mensaje.cliente_email}</p>
                      </div>
                      <h4 className="font-semibold mb-1">{mensaje.asunto}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{mensaje.mensaje}</p>
                      {mensaje.estado === "pendiente" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => handleAceptarMensaje(mensaje.id)}>
                            Marcar como respondido
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRechazarMensaje(mensaje.id)}>
                            Marcar como rechazado
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Tus datos de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="text-2xl bg-slate-900 text-white">
                      {user?.nombre?.charAt(0)}
                      {user?.apellido?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Cambiar Foto
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre</label>
                  <input type="text" className="w-full p-2 border rounded-md" defaultValue={user?.nombre} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Apellido</label>
                  <input type="text" className="w-full p-2 border rounded-md" defaultValue={user?.apellido} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="w-full p-2 border rounded-md" defaultValue={user?.email} disabled />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <input type="text" className="w-full p-2 border rounded-md" value="Gestor" disabled />
                </div>

                <Button className="w-full">Guardar Cambios</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>Datos adicionales de contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">+34 600 000 000</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Departamento</p>
                    <p className="text-sm text-muted-foreground">Gestión y Administración</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Actividad</CardTitle>
              <CardDescription>Tu actividad en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Asignaciones Creadas</p>
                  <p className="text-2xl font-bold mt-1">156</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Informes Revisados</p>
                  <p className="text-2xl font-bold mt-1">89</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Usuarios Gestionados</p>
                  <p className="text-2xl font-bold mt-1">248</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
