import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/db"

const INFORME_APPROVAL_STATES = ["pendiente", "aprobado", "rechazado"] as const
type InformeApprovalState = (typeof INFORME_APPROVAL_STATES)[number]

function normalizeApprovalState(value: unknown): InformeApprovalState | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toLowerCase()
  return (INFORME_APPROVAL_STATES as readonly string[]).includes(normalized)
    ? (normalized as InformeApprovalState)
    : null
}

function approvalStateFromDb(value: unknown): InformeApprovalState {
  if (value === true) return "aprobado"
  if (value === false) return "rechazado"
  return "pendiente"
}

function approvalStateToDb(value: InformeApprovalState | null): boolean | null {
  if (value === "aprobado") return true
  if (value === "rechazado") return false
  return null
}

// helper para leer 1 fila (o null) y no romper si la tabla no existe
async function safeOne<T = any>(query: string, ...params: any[]): Promise<T | null> {
  try {
    // @ts-ignore – tu wrapper `sql` acepta template literal; usamos string+params
    const rows = await sql([query] as any, ...params)
    if (Array.isArray(rows) && rows.length) return rows[0] as T
    return null
  } catch (e: any) {
    if (String(e?.message || e).includes("relation") && String(e?.message || e).includes("does not exist")) {
      console.warn("[fetchInformeCompleto] tabla faltante en query:", query)
      return null
    }
    throw e
  }
}

/* ------------------------- Helper: leer informe ------------------------- */
async function fetchInformeCompleto(informeId: number) {
  const [informe] = await sql`SELECT * FROM informes WHERE id = ${informeId}`
  if (!informe) return null
  informe.estado_aprobacion = approvalStateFromDb(informe.aprobado)

  const [inmueble] = await sql`SELECT * FROM inmuebles WHERE id = ${informe.inmueble_id}`
  const [inspector] = await sql`SELECT * FROM inspectores WHERE informe_id = ${informeId}`
  const [servicios] = await sql`SELECT * FROM servicios_inmueble WHERE informe_id = ${informeId}`
  const [condiciones] = await sql`SELECT * FROM condiciones_inspeccion WHERE informe_id = ${informeId}`
  const [informacion_general] = await sql`SELECT * FROM informacion_general WHERE informe_id = ${informeId}`

  // Estructura
  const [estructura_vertical]   = await sql`SELECT * FROM estructura_vertical WHERE informe_id = ${informeId}`
  const [estructura_horizontal] = await sql`SELECT * FROM estructura_horizontal WHERE informe_id = ${informeId}`
  const [forjados]              = await sql`SELECT * FROM forjados WHERE informe_id = ${informeId}`
  const [soleras_losas]         = await sql`SELECT * FROM soleras_losas WHERE informe_id = ${informeId}`
  const [voladizos]             = await sql`SELECT * FROM voladizos WHERE informe_id = ${informeId}`
  const [cubiertas]             = await sql`SELECT * FROM cubiertas WHERE informe_id = ${informeId}`
  const [carpinterias]          = await sql`SELECT * FROM carpinterias WHERE informe_id = ${informeId}`

  // Instalaciones
  const [instalacion_electrica] = await sql`SELECT * FROM instalacion_electrica WHERE informe_id = ${informeId}`
  const [instalacion_agua_acs]  = await sql`SELECT * FROM instalacion_agua_acs WHERE informe_id = ${informeId}`
  const [calefaccion]           = await sql`SELECT * FROM calefaccion WHERE informe_id = ${informeId}`
  const [climatizacion]         = await sql`SELECT * FROM climatizacion WHERE informe_id = ${informeId}`

  // estancias específicas
  const [estancias_salon]      = await sql`SELECT * FROM estancias_salon WHERE informe_id = ${informeId}`
  const [estancias_cocina]     = await sql`SELECT * FROM estancias_cocina WHERE informe_id = ${informeId}`
  const [estancias_dormitorio] = await sql`SELECT * FROM estancias_dormitorio WHERE informe_id = ${informeId}`
  const [estancias_bano]       = await sql`SELECT * FROM estancias_bano WHERE informe_id = ${informeId}`
  const [estancias_terraza]    = await sql`SELECT * FROM estancias_terraza WHERE informe_id = ${informeId}`
  const [estancias_garaje]     = await sql`SELECT * FROM estancias_garaje WHERE informe_id = ${informeId}`
  const [estancias_sotano]     = await sql`SELECT * FROM estancias_sotano WHERE informe_id = ${informeId}`

  const [jardin]            = await sql`SELECT * FROM jardin WHERE informe_id = ${informeId}`
  const [eficiencia]        = await sql`SELECT * FROM eficiencia WHERE informe_id = ${informeId}`
  const [siguientes_pasos]  = await sql`SELECT * FROM siguientes_pasos WHERE informe_id = ${informeId}`

  return {
    informe,
    inmueble,
    inspector,
    servicios,
    condiciones,
    informacion_general,
    estructura: {
      vertical: estructura_vertical,
      horizontal: estructura_horizontal,
      forjados,
      soleras_losas,
      voladizos,
      cubiertas,
      carpinterias,
      estancias_salon,
      estancias_cocina,
      estancias_dormitorio,
      estancias_bano,
      estancias_terraza,
      estancias_garaje,
      estancias_sotano,
    },
    instalaciones: {
      electrica: instalacion_electrica,
      agua_acs: instalacion_agua_acs,
      calefaccion,
      climatizacion,
    },
  jardin,
  eficiencia,
  siguientes_pasos,
  }
}

