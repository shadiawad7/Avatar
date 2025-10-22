"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, notFound } from "next/navigation"

type KV = Record<string, any>

/* -------------------- NORMALIZACIÓN -------------------- */
function normalizeInforme(data: any) {
  if (!data || typeof data !== "object") return {}

  // Mantengo agrupaciones "estructura" e "instalaciones" solo para imprimir ordenado
  const estructura = {
    vertical: data.estructura_vertical ?? null,
    horizontal: data.estructura_horizontal ?? null,
    forjados: data.forjados ?? null,
    soleras_losas: data.soleras_losas ?? null,
    voladizos: data.voladizos ?? null,
    cubiertas: data.cubiertas ?? null,
    carpinterias: data.carpinterias ?? null,
  }

  const instalaciones = {
    electrica: data.instalacion_electrica ?? null,
    agua_acs: data.instalacion_agua_acs ?? null,
    calefaccion: data.calefaccion ?? null,
    climatizacion: data.climatizacion ?? null,
  }

  return {
    informe: data.informe ?? data.informes ?? {},
    inmueble: data.inmueble ?? data.inmuebles ?? {},
    inspector: data.inspector ?? data.inspectores ?? {},
    servicios: data.servicios ?? data.servicios_inmueble ?? {},
    condiciones: data.condiciones ?? data.condiciones_inspeccion ?? {},
    informacion_general: data.informacion_general ?? {},

    // agrupadas para maquetación
    estructura,
    instalaciones,

    // jardín/exteriores
    jardin: data.jardin ?? {},

    // estanciass específicas
    estancias_salon: data.estancias_salon ?? null,
    estancias_cocina: data.estancias_cocina ?? null,
    estancias_dormitorio: data.estancias_dormitorio ?? null,
    estancias_bano: data.estancias_bano ?? null,
    estancias_terraza: data.estancias_terraza ?? null,
    estancias_garaje: data.estancias_garaje ?? null,
    estancias_sotano: data.estancias_sotano ?? null,

    // sección general adicional

    // cierre documental
    eficiencia: data.eficiencia ?? {},
    siguientes_pasos: data.siguientes_pasos ?? {},

    __raw: data, // útil para debug
  }
}

