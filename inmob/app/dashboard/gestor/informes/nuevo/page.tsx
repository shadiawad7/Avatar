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
import { ArrowLeft, ArrowRight, Save, FileText, Building, ClipboardCheck, Upload, Trash2 } from "lucide-react"

type TipoInforme = "basico" | "tecnico" | "documental"

// ✅ Tablas por tipo: documental = 29 secciones (con estanciass + otras_patologias)
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

    // estanciass
    "estancias_salon",
    "estancias_cocina",
    "estancias_dormitorio",
    "estancias_bano",
    "estancias_terraza",
    "estancias_garaje",
    "estancias_sotano",


    // Cierre documental
    "eficiencia",
    "siguientes_pasos",
  ],
}

// 🧩 Subidor de fotos por sección (usa /api/upload → { urls: string[] })
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

  const handleUpload = async () => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const form = new FormData()
      Array.from(files).forEach((f) => form.append("files", f))
      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) throw new Error("Error subiendo imágenes")
      const data = await res.json()
      const urls: string[] = data.urls || []
      onChange([...(value || []), ...urls])
      setFiles(null)
    } catch (e) {
      console.error("[v0] upload error:", e)
      alert("No se pudieron subir las imágenes")
    } finally {
      setUploading(false)
    }
  }

  const removeUrl = (url: string) => {
    const next = (value || []).filter((u) => u !== url)
    onChange(next)
  }

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

      {/* Preview grid */}
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