/* --------------------------------- GET --------------------------------- */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { id } = await ctx.params
    const informeId = Number(id)
    if (!Number.isFinite(informeId)) {
      return NextResponse.json({ error: "ID de informe inválido" }, { status: 400 })
    }

    const data = await fetchInformeCompleto(informeId)
    if (!data) return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 })

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error al obtener informe:", error)
    return NextResponse.json({ error: "Error al obtener informe" }, { status: 500 })
  }
}

/* --------------------------------- PUT --------------------------------- */
export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { id } = await ctx.params
    const informeId = Number(id)
    if (!Number.isFinite(informeId)) {
      return NextResponse.json({ error: "ID de informe inválido" }, { status: 400 })
    }

    const data = await request.json()
    console.log("[v0] Actualizando informe:", informeId)
    const isArquitecto = session.rol === "arquitecto"
    const canSetApproval = session.rol === "gestor"
    let approvalOverride: InformeApprovalState | null = null

    if (data.inmueble) {
      await sql`
        UPDATE inmuebles SET
          direccion = ${data.inmueble.direccion || null},
          ref_catastral = ${data.inmueble.ref_catastral || null},
          anno_construccion = ${data.inmueble.anno_construccion || null},
          metros_cuadrados = ${data.inmueble.metros_cuadrados || null},
          orientacion = ${data.inmueble.orientacion || null},
          tipo_propiedad = ${data.inmueble.tipo_propiedad || null},
          planta = ${data.inmueble.planta || null},
          parcela = ${data.inmueble.parcela || null},
          ampliado_reformado = ${data.inmueble.ampliado_reformado || false},
          cambio_uso = ${data.inmueble.cambio_uso || false},
          ventilacion_cruzada = ${data.inmueble.ventilacion_cruzada || null},
          ventilacion_general = ${data.inmueble.ventilacion_general || null},
          iluminacion = ${data.inmueble.iluminacion || null},
          fotos = ${data.inmueble.fotos ? JSON.stringify(data.inmueble.fotos) : null}::jsonb
        WHERE id = (SELECT inmueble_id FROM informes WHERE id = ${informeId})
      `
    }

    if (data.informe) {
      const desiredApproval = normalizeApprovalState(data.informe.estado_aprobacion)
      if (canSetApproval && desiredApproval) {
        approvalOverride = desiredApproval
      }

      await sql`
        UPDATE informes SET
          estado = COALESCE(${data.informe.estado}, estado),
          resumen_ejecutivo_texto = ${data.informe.resumen_ejecutivo_texto || null},
          coste_estimado_reparacion = ${data.informe.coste_estimado_reparacion ?? null},
          updated_at = NOW()
        WHERE id = ${informeId}
      `
    }

    if (data.inspector) {
      await sql`
        UPDATE inspectores SET
          nombre = ${data.inspector.nombre || null},
          apellido = ${data.inspector.apellido || null},
          num_colegiado = ${data.inspector.num_colegiado || null},
          titulacion = ${data.inspector.titulacion || null},
          contacto = ${data.inspector.contacto || null},
          fecha_inspeccion = ${data.inspector.fecha_inspeccion || null},
          declaracion_firma_texto = ${data.inspector.declaracion_firma_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.servicios) {
      await sql`
        UPDATE servicios_inmueble SET
          agua = ${data.servicios.agua || false},
          gas = ${data.servicios.gas || false},
          electricidad = ${data.servicios.electricidad || false},
          internet = ${data.servicios.internet || false},
          gasoil = ${data.servicios.gasoil || false},
          renovables = ${data.servicios.renovables || false}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.condiciones_inspeccion) {
      await sql`
        UPDATE condiciones_inspeccion SET
          tiempo_atmosferico = ${data.condiciones_inspeccion.tiempo_atmosferico || null},
          temp_ambiente = ${data.condiciones_inspeccion.temp_ambiente || null},
          lluvia_ultimos_3d = ${data.condiciones_inspeccion.lluvia_ultimos_3d || false},
          zona_ruidosa = ${data.condiciones_inspeccion.zona_ruidosa || false},
          trafico = ${data.condiciones_inspeccion.trafico || null},
          sup_exterior = ${data.condiciones_inspeccion.sup_exterior || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.informacion_general) {
      await sql`
        UPDATE informacion_general SET
          descripcion_general_texto = ${data.informacion_general.descripcion_general_texto || null},
          fachadas_estado = ${data.informacion_general.fachadas_estado || null},
          puerta_entrada_estado = ${data.informacion_general.puerta_entrada_estado || null},
          vestibulo_estado = ${data.informacion_general.vestibulo_estado || null},
          ascensor_estado = ${data.informacion_general.ascensor_estado || null},
          posib_ascensor = ${data.informacion_general.posib_ascensor || false},
          patio_luces_estado = ${data.informacion_general.patio_luces_estado || null},
          patio_ventilacion_estado = ${data.informacion_general.patio_ventilacion_estado || null},
          jardines_estado = ${data.informacion_general.jardines_estado || null},
          fotos = ${data.informacion_general.fotos ? JSON.stringify(data.informacion_general.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }

    // Estructura
    if (data.estructura?.vertical) {
      await sql`
        UPDATE estructura_vertical SET
          tipo_estructura_vertical = ${data.estructura.vertical.tipo_estructura_vertical || null},
          tipo_muros_carga = ${data.estructura.vertical.tipo_muros_carga || null},
          patologias_estructura_vertical = ${data.estructura.vertical.patologias_estructura_vertical || null},
          fotos = ${data.estructura.vertical.fotos ? JSON.stringify(data.estructura.vertical.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estructura?.horizontal) {
      await sql`
        UPDATE estructura_horizontal SET
          tipo_vigas = ${data.estructura.horizontal.tipo_vigas || null},
          patologias_vigas = ${data.estructura.horizontal.patologias_vigas || null},
          tipo_viguetas = ${data.estructura.horizontal.tipo_viguetas || null},
          patologias_viguetas = ${data.estructura.horizontal.patologias_viguetas || null},
          fotos = ${data.estructura.horizontal.fotos ? JSON.stringify(data.estructura.horizontal.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estructura?.forjados) {
      await sql`
        UPDATE forjados SET
        tiene_desniveles = ${data.estructura.forjados.tiene_desniveles || null},
        patologias_forjados = ${data.estructura.forjados.patologias_forjados || null}
      WHERE informe_id = ${informeId}
      `
    }

      if (data.estructura?.soleras_losas) {
  await sql`
    UPDATE soleras_losas SET
      tiene_soleras = ${data.estructura.soleras_losas.tiene_soleras ?? null},
      patologias_soleras_losas = ${data.estructura.soleras_losas.patologias_soleras_losas ?? null},
      desniveles = ${data.estructura.soleras_losas.desniveles ?? null},
      tiene_capilaridades = ${data.estructura.soleras_losas.tiene_capilaridades ?? null}
    WHERE informe_id = ${informeId}
  `
}


     if (data.estructura?.voladizos) {
  await sql`
    UPDATE voladizos SET
      patologias_voladizos = ${data.estructura.voladizos.patologias_voladizos ?? null}
    WHERE informe_id = ${informeId}
  `
}


    if (data.estructura?.cubiertas) {
      await sql`
        UPDATE cubiertas SET
          tipo_cubierta = ${data.estructura.cubiertas.tipo_cubierta || null},
          subtipo = ${data.estructura.cubiertas.subtipo || null},
          acabado = ${data.estructura.cubiertas.acabado || null},
          cubierta_ventilada = ${data.estructura.cubiertas.cubierta_ventilada || null},
          tiene_aislamiento = ${data.estructura.cubiertas.tiene_aislamiento || null},
          aislamiento_estado_texto = ${data.estructura.cubiertas.aislamiento_estado_texto || null},
          impermeabilizacion = ${data.estructura.cubiertas.impermeabilizacion || null},
          impermeabilizacion_estado_texto = ${data.estructura.cubiertas.impermeabilizacion_estado_texto || null},
          fotos = ${data.estructura.cubiertas.fotos ? JSON.stringify(data.estructura.cubiertas.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estructura?.carpinterias) {
      await sql`
        UPDATE carpinterias SET
          material_carpinteria = ${data.estructura.carpinterias.material_carpinteria || null},
          rotura_puente_termico = ${data.estructura.carpinterias.rotura_puente_termico || false},
          aislamiento_termico_ventanas_estado = ${data.estructura.carpinterias.aislamiento_termico_ventanas_estado || null},
          aislamiento_acustico_ventanas_estado = ${data.estructura.carpinterias.aislamiento_acustico_ventanas_estado || null},
          cristales_con_camara_estado = ${data.estructura.carpinterias.cristales_con_camara_estado || null},
          sistema_oscurecimiento = ${data.estructura.carpinterias.sistema_oscurecimiento || null},
          puentes_termicos_persiana = ${data.estructura.carpinterias.puentes_termicos_persiana || false},
          material_persianas = ${data.estructura.carpinterias.material_persianas || null},
          recogida_persianas = ${data.estructura.carpinterias.recogida_persianas || null},
          caja_persianas = ${data.estructura.carpinterias.caja_persianas || null},
          tapa_cajon_persianas = ${data.estructura.carpinterias.tapa_cajon_persianas || null},
          fotos = ${data.estructura.carpinterias.fotos ? JSON.stringify(data.estructura.carpinterias.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }

    // Instalaciones
    if (data.instalaciones?.electrica) {
      await sql`
        UPDATE instalacion_electrica SET
          tiene_instalacion = ${data.instalaciones.electrica.tiene_instalacion || false},
          cuadro_en_norma = ${data.instalaciones.electrica.cuadro_en_norma || false},
          canalizaciones = ${data.instalaciones.electrica.canalizaciones || null},
          cajas_empalme_estado = ${data.instalaciones.electrica.cajas_empalme_estado || null},
          cableado_exterior = ${data.instalaciones.electrica.cableado_exterior || null},
          cableado_interior = ${data.instalaciones.electrica.cableado_interior || null},
          toma_tierra = ${data.instalaciones.electrica.toma_tierra || false},
          energias_renovables = ${data.instalaciones.electrica.energias_renovables || false},
          observaciones_texto = ${data.instalaciones.electrica.observaciones_texto || null},
          fotos = ${data.instalaciones.electrica.fotos ? JSON.stringify(data.instalaciones.electrica.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }

    if (data.instalaciones?.agua_acs) {
      await sql`
        UPDATE instalacion_agua_acs SET
          dispone_acs = ${data.instalaciones.agua_acs.dispone_acs || false},
          tipo_acs = ${data.instalaciones.agua_acs.tipo_acs || null},
          sistema_normativa = ${data.instalaciones.agua_acs.sistema_normativa || false},
          extraccion_acs = ${data.instalaciones.agua_acs.extraccion_acs || null},
          llave_paso_general = ${data.instalaciones.agua_acs.llave_paso_general || false},
          llave_paso_estado = ${data.instalaciones.agua_acs.llave_paso_estado || null},
          tuberias_empotradas = ${data.instalaciones.agua_acs.tuberias_empotradas || false},
          material_tuberias = ${data.instalaciones.agua_acs.material_tuberias || null},
          bajantes = ${data.instalaciones.agua_acs.bajantes || null},
          arquetas = ${data.instalaciones.agua_acs.arquetas || null},
          observaciones_texto = ${data.instalaciones.agua_acs.observaciones_texto || null},
          fotos = ${data.instalaciones.agua_acs.fotos ? JSON.stringify(data.instalaciones.agua_acs.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }

    if (data.instalaciones?.calefaccion) {
      await sql`
        UPDATE calefaccion SET
          dispone_calefaccion = ${data.instalaciones.calefaccion.dispone_calefaccion || false},
          tipo_calefaccion = ${data.instalaciones.calefaccion.tipo_calefaccion || null},
          sistema_normativa = ${data.instalaciones.calefaccion.sistema_normativa || false},
          estado_caldera = ${data.instalaciones.calefaccion.estado_caldera || null},
          tuberias_calefaccion = ${data.instalaciones.calefaccion.tuberias_calefaccion || null},
          tuberias_empotradas = ${data.instalaciones.calefaccion.tuberias_empotradas || false},
          tipo_emisor = ${data.instalaciones.calefaccion.tipo_emisor || null},
          extraccion_calefaccion = ${data.instalaciones.calefaccion.extraccion_calefaccion || null},
          observaciones_texto = ${data.instalaciones.calefaccion.observaciones_texto || null},
          fotos = ${data.instalaciones.calefaccion.fotos ? JSON.stringify(data.instalaciones.calefaccion.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }

    if (data.instalaciones?.climatizacion) {
      await sql`
        UPDATE climatizacion SET
          dispone_climatizacion = ${data.instalaciones.climatizacion.dispone_climatizacion || false}
        WHERE informe_id = ${informeId}
      `
    }

    // estancias (upsert sencillo)
    if (data.estancias_salon) {
      await sql`
        INSERT INTO estancias_salon (informe_id) VALUES (${informeId})
        ON CONFLICT (informe_id) DO NOTHING;
        UPDATE estancias_salon SET
          estado_general = ${data.estancias_salon.estado_general || null},
          pavimento = ${data.estancias_salon.pavimento || null},
          paredes_techos = ${data.estancias_salon.paredes_techos || null},
          ventanas_carpinteria = ${data.estancias_salon.ventanas_carpinteria || null},
          ventilacion_natural = ${data.estancias_salon.ventilacion_natural || false},
          iluminacion_natural = ${data.estancias_salon.iluminacion_natural || false},
          observaciones_texto = ${data.estancias_salon.observaciones_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estancias_cocina) {
      await sql`
        INSERT INTO estancias_cocina (informe_id) VALUES (${informeId})
        ON CONFLICT (informe_id) DO NOTHING;
        UPDATE estancias_cocina SET
          estado_general = ${data.estancias_cocina.estado_general || null},
          encimera_mobiliario = ${data.estancias_cocina.encimera_mobiliario || null},
          campana_extractora = ${data.estancias_cocina.campana_extractora || null},
          elec_adecuada = ${data.estancias_cocina.elec_adecuada || false},
          salida_humos = ${data.estancias_cocina.salida_humos || false},
          ventilacion_natural = ${data.estancias_cocina.ventilacion_natural || false},
          griferia_fregadero = ${data.estancias_cocina.griferia_fregadero || null},
          revestimientos = ${data.estancias_cocina.revestimientos || null},
          observaciones_texto = ${data.estancias_cocina.observaciones_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estancias_dormitorio) {
      await sql`
        INSERT INTO estancias_dormitorio (informe_id) VALUES (${informeId})
        ON CONFLICT (informe_id) DO NOTHING;
        UPDATE estancias_dormitorio SET
          estado_general = ${data.estancias_dormitorio.estado_general || null},
          pavimento = ${data.estancias_dormitorio.pavimento || null},
          paredes_techos = ${data.estancias_dormitorio.paredes_techos || null},
          ventanas_aislamiento = ${data.estancias_dormitorio.ventanas_aislamiento || null},
          ventilacion_natural = ${data.estancias_dormitorio.ventilacion_natural || false},
          iluminacion_natural = ${data.estancias_dormitorio.iluminacion_natural || false},
          humedades = ${data.estancias_dormitorio.humedades || false},
          observaciones_texto = ${data.estancias_dormitorio.observaciones_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estancias_bano) {
      await sql`
        INSERT INTO estancias_bano (informe_id) VALUES (${informeId})
        ON CONFLICT (informe_id) DO NOTHING;
        UPDATE estancias_bano SET
          estado_general = ${data.estancias_bano.estado_general || null},
          revestimientos = ${data.estancias_bano.revestimientos || null},
          fontaneria_sanitarios = ${data.estancias_bano.fontaneria_sanitarios || null},
          ventilacion = ${data.estancias_bano.ventilacion || null},
          humedades_filtraciones = ${data.estancias_bano.humedades_filtraciones || false},
          elec_adecuada = ${data.estancias_bano.elec_adecuada || false},
          observaciones_texto = ${data.estancias_bano.observaciones_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estancias_terraza) {
      await sql`
        INSERT INTO estancias_terraza (informe_id) VALUES (${informeId})
        ON CONFLICT (informe_id) DO NOTHING;
        UPDATE estancias_terraza SET
          tipo_terraza = ${data.estancias_terraza.tipo_terraza || null},
          pavimento_exterior = ${data.estancias_terraza.pavimento_exterior || null},
          barandilla_estado = ${data.estancias_terraza.barandilla_estado || null},
          impermeabilizacion = ${data.estancias_terraza.impermeabilizacion || false},
          grietas_fisuras = ${data.estancias_terraza.grietas_fisuras || false},
          observaciones_texto = ${data.estancias_terraza.observaciones_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estancias_garaje) {
      await sql`
        INSERT INTO estancias_garaje (informe_id) VALUES (${informeId})
        ON CONFLICT (informe_id) DO NOTHING;
        UPDATE estancias_garaje SET
          estado_general = ${data.estancias_garaje.estado_general || null},
          pavimento = ${data.estancias_garaje.pavimento || null},
          paredes_techos = ${data.estancias_garaje.paredes_techos || null},
          ventilacion = ${data.estancias_garaje.ventilacion || false},
          iluminacion = ${data.estancias_garaje.iluminacion || false},
          puerta_modo = ${data.estancias_garaje.puerta_modo || null},
          filtraciones = ${data.estancias_garaje.filtraciones || false},
          observaciones_texto = ${data.estancias_garaje.observaciones_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.estancias_sotano) {
      await sql`
        INSERT INTO estancias_sotano (informe_id) VALUES (${informeId})
        ON CONFLICT (informe_id) DO NOTHING;
        UPDATE estancias_sotano SET
          estado_general = ${data.estancias_sotano.estado_general || null},
          humedad = ${data.estancias_sotano.humedad || false},
          ventilacion = ${data.estancias_sotano.ventilacion || false},
          iluminacion = ${data.estancias_sotano.iluminacion || false},
          revestimientos = ${data.estancias_sotano.revestimientos || null},
          uso_actual = ${data.estancias_sotano.uso_actual || null},
          observaciones_texto = ${data.estancias_sotano.observaciones_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (data.jardin) {
      await sql`
        UPDATE jardin SET
          descripcion_corta = ${data.jardin.descripcion_corta || null},
          puerta_parcela = ${data.jardin.puerta_parcela || null},
          valla_perimetral = ${data.jardin.valla_perimetral || null},
          cesped = ${data.jardin.cesped || null},
          arboles = ${data.jardin.arboles || null},
          zona_pavimentada = ${data.jardin.zona_pavimentada || null},
          tarimas_madera = ${data.jardin.tarimas_madera || null},
          pergola_porche = ${data.jardin.pergola_porche || null},
          piscina = ${data.jardin.piscina || null},
          zona_barbacoa = ${data.jardin.zona_barbacoa || null},
          zona_ducha = ${data.jardin.zona_ducha || null},
          banos_exteriores = ${data.jardin.banos_exteriores || null},
          iluminacion_exterior = ${data.jardin.iluminacion_exterior || null},
          riego_automatico = ${data.jardin.riego_automatico || null},
          pozo = ${data.jardin.pozo || null},
          deposito_agua = ${data.jardin.deposito_agua || null},
          camaras_seguridad = ${data.jardin.camaras_seguridad || null},
          fachada_texto = ${data.jardin.fachada_texto || null},
          observaciones_texto = ${data.jardin.observaciones_texto || null},
          fotos = ${data.jardin.fotos ? JSON.stringify(data.jardin.fotos) : null}::jsonb
        WHERE informe_id = ${informeId}
      `
    }



    // Eficiencia
    if (data.eficiencia) {
      await sql`
        UPDATE eficiencia SET
          notas_texto = ${data.eficiencia.notas_texto || null},
          certificado_energetico = ${data.eficiencia.certificado_energetico || null},
          calificacion_energetica = ${data.eficiencia.calificacion_energetica || null},
          consumo_anual_estimado = ${data.eficiencia.consumo_anual_estimado || null}
        WHERE informe_id = ${informeId}
      `
    }

    // Siguientes pasos
    if (data.siguientes_pasos) {
      await sql`
        UPDATE siguientes_pasos SET
          obtener_presupuestos_texto = ${data.siguientes_pasos.obtener_presupuestos_texto || null},
          estudios_complementarios_texto = ${data.siguientes_pasos.estudios_complementarios_texto || null},
          descripcion_servicio_texto = ${data.siguientes_pasos.descripcion_servicio_texto || null},
          consejos_antes_comprar_texto = ${data.siguientes_pasos.consejos_antes_comprar_texto || null},
          consejos_mantenimiento_texto = ${data.siguientes_pasos.consejos_mantenimiento_texto || null}
        WHERE informe_id = ${informeId}
      `
    }

    if (isArquitecto) {
      approvalOverride = "pendiente"
    }

    if (approvalOverride) {
      await sql`
        UPDATE informes
        SET aprobado = ${approvalStateToDb(approvalOverride)}, updated_at = NOW()
        WHERE id = ${informeId}
      `
    }


    // 👇 devolvemos éxito directo (no re-leemos el informe para evitar 500)
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
    
  } catch (error) {
    console.error("[v0] Error al actualizar informe:", error)
    return NextResponse.json({ error: "Error al actualizar informe" }, { status: 500 })
  }
}

/* --------------------------------- PATCH --------------------------------- */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.rol !== "gestor") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await ctx.params
    const informeId = Number(id)
    if (!Number.isFinite(informeId)) {
      return NextResponse.json({ error: "ID de informe inválido" }, { status: 400 })
    }

    const payload = await request.json().catch(() => ({}))
    const desiredApproval = normalizeApprovalState(payload?.estado_aprobacion)

    if (!desiredApproval) {
      return NextResponse.json(
        { error: "Estado de aprobación inválido. Usa pendiente, aprobado o rechazado." },
        { status: 400 },
      )
    }

    await sql`
      UPDATE informes
      SET aprobado = ${approvalStateToDb(desiredApproval)}, updated_at = NOW()
      WHERE id = ${informeId}
    `

    return NextResponse.json({ ok: true, estado_aprobacion: desiredApproval })
  } catch (error) {
    console.error("[v0] Error al actualizar estado_aprobacion:", error)
    return NextResponse.json({ error: "Error al actualizar estado de aprobación" }, { status: 500 })
  }
}

/* -------------------------------- DELETE -------------------------------- */
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { id } = await ctx.params
    const informeId = Number(id)
    if (!Number.isFinite(informeId)) {
      return NextResponse.json({ error: "ID de informe inválido" }, { status: 400 })
    }

    const [informe] = await sql`SELECT inmueble_id FROM informes WHERE id = ${informeId}`
    if (!informe) return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 })

    // Borrar dependencias
    await sql`DELETE FROM inspectores WHERE informe_id = ${informeId}`
    await sql`DELETE FROM servicios_inmueble WHERE informe_id = ${informeId}`
    await sql`DELETE FROM condiciones_inspeccion WHERE informe_id = ${informeId}`
    await sql`DELETE FROM informacion_general WHERE informe_id = ${informeId}`

    await sql`DELETE FROM estructura_vertical WHERE informe_id = ${informeId}`
    await sql`DELETE FROM estructura_horizontal WHERE informe_id = ${informeId}`
    await sql`DELETE FROM forjados WHERE informe_id = ${informeId}`
    await sql`DELETE FROM soleras_losas WHERE informe_id = ${informeId}`
    await sql`DELETE FROM voladizos WHERE informe_id = ${informeId}`
    await sql`DELETE FROM cubiertas WHERE informe_id = ${informeId}`
    await sql`DELETE FROM carpinterias WHERE informe_id = ${informeId}`

    await sql`DELETE FROM instalacion_electrica WHERE informe_id = ${informeId}`
    await sql`DELETE FROM instalacion_agua_acs WHERE informe_id = ${informeId}`
    await sql`DELETE FROM calefaccion WHERE informe_id = ${informeId}`
    await sql`DELETE FROM climatizacion WHERE informe_id = ${informeId}`

    await sql`DELETE FROM estancias_salon WHERE informe_id = ${informeId}`
    await sql`DELETE FROM estancias_cocina WHERE informe_id = ${informeId}`
    await sql`DELETE FROM estancias_dormitorio WHERE informe_id = ${informeId}`
    await sql`DELETE FROM estancias_bano WHERE informe_id = ${informeId}`
    await sql`DELETE FROM estancias_terraza WHERE informe_id = ${informeId}`
    await sql`DELETE FROM estancias_garaje WHERE informe_id = ${informeId}`
    await sql`DELETE FROM estancias_sotano WHERE informe_id = ${informeId}`

    await sql`DELETE FROM jardin WHERE informe_id = ${informeId}`
    await sql`DELETE FROM eficiencia WHERE informe_id = ${informeId}`
    await sql`DELETE FROM siguientes_pasos WHERE informe_id = ${informeId}`

    await sql`DELETE FROM informes WHERE id = ${informeId}`

    if (informe.inmueble_id) {
      await sql`DELETE FROM inmuebles WHERE id = ${informe.inmueble_id}`
    }

    return NextResponse.json({ success: true, message: "Informe eliminado correctamente" })
  } catch (error) {
    console.error("[v0] Error al eliminar informe:", error)
    return NextResponse.json({ error: "Error al eliminar informe" }, { status: 500 })
  }
}