/* -------------------- PÁGINA -------------------- */
export default function ImprimirInformePage() {
  const params = useParams()
  const [informe, setInforme] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fmt = useMemo(
    () => ({
      value(v: any) {
        if (v === null || v === undefined || v === "") return ""
        if (typeof v === "boolean") return v ? "Sí" : "No"
        if (
          v instanceof Date ||
          (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))
        ) {
          const d = v instanceof Date ? v : new Date(v)
          if (!isNaN(d.getTime())) return d.toLocaleDateString()
        }
        if (typeof v === "number") return v.toLocaleString()
        return String(v)
      },
      entries(obj?: KV) {
        if (!obj || typeof obj !== "object") return []
        return Object.entries(obj).filter(
          ([, val]) => !(val === null || val === undefined || val === "")
        )
      },
      label(k: string) {
        return k
          .replace(/_/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (m) => m.toUpperCase())
      },
    }),
    []
  )

  useEffect(() => {
    if (!params?.id || isNaN(Number(params.id))) {
      notFound()
      return
    }

    const fetchInforme = async () => {
      try {
        const res = await fetch(`/api/informes/${params.id}`, { cache: "no-store" })
        if (!res.ok) return notFound()
        const data = await res.json()

        const norm = normalizeInforme(data)
        setInforme(norm)

        // imprime cuando está listo
        setTimeout(() => {
          const ready = document.getElementById("report-ready")
          if (ready) window.print()
          else window.print()
        }, 600)
      } catch (e) {
        console.error("[print] Error al cargar informe:", e)
        notFound()
      } finally {
        setLoading(false)
      }
    }
    fetchInforme()
  }, [params?.id])

  if (loading || !informe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando informe para imprimir...</p>
        </div>
      </div>
    )
  }

  /* --------- helpers de bloque --------- */
  const BlockKV = ({ title, data }: { title: string; data?: KV }) => {
    const rows = fmt.entries(data)
    if (!rows.length) return null
    return (
      <div className="section">
        <h2 className="section-title">{title}</h2>
        {rows.map(([k, v]) => (
          <div key={k} className="field-row">
            <span className="field-label">{fmt.label(k)}</span>
            <span className="field-value">{fmt.value(v)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
        }
        @media screen { body { background: #f3f4f6; } }

        .print-container { max-width: 210mm; margin: 0 auto; background: white; padding: 20mm; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        @media print { .print-container { box-shadow: none; padding: 0; margin: 0; } }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; }
        .title { font-size: 28px; font-weight: bold; color: #1e40af; margin: 0 0 8px 0; }
        .subtitle { font-size: 14px; color: #64748b; margin: 0; }
        .section { margin-bottom: 25px; break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: bold; color: #1e40af; background: #eff6ff; padding: 10px 15px; margin-bottom: 15px; border-radius: 4px; }
        .field-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .field-label { flex: 0 0 40%; font-weight: 600; color: #475569; font-size: 13px; }
        .field-value { flex: 1; color: #0f172a; font-size: 13px; }
        .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #dbeafe; color: #1e40af; }
      `}</style>

      <div className="print-container">
        {/* Cabecera */}
        <div className="header">
          <h1 className="title">Informe de Inspección Técnica</h1>
          <p className="subtitle">
            ID: INF-{informe.informe?.id ?? "-"} | Fecha:{" "}
            {informe.inspector?.fecha_inspeccion
              ? new Date(informe.inspector.fecha_inspeccion).toLocaleDateString()
              : new Date().toLocaleDateString()}
          </p>
          {informe.informe?.estado && (
            <div style={{ marginTop: 10 }}>
              <span className="badge">{informe.informe.estado}</span>
            </div>
          )}
        </div>

        {/* Datos base */}
        <BlockKV
          title="Información del Informe"
          data={{
            id: `INF-${informe.informe?.id ?? "-"}`,
            fecha_creacion: informe.informe?.created_at,
            ultima_actualizacion: informe.informe?.updated_at,
            coste_estimado_reparacion: informe.informe?.coste_estimado_reparacion
              ? `${informe.informe.coste_estimado_reparacion} €`
              : "",
            resumen_ejecutivo_texto: informe.informe?.resumen_ejecutivo_texto,
          }}
        />

        <BlockKV title="Datos del Inmueble" data={informe.inmueble} />

        <BlockKV
          title="Inspector"
          data={{
            nombre: informe.inspector?.nombre,
            apellido: informe.inspector?.apellido,
            numero_colegiado:
              informe.inspector?.numero_colegiado ?? informe.inspector?.num_colegiado,
            fecha_inspeccion: informe.inspector?.fecha_inspeccion,
            hora_inicio: informe.inspector?.hora_inicio,
            hora_fin: informe.inspector?.hora_fin,
            contacto: informe.inspector?.contacto,
          }}
        />

        <div className="page-break" />

        {/* Generales */}
        <BlockKV title="Servicios del Inmueble" data={informe.servicios} />
        <BlockKV title="Condiciones de Inspección" data={informe.condiciones} />
        <BlockKV title="Información General" data={informe.informacion_general} />

        {/* Estructuras */}
        {(informe.estructura?.vertical ||
          informe.estructura?.horizontal ||
          informe.estructura?.forjados ||
          informe.estructura?.soleras_losas ||
          informe.estructura?.voladizos ||
          informe.estructura?.cubiertas ||
          informe.estructura?.carpinterias) && (
          <>
            <div className="page-break" />
            <div className="section">
              <h2 className="section-title">Estructura</h2>
              <BlockKV title="Estructura Vertical" data={informe.estructura.vertical} />
              <BlockKV title="Estructura Horizontal" data={informe.estructura.horizontal} />
              <BlockKV title="Forjados" data={informe.estructura.forjados} />
              <BlockKV title="Soleras y Losas" data={informe.estructura.soleras_losas} />
              <BlockKV title="Voladizos" data={informe.estructura.voladizos} />
              <BlockKV title="Cubiertas" data={informe.estructura.cubiertas} />
              <BlockKV title="Carpinterías" data={informe.estructura.carpinterias} />
            </div>
          </>
        )}

        {/* Instalaciones */}
        {(informe.instalaciones?.electrica ||
          informe.instalaciones?.agua_acs ||
          informe.instalaciones?.calefaccion ||
          informe.instalaciones?.climatizacion) && (
          <>
            <div className="page-break" />
            <div className="section">
              <h2 className="section-title">Instalaciones</h2>
              <BlockKV title="Instalación Eléctrica" data={informe.instalaciones.electrica} />
              <BlockKV title="Agua y ACS" data={informe.instalaciones.agua_acs} />
              <BlockKV title="Calefacción" data={informe.instalaciones.calefaccion} />
              <BlockKV title="Climatización" data={informe.instalaciones.climatizacion} />
            </div>
          </>
        )}

        {/* Jardín */}
        <BlockKV title="Jardín" data={informe.jardin} />

        {/* estanciass específicas */}
        {informe.estancias_salon && (
          <BlockKV title="estancias — Salón" data={informe.estancias_salon} />
        )}
        {informe.estancias_cocina && (
          <BlockKV title="estancias — Cocina" data={informe.estancias_cocina} />
        )}
        {informe.estancias_dormitorio && (
          <BlockKV title="estancias — Dormitorio" data={informe.estancias_dormitorio} />
        )}
        {informe.estancias_bano && (
          <BlockKV title="estancias — Baño" data={informe.estancias_bano} />
        )}
        {informe.estancias_terraza && (
          <BlockKV title="estancias — Terraza" data={informe.estancias_terraza} />
        )}
        {informe.estancias_garaje && (
          <BlockKV title="estancias — Garaje" data={informe.estancias_garaje} />
        )}
        {informe.estancias_sotano && (
          <BlockKV title="estancias — Sótano" data={informe.estancias_sotano} />
        )}

    

        <div className="page-break" />

        <BlockKV title="Eficiencia Energética" data={informe.eficiencia} />
        <BlockKV title="Siguientes Pasos y Recomendaciones" data={informe.siguientes_pasos} />

        {/* marcador de render listo */}
        <div id="report-ready" />

        <div className="footer">
          <p>Documento generado automáticamente por el sistema de gestión de informes</p>
          <p>Fecha de generación: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </>
  )
}