export default function NuevoInformePage() {
  const router = useRouter()
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

  const updateFotos = (tabla: string, urls: string[]) => {
    setFormData((prev) => ({
      ...prev,
      [tabla]: { ...(prev[tabla] || {}), fotos: urls },
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
      // formData ya contiene fotos como array de URLs (jsonb)
      const response = await fetch("/api/informes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoInforme,
          data: formData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/dashboard/gestor/informes/${result.informeId}`)
      } else {
        const err = await response.text()
        console.error("[v0] Error al guardar:", err)
        alert("Error al guardar el informe")
      }
    } catch (error) {
      console.error("[v0] Error al guardar:", error)
      alert("Error al guardar el informe")
    } finally {
      setSaving(false)
    }
  }

  if (!tipoInforme) {
    return (
      <DashboardLayout title="Nuevo Informe" roleLabel="Gestor">
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
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setTipoInforme("basico")}>
              <CardHeader>
                <FileText className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Informe Básico</CardTitle>
                <CardDescription>Datos fundamentales del inmueble</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Inmueble (+ fotos)</li>
                  <li>• Inspector</li>
                  <li>• Servicios</li>
                  <li>• Condiciones</li>
                  <li>• Información general (+ fotos)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">6 secciones</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setTipoInforme("tecnico")}>
              <CardHeader>
                <Building className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Informe Técnico Completo</CardTitle>
                <CardDescription>Estructura e instalaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Todo lo del básico</li>
                  <li>• Estructuras (+ fotos)</li>
                  <li>• Instalaciones (+ fotos)</li>
                  <li>• Carpinterías (+ fotos)</li>
                  <li>• Cubiertas (+ fotos)</li>
                  <li>• Jardín/Exteriores (+ fotos)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">18 secciones</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setTipoInforme("documental")}>
              <CardHeader>
                <ClipboardCheck className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Informe Documental Completo</CardTitle>
                <CardDescription>Incluye estancias y recomendaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Todo lo del técnico</li>
                  <li>• 7 estancias</li>
                  <li>• Eficiencia y siguientes pasos</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">29 secciones</p>
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
      roleLabel="Gestor"
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

        {/* Formulario dinámico */}
        {renderFormularioTabla(
          tablaActual,
          formData[tablaActual] || {},
          (data) => updateFormData(tablaActual, data),
          (urls) => updateFotos(tablaActual, urls),
          tipoInforme
        )}
      </div>
    </DashboardLayout>
  )
}

function renderFormularioTabla(
  tabla: string,
  data: any,
  onChange: (data: any) => void,
  onFotosChange: (urls: string[]) => void,
  tipoInforme: TipoInforme
) {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const FotosField = (label?: string) => (
    <PhotoUploader value={data.fotos || []} onChange={(urls) => onFotosChange(urls)} label={label || "Fotografías"} />
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
              <div className="space-y-2">
                <Label>Dirección *</Label>
                <Input value={data.direccion || ""} onChange={(e) => updateField("direccion", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Referencia Catastral</Label>
                <Input value={data.ref_catastral || ""} onChange={(e) => updateField("ref_catastral", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Año Construcción</Label>
                <Input
                  type="number"
                  value={data.anno_construccion || ""}
                  onChange={(e) => updateField("anno_construccion", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Metros Cuadrados</Label>
                <Input
                  type="number"
                  value={data.metros_cuadrados || ""}
                  onChange={(e) => updateField("metros_cuadrados", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Orientación</Label>
                <Input value={data.orientacion || ""} onChange={(e) => updateField("orientacion", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo Propiedad</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={data.tipo_propiedad || ""}
                  onChange={(e) => updateField("tipo_propiedad", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="vivienda">Vivienda</option>
                  <option value="local">Local</option>
                  <option value="oficina">Oficina</option>
                  <option value="nave">Nave</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Planta</Label>
                <Input value={data.planta || ""} onChange={(e) => updateField("planta", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Parcela</Label>
                <Input value={data.parcela || ""} onChange={(e) => updateField("parcela", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ampliado"
                  checked={data.ampliado_reformado || false}
                  onCheckedChange={(checked) => updateField("ampliado_reformado", checked)}
                />
                <Label htmlFor="ampliado">Ampliado/Reformado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cambio_uso"
                  checked={data.cambio_uso || false}
                  onCheckedChange={(checked) => updateField("cambio_uso", checked)}
                />
                <Label htmlFor="cambio_uso">Cambio de Uso</Label>
              </div>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Estado</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={data.estado || "borrador"}
                  onChange={(e) => updateField("estado", e.target.value)}
                >
                  <option value="borrador">Borrador</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completo">Completo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Coste Estimado Reparación (€)</Label>
                <Input
                  type="number"
                  value={data.coste_estimado_reparacion || ""}
                  onChange={(e) => updateField("coste_estimado_reparacion", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Resumen Ejecutivo</Label>
              <Textarea
                rows={6}
                value={data.resumen_ejecutivo_texto || ""}
                onChange={(e) => updateField("resumen_ejecutivo_texto", e.target.value)}
                placeholder="Describe el resumen ejecutivo del informe..."
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
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={data.nombre || ""} onChange={(e) => updateField("nombre", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={data.apellido || ""} onChange={(e) => updateField("apellido", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha Inspección</Label>
                <Input
                  type="date"
                  value={data.fecha_inspeccion || ""}
                  onChange={(e) => updateField("fecha_inspeccion", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input value={data.contacto || ""} onChange={(e) => updateField("contacto", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Titulación</Label>
                <Input value={data.titulacion || ""} onChange={(e) => updateField("titulacion", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número Colegiado</Label>
                <Input value={data.num_colegiado || ""} onChange={(e) => updateField("num_colegiado", e.target.value)} />
              </div>
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
              ].map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={data[key] || false}
                    onCheckedChange={(checked) => updateField(key, checked)}
                  />
                  <Label htmlFor={key}>{label}</Label>
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
              <div className="space-y-2">
                <Label>Temperatura Ambiente</Label>
                <Input value={data.temp_ambiente || ""} onChange={(e) => updateField("temp_ambiente", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tiempo Atmosférico</Label>
                <Input
                  value={data.tiempo_atmosferico || ""}
                  onChange={(e) => updateField("tiempo_atmosferico", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Superficie Exterior</Label>
                <Input value={data.sup_exterior || ""} onChange={(e) => updateField("sup_exterior", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tráfico</Label>
                <Input value={data.trafico || ""} onChange={(e) => updateField("trafico", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lluvia"
                  checked={data.lluvia_ultimos_3d || false}
                  onCheckedChange={(checked) => updateField("lluvia_ultimos_3d", checked)}
                />
                <Label htmlFor="lluvia">Lluvia en últimos 3 días</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ruidosa"
                  checked={data.zona_ruidosa || false}
                  onCheckedChange={(checked) => updateField("zona_ruidosa", checked)}
                />
                <Label htmlFor="ruidosa">Zona Ruidosa</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )

    case "informacion_general":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Estado general de elementos comunes</CardDescription>
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
              ].map(([key, lab]) => (
                <div key={key} className="space-y-2">
                  <Label>{lab}</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={data[key] || ""}
                    onChange={(e) => updateField(key, e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="bueno">Bueno</option>
                    <option value="regular">Regular</option>
                    <option value="malo">Malo</option>
                    {key === "ascensor_estado" || key === "jardines_estado" ? <option value="no_tiene">No tiene</option> : null}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="posib_ascensor"
                checked={data.posib_ascensor || false}
                onCheckedChange={(checked) => updateField("posib_ascensor", checked)}
              />
              <Label htmlFor="posib_ascensor">Posibilidad de Instalar Ascensor</Label>
            </div>

            <div className="space-y-2">
              <Label>Descripción General</Label>
              <Textarea
                rows={4}
                value={data.descripcion_general_texto || ""}
                onChange={(e) => updateField("descripcion_general_texto", e.target.value)}
              />
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
            <CardDescription>Análisis de la estructura vertical</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo Estructura Vertical</Label>
                <Input
                  value={data.tipo_estructura_vertical || ""}
                  onChange={(e) => updateField("tipo_estructura_vertical", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo Muros de Carga</Label>
                <Input value={data.tipo_muros_carga || ""} onChange={(e) => updateField("tipo_muros_carga", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Patologías</Label>
              <Textarea
                rows={4}
                value={data.patologias_estructura_vertical || ""}
                onChange={(e) => updateField("patologias_estructura_vertical", e.target.value)}
              />
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
              <div className="space-y-2">
                <Label>Tipo de Vigas</Label>
                <Input value={data.tipo_vigas || ""} onChange={(e) => updateField("tipo_vigas", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Viguetas</Label>
                <Input value={data.tipo_viguetas || ""} onChange={(e) => updateField("tipo_viguetas", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Patologías en Vigas</Label>
              <Textarea rows={3} value={data.patologias_vigas || ""} onChange={(e) => updateField("patologias_vigas", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Patologías en Viguetas</Label>
              <Textarea rows={3} value={data.patologias_viguetas || ""} onChange={(e) => updateField("patologias_viguetas", e.target.value)} />
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
            <CardDescription>Estado de los forjados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="desniveles"
                checked={data.tiene_desniveles || false}
                onCheckedChange={(checked) => updateField("tiene_desniveles", checked)}
              />
              <Label htmlFor="desniveles">Tiene Desniveles</Label>
            </div>
            <div className="space-y-2">
              <Label>Patologías en Forjados</Label>
              <Textarea rows={4} value={data.patologias_forjados || ""} onChange={(e) => updateField("patologias_forjados", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "soleras_losas":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Soleras y Losas</CardTitle>
            <CardDescription>Estado de soleras y losas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {[
                ["tiene_soleras", "Tiene Soleras"],
                ["tiene_capilaridades", "Tiene Capilaridades"],
                ["desniveles", "Desniveles"],
              ].map(([key, lab]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={data[key] || false}
                    onCheckedChange={(checked) => updateField(key, checked)}
                  />
                  <Label htmlFor={key}>{lab}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Patologías</Label>
              <Textarea rows={4} value={data.patologias_soleras_losas || ""} onChange={(e) => updateField("patologias_soleras_losas", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "voladizos":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Voladizos</CardTitle>
            <CardDescription>Estado de voladizos y balcones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Patologías en Voladizos</Label>
            <Textarea rows={4} value={data.patologias_voladizos || ""} onChange={(e) => updateField("patologias_voladizos", e.target.value)} />
          </CardContent>
        </Card>
      )

    case "cubiertas":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Cubiertas</CardTitle>
            <CardDescription>Análisis de la cubierta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Cubierta</Label>
                <select className="w-full p-2 border rounded-md" value={data.tipo_cubierta || ""} onChange={(e) => updateField("tipo_cubierta", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="plana">Plana</option>
                  <option value="inclinada">Inclinada</option>
                  <option value="mixta">Mixta</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Subtipo</Label>
                <Input value={data.subtipo || ""} onChange={(e) => updateField("subtipo", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Acabado</Label>
                <Input value={data.acabado || ""} onChange={(e) => updateField("acabado", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4">
              {[
                ["cubierta_ventilada", "Cubierta Ventilada"],
                ["tiene_aislamiento", "Tiene Aislamiento"],
                ["impermeabilizacion", "Impermeabilización"],
              ].map(([key, lab]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox id={key} checked={data[key] || false} onCheckedChange={(checked) => updateField(key, checked)} />
                  <Label htmlFor={key}>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Estado del Aislamiento</Label>
              <Textarea rows={2} value={data.aislamiento_estado_texto || ""} onChange={(e) => updateField("aislamiento_estado_texto", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Estado de la Impermeabilización</Label>
              <Textarea rows={2} value={data.impermeabilizacion_estado_texto || ""} onChange={(e) => updateField("impermeabilizacion_estado_texto", e.target.value)} />
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
            <CardDescription>Estado de la instalación eléctrica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              {[
                ["tiene_instalacion", "Tiene Instalación"],
                ["cuadro_en_norma", "Cuadro en Norma"],
                ["toma_tierra", "Toma de Tierra"],
                ["energias_renovables", "Energías Renovables"],
              ].map(([key, lab]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox id={key} checked={data[key] || false} onCheckedChange={(checked) => updateField(key, checked)} />
                  <Label htmlFor={key}>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["canalizaciones", "Canalizaciones"],
                ["cableado_exterior", "Cableado Exterior"],
                ["cableado_interior", "Cableado Interior"],
              ].map(([key, lab]) => (
                <div key={key} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[key] || ""} onChange={(e) => updateField(key, e.target.value)} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Estado Cajas de Empalme</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={data.cajas_empalme_estado || ""}
                  onChange={(e) => updateField("cajas_empalme_estado", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e) => updateField("observaciones_texto", e.target.value)} />
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
            <CardDescription>Sistema de agua y agua caliente sanitaria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              {[
                ["dispone_acs", "Dispone de ACS"],
                ["sistema_normativa", "Sistema en Normativa"],
                ["llave_paso_general", "Llave de Paso General"],
                ["tuberias_empotradas", "Tuberías Empotradas"],
              ].map(([key, lab]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox id={key} checked={data[key] || false} onCheckedChange={(checked) => updateField(key, checked)} />
                  <Label htmlFor={key}>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["tipo_acs", "Tipo de ACS"],
                ["extraccion_acs", "Extracción ACS"],
                ["material_tuberias", "Material Tuberías"],
                ["bajantes", "Bajantes"],
                ["arquetas", "Arquetas"],
              ].map(([key, lab]) => (
                <div key={key} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[key] || ""} onChange={(e) => updateField(key, e.target.value)} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Estado Llave de Paso</Label>
                <select className="w-full p-2 border rounded-md" value={data.llave_paso_estado || ""} onChange={(e) => updateField("llave_paso_estado", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e) => updateField("observaciones_texto", e.target.value)} />
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
            <CardDescription>Sistema de calefacción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              {[
                ["dispone_calefaccion", "Dispone de Calefacción"],
                ["sistema_normativa", "Sistema en Normativa"],
                ["tuberias_empotradas", "Tuberías Empotradas"],
              ].map(([key, lab]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox id={key} checked={data[key] || false} onCheckedChange={(checked) => updateField(key, checked)} />
                  <Label htmlFor={key}>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["tipo_calefaccion", "Tipo de Calefacción"],
                ["estado_caldera", "Estado Caldera"],
                ["tuberias_calefaccion", "Tuberías Calefacción"],
                ["tipo_emisor", "Tipo Emisor"],
                ["extraccion_calefaccion", "Extracción Calefacción"],
              ].map(([key, lab]) => (
                <div key={key} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[key] || ""} onChange={(e) => updateField(key, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e) => updateField("observaciones_texto", e.target.value)} />
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
            <CardDescription>Sistema de climatización</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dispone_climatizacion"
                checked={data.dispone_climatizacion || false}
                onCheckedChange={(checked) => updateField("dispone_climatizacion", checked)}
              />
              <Label htmlFor="dispone_climatizacion">Dispone de Climatización</Label>
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
            <div className="flex gap-4">
              {[
                ["rotura_puente_termico", "Rotura Puente Térmico"],
                ["puentes_termicos_persiana", "Puentes Térmicos Persiana"],
              ].map(([key, lab]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox id={key} checked={data[key] || false} onCheckedChange={(checked) => updateField(key, checked)} />
                  <Label htmlFor={key}>{lab}</Label>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["material_carpinteria", "Material Carpintería"],
                ["aislamiento_termico_ventanas_estado", "Estado Aislamiento Térmico Ventanas"],
                ["aislamiento_acustico_ventanas_estado", "Estado Aislamiento Acústico Ventanas"],
                ["sistema_oscurecimiento", "Sistema de Oscurecimiento"],
                ["material_persianas", "Material Persianas"],
                ["recogida_persianas", "Recogida Persianas"],
                ["caja_persianas", "Caja Persianas"],
                ["tapa_cajon_persianas", "Tapa Cajón Persianas"],
              ].map(([key, lab]) => (
                <div key={key} className="space-y-2">
                  <Label>{lab}</Label>
                  {key.endsWith("_estado") ? (
                    <select className="w-full p-2 border rounded-md" value={data[key] || ""} onChange={(e) => updateField(key, e.target.value)}>
                      <option value="">Seleccionar...</option>
                      <option value="bueno">Bueno</option>
                      <option value="regular">Regular</option>
                      <option value="malo">Malo</option>
                      {key === "aislamiento_termico_ventanas_estado" ? null : <option value="no_tiene">No tiene</option>}
                    </select>
                  ) : (
                    <Input value={data[key] || ""} onChange={(e) => updateField(key, e.target.value)} />
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
            <CardDescription>Elementos del jardín y zonas exteriores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Descripción Corta</Label>
              <Input value={data.descripcion_corta || ""} onChange={(e) => updateField("descripcion_corta", e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["puerta_parcela", "Puerta Parcela"],
                ["valla_perimetral", "Valla Perimetral"],
                ["cesped", "Césped"],
                ["arboles", "Árboles"],
                ["zona_pavimentada", "Zona Pavimentada"],
                ["tarimas_madera", "Tarimas de Madera"],
                ["pergola_porche", "Pérgola/Porche"],
                ["piscina", "Piscina"],
                ["zona_barbacoa", "Zona Barbacoa"],
                ["zona_ducha", "Zona Ducha"],
                ["banos_exteriores", "Baños Exteriores"],
                ["iluminacion_exterior", "Iluminación Exterior"],
                ["riego_automatico", "Riego Automático"],
                ["pozo", "Pozo"],
                ["deposito_agua", "Depósito de Agua"],
                ["camaras_seguridad", "Cámaras de Seguridad"],
              ].map(([key, lab]) => (
                <div key={key} className="space-y-2">
                  <Label>{lab}</Label>
                  <Input value={data[key] || ""} onChange={(e) => updateField(key, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Fachada</Label>
              <Textarea rows={2} value={data.fachada_texto || ""} onChange={(e) => updateField("fachada_texto", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e) => updateField("observaciones_texto", e.target.value)} />
            </div>

            {FotosField("Fotos Jardín/Exteriores")}
          </CardContent>
        </Card>
      )

    // ---- estanciass nuevas ----
    case "estancias_salon":
      return (
        <Card>
          <CardHeader>
            <CardTitle>estancias: Salón</CardTitle>
            <CardDescription>Estado del salón</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado General"],
              ["pavimento","Pavimento"],
              ["paredes_techos","Paredes y Techos"],
              ["ventanas_carpinteria","Ventanas / Carpintería"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>updateField(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-4">
              {[
                ["ventilacion_natural","Ventilación Natural"],
                ["iluminacion_natural","Iluminación Natural"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={data[k] || false} onCheckedChange={(c)=>updateField(k, c)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>updateField("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancias_cocina":
      return (
        <Card>
          <CardHeader>
            <CardTitle>estancias: Cocina</CardTitle>
            <CardDescription>Estado de la cocina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado General"],
              ["encimera_mobiliario","Encimera y Mobiliario"],
              ["campana_extractora","Campana Extractora"],
              ["griferia_fregadero","Grifería / Fregadero"],
              ["revestimientos","Revestimientos"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>updateField(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-4">
              {[
                ["elec_adecuada","Instalación Eléctrica Adecuada"],
                ["salida_humos","Salida de Humos"],
                ["ventilacion_natural","Ventilación Natural"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={data[k] || false} onCheckedChange={(c)=>updateField(k, c)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>updateField("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancias_dormitorio":
      return (
        <Card>
          <CardHeader>
            <CardTitle>estancias: Dormitorio</CardTitle>
            <CardDescription>Estado de dormitorios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado General"],
              ["pavimento","Pavimento"],
              ["paredes_techos","Paredes y Techos"],
              ["ventanas_aislamiento","Ventanas / Aislamiento"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>updateField(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-4">
              {[
                ["ventilacion_natural","Ventilación Natural"],
                ["iluminacion_natural","Iluminación Natural"],
                ["humedades","Humedades"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={data[k] || false} onCheckedChange={(c)=>updateField(k, c)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>updateField("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancias_bano":
      return (
        <Card>
          <CardHeader>
            <CardTitle>estancias: Baño</CardTitle>
            <CardDescription>Estado de baños</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado General"],
              ["revestimientos","Revestimientos"],
              ["fontaneria_sanitarios","Fontanería y Sanitarios"],
              ["ventilacion","Ventilación"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>updateField(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-4">
              {[
                ["humedades_filtraciones","Humedades / Filtraciones"],
                ["elec_adecuada","Instalación Eléctrica Adecuada"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={data[k] || false} onCheckedChange={(c)=>updateField(k, c)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>updateField("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancias_terraza":
      return (
        <Card>
          <CardHeader>
            <CardTitle>estancias: Terraza</CardTitle>
            <CardDescription>Estado de terrazas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["tipo_terraza","Tipo de Terraza"],
              ["pavimento_exterior","Pavimento Exterior"],
              ["barandilla_estado","Estado de Barandilla"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>updateField(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-4">
              {[
                ["impermeabilizacion","Impermeabilización"],
                ["grietas_fisuras","Grietas / Fisuras"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={data[k] || false} onCheckedChange={(c)=>updateField(k, c)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>updateField("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancias_garaje":
      return (
        <Card>
          <CardHeader>
            <CardTitle>estancias: Garaje</CardTitle>
            <CardDescription>Estado del garaje</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado General"],
              ["pavimento","Pavimento"],
              ["paredes_techos","Paredes y Techos"],
              ["puerta_modo","Modo de Puerta"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>updateField(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-4">
              {[
                ["ventilacion","Ventilación"],
                ["iluminacion","Iluminación"],
                ["filtraciones","Filtraciones"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={data[k] || false} onCheckedChange={(c)=>updateField(k, c)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>updateField("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

    case "estancias_sotano":
      return (
        <Card>
          <CardHeader>
            <CardTitle>estancias: Sótano</CardTitle>
            <CardDescription>Estado del sótano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["estado_general","Estado General"],
              ["revestimientos","Revestimientos"],
              ["uso_actual","Uso Actual"],
            ].map(([k,l])=>(
              <div key={k} className="space-y-2">
                <Label>{l}</Label>
                <Input value={data[k] || ""} onChange={(e)=>updateField(k, e.target.value)} />
              </div>
            ))}
            <div className="flex gap-4">
              {[
                ["humedad","Humedad"],
                ["ventilacion","Ventilación"],
                ["iluminacion","Iluminación"],
              ].map(([k,l])=>(
                <div key={k} className="flex items-center space-x-2">
                  <Checkbox checked={data[k] || false} onCheckedChange={(c)=>updateField(k, c)} />
                  <Label>{l}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea rows={3} value={data.observaciones_texto || ""} onChange={(e)=>updateField("observaciones_texto", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )

      case "eficiencia":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Eficiencia Energética</CardTitle>
              <CardDescription>Análisis de eficiencia energética</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notas de Eficiencia</Label>
                <Textarea
                  rows={6}
                  value={data.notas_texto || ""}
                  onChange={(e) => updateField("notas_texto", e.target.value)}
                />
              </div>
      
              <div className="space-y-2">
                <Label>Certificado Energético</Label>
                <Input
                  type="text"
                  value={data.certificado_energetico || ""}
                  onChange={(e) => updateField("certificado_energetico", e.target.value)}
                  placeholder="Ejemplo: Certificado ABC123"
                />
              </div>
      
              <div className="space-y-2">
                <Label>Calificación Energética</Label>
                <Input
                  type="text"
                  value={data.calificacion_energetica || ""}
                  onChange={(e) => updateField("calificacion_energetica", e.target.value)}
                  placeholder="Ejemplo: A+, B, C..."
                />
              </div>
      
              <div className="space-y-2">
                <Label>Consumo Anual Estimado</Label>
                <Input
                  type="text"
                  value={data.consumo_anual_estimado || ""}
                  onChange={(e) => updateField("consumo_anual_estimado", e.target.value)}
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
            <CardDescription>Recomendaciones y acciones a seguir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["obtener_presupuestos_texto", "Obtener Presupuestos"],
              ["estudios_complementarios_texto", "Estudios Complementarios"],
              ["descripcion_servicio_texto", "Descripción del Servicio"],
              ["consejos_antes_comprar_texto", "Consejos Antes de Comprar"],
              ["consejos_mantenimiento_texto", "Consejos de Mantenimiento"],
            ].map(([key, lab]) => (
              <div key={key} className="space-y-2">
                <Label>{lab}</Label>
                <Textarea rows={3} value={data[key] || ""} onChange={(e) => updateField(key, e.target.value)} />
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
