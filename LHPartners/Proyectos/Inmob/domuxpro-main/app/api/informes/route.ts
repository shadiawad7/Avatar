// /app/api/informes/route.ts
export const dynamic = "force-dynamic"

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

function approvalStateToDb(value: InformeApprovalState | null): boolean | null {
  if (value === "aprobado") return true
  if (value === "rechazado") return false
  return null
}

function parseNumberParam(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// GET - Listar informes (cliente: por i.cliente_id; arquitecto: por i.arquitecto_id)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clienteParam = parseNumberParam(searchParams.get("cliente_id"))
    const arquitectoParam = parseNumberParam(searchParams.get("arquitecto_id"))
    const estadoAprobacionParam = normalizeApprovalState(searchParams.get("estado_aprobacion"))

    let filterClienteId: number | null = null
    let filterArquitectoId: number | null = null
    let filterEstadoAprobacion: InformeApprovalState | null = null

    if (session.rol === "gestor") {
      // El gestor puede filtrar por lo que envíe
      filterClienteId = clienteParam
      filterArquitectoId = arquitectoParam
      filterEstadoAprobacion = estadoAprobacionParam
    } else if (session.rol === "cliente") {
      // Un cliente solo puede ver sus informes
      if (clienteParam && clienteParam !== Number(session.userId)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
      filterClienteId = Number(session.userId)
      filterEstadoAprobacion = "aprobado"
    } else if (session.rol === "arquitecto") {
      // Resolver arquitecto.id a partir del usuario loggeado
      const arq = await sql`SELECT id FROM arquitectos WHERE usuario_id = ${Number(session.userId)} LIMIT 1`
      const arquitectoId = arq?.[0]?.id ?? null
      if (!arquitectoId) {
        return NextResponse.json({ informes: [] })
      }
      if (arquitectoParam && arquitectoParam !== arquitectoId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
      filterArquitectoId = arquitectoId
      // opcionalmente permitir filtrar por cliente adicionalmente
      if (clienteParam) filterClienteId = clienteParam
      filterEstadoAprobacion = estadoAprobacionParam
    } else {
      return NextResponse.json({ error: "Rol no soportado" }, { status: 403 })
    }

    const estadoFilterClause =
      filterEstadoAprobacion === null
        ? sql``
        : filterEstadoAprobacion === "aprobado"
          ? sql`AND i.aprobado IS TRUE`
          : filterEstadoAprobacion === "rechazado"
            ? sql`AND i.aprobado IS FALSE`
            : sql`AND i.aprobado IS NULL`

    // 🚫 Nada de sql.join — usa fragmentos condicionales:
    const informes = await sql`
      SELECT 
        i.id,
        i.estado,
        i.aprobado,
        CASE
          WHEN i.aprobado IS TRUE THEN 'aprobado'
          WHEN i.aprobado IS FALSE THEN 'rechazado'
          ELSE 'pendiente'
        END AS estado_aprobacion,
        i.coste_estimado_reparacion,
        i.created_at,
        i.updated_at,
        i.cliente_id,
        i.arquitecto_id,
        inm.direccion,
        inm.ref_catastral,
        inm.tipo_propiedad,
        ins.nombre AS inspector_nombre,
        ins.apellido AS inspector_apellido,
        ucli.nombre AS cliente_nombre,
        ucli.apellido AS cliente_apellido,
        uarq.nombre AS arquitecto_nombre,
        uarq.apellido AS arquitecto_apellido
      FROM informes i
      LEFT JOIN inmuebles  inm ON i.inmueble_id  = inm.id
      LEFT JOIN inspectores ins ON i.id          = ins.informe_id
      LEFT JOIN usuarios   ucli ON i.cliente_id  = ucli.id
      LEFT JOIN arquitectos arq ON i.arquitecto_id = arq.id
      LEFT JOIN usuarios   uarq ON arq.usuario_id  = uarq.id
      WHERE 1=1
        ${filterClienteId   !== null ? sql`AND i.cliente_id   = ${filterClienteId}`     : sql``}
        ${filterArquitectoId!== null ? sql`AND i.arquitecto_id= ${filterArquitectoId}`  : sql``}
        ${estadoFilterClause}
      ORDER BY i.created_at DESC
    `

    return NextResponse.json({ informes })
  } catch (error) {
    console.error("[v0] Error al obtener informes:", error)
    return NextResponse.json({ error: "Error al obtener informes" }, { status: 500 })
  }
}


// POST - Crear nuevo informe
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, data } = body

    console.log("[v0] Creando nuevo informe tipo:", tipo)

    if (!tipo || !["basico", "tecnico", "documental"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo de informe inválido" }, { status: 400 })
    }

    const parseOptionalNumber = (value: unknown): number | null => {
      if (value === null || value === undefined) return null
      if (typeof value === "string" && value.trim() === "") return null
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || parsed <= 0) return null
      return parsed
    }

    const bodyClienteId = parseOptionalNumber(body?.clienteId)
    const bodyAsignacionId = parseOptionalNumber(body?.asignacionId)
    const bodyArquitectoId = parseOptionalNumber(body?.arquitectoId ?? data?.informes?.arquitecto_id)

    let resolvedClienteId = bodyClienteId
    let resolvedArquitectoId = bodyArquitectoId
    const providedApprovalState =
      normalizeApprovalState(body?.estado_aprobacion ?? data?.informes?.estado_aprobacion) ?? null

    type RawAsignacionRow = {
      id: number
      cliente_id: number | null
      arquitecto_id: number | null
      informe_id: number | null
      arquitecto_usuario_id: number | null
    }

    let asignacionRow: RawAsignacionRow | null = null
    let asignacionClienteId: number | null = null
    let asignacionArquitectoId: number | null = null

    if (bodyAsignacionId !== null) {
      const rows = await sql`
        SELECT
          a.id,
          a.cliente_id,
          a.arquitecto_id,
          a.informe_id,
          arq.usuario_id AS arquitecto_usuario_id
        FROM asignaciones a
        LEFT JOIN arquitectos arq ON a.arquitecto_id = arq.id
        WHERE a.id = ${bodyAsignacionId}
        LIMIT 1
      `
      asignacionRow = rows?.[0] ?? null
      if (!asignacionRow) {
        return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 })
      }
      if (asignacionRow.informe_id) {
        return NextResponse.json({ error: "La asignación ya tiene un informe asociado" }, { status: 409 })
      }
      asignacionClienteId =
        asignacionRow.cliente_id != null ? Number(asignacionRow.cliente_id) : null
      asignacionArquitectoId =
        asignacionRow.arquitecto_id != null ? Number(asignacionRow.arquitecto_id) : null
    }

    if (asignacionRow) {
      if (resolvedClienteId === null && asignacionClienteId != null) {
        resolvedClienteId = asignacionClienteId
      }
      if (resolvedArquitectoId === null && asignacionArquitectoId != null) {
        resolvedArquitectoId = asignacionArquitectoId
      }
    }

    if (session.rol === "arquitecto") {
      const arquitectoRows = await sql`
        SELECT id
        FROM arquitectos
        WHERE usuario_id = ${Number(session.userId)}
        LIMIT 1
      `
      const arquitectoId = arquitectoRows?.[0]?.id ?? null
      if (!arquitectoId) {
        return NextResponse.json({ error: "Arquitecto no encontrado para el usuario" }, { status: 403 })
      }
      if (asignacionRow) {
        const asignacionUsuarioId =
          asignacionRow.arquitecto_usuario_id != null ? Number(asignacionRow.arquitecto_usuario_id) : null
        const sessionUserId = Number(session.userId)
        const coincideArquitecto =
          (asignacionArquitectoId != null && asignacionArquitectoId === arquitectoId) ||
          (asignacionUsuarioId != null && asignacionUsuarioId === sessionUserId)
        if (asignacionArquitectoId != null && !coincideArquitecto) {
          return NextResponse.json({ error: "No puedes crear informes para esta asignación" }, { status: 403 })
        }
      }
      resolvedArquitectoId = arquitectoId
      if (resolvedClienteId === null) {
        if (asignacionClienteId != null) {
          resolvedClienteId = asignacionClienteId
        } else {
          return NextResponse.json({ error: "Falta el cliente asociado al informe" }, { status: 400 })
        }
      }
    } else {
      // Permitir que gestores u otros roles definan manualmente los IDs
      if (resolvedClienteId === null) {
        const clienteDesdeFormulario = parseOptionalNumber(data?.informes?.cliente_id)
        if (clienteDesdeFormulario !== null) {
          resolvedClienteId = clienteDesdeFormulario
        }
      }
      if (resolvedArquitectoId === null) {
        const arquitectoDesdeFormulario = parseOptionalNumber(data?.informes?.arquitecto_id)
        if (arquitectoDesdeFormulario !== null) {
          resolvedArquitectoId = arquitectoDesdeFormulario
        }
      }
    }

    if (resolvedClienteId === null) {
      return NextResponse.json({ error: "Debes indicar el cliente del informe" }, { status: 400 })
    }
    if (resolvedArquitectoId === null) {
      return NextResponse.json({ error: "Debes indicar el arquitecto responsable" }, { status: 400 })
    }

    /* INMUEBLES (incluye fotos::jsonb) */
    const [inmueble] = await sql`
      INSERT INTO inmuebles (
        direccion, ref_catastral, anno_construccion, metros_cuadrados,
        orientacion, parcela, tipo_propiedad, planta, ampliado_reformado,
        cambio_uso, ventilacion_cruzada, ventilacion_general, iluminacion,
        fotos
      ) VALUES (
        ${data.inmuebles?.direccion || ""},
        ${data.inmuebles?.ref_catastral || null},
        ${data.inmuebles?.anno_construccion || null},
        ${data.inmuebles?.metros_cuadrados || null},
        ${data.inmuebles?.orientacion || null},
        ${data.inmuebles?.parcela || null},
        ${data.inmuebles?.tipo_propiedad || null},
        ${data.inmuebles?.planta || null},
        ${data.inmuebles?.ampliado_reformado || false},
        ${data.inmuebles?.cambio_uso || false},
        ${data.inmuebles?.ventilacion_cruzada || null},
        ${data.inmuebles?.ventilacion_general || null},
        ${data.inmuebles?.iluminacion || null},
        ${data.inmuebles?.fotos ? JSON.stringify(data.inmuebles.fotos) : null}::jsonb
      )
      RETURNING id
    `

    /* INFORMES */
    let estadoAprobacion: InformeApprovalState = "pendiente"
    if (session.rol === "gestor" && providedApprovalState) {
      estadoAprobacion = providedApprovalState
    }
    const aprobadoValor = approvalStateToDb(estadoAprobacion)

    const [informe] = await sql`
      INSERT INTO informes (
        inmueble_id,
        estado,
        aprobado,
        coste_estimado_reparacion,
        resumen_ejecutivo_texto,
        cliente_id,
        arquitecto_id
      ) VALUES (
        ${inmueble.id},
        ${data.informes?.estado || "borrador"},
        ${aprobadoValor},
        ${data.informes?.coste_estimado_reparacion || 0},
        ${data.informes?.resumen_ejecutivo_texto || ""},
        ${resolvedClienteId},
        ${resolvedArquitectoId}
      )
      RETURNING id
    `
    const informeId = informe.id

    if (asignacionRow) {
      await sql`
        UPDATE asignaciones
        SET informe_id = ${informeId}, creado = TRUE, arquitecto_id = ${resolvedArquitectoId}, updated_at = NOW()
        WHERE id = ${asignacionRow.id}
      `
    }

    /* INSPECTOR */
    if (data.inspectores) {
      await sql`
        INSERT INTO inspectores (
          informe_id, nombre, apellido, fecha_inspeccion, contacto, titulacion, 
          num_colegiado, declaracion_firma_texto
        ) VALUES (
          ${informeId},
          ${data.inspectores.nombre || ""},
          ${data.inspectores.apellido || ""},
          ${data.inspectores.fecha_inspeccion || null},
          ${data.inspectores.contacto || null},
          ${data.inspectores.titulacion || null},
          ${data.inspectores.num_colegiado || null},
          ${data.inspectores.declaracion_firma_texto || null}
        )
      `
    }

    /* SERVICIOS DEL INMUEBLE */
    if (data.servicios_inmueble) {
      await sql`
        INSERT INTO servicios_inmueble (
          informe_id, agua, gas, electricidad, internet, gasoil, renovables
        ) VALUES (
          ${informeId},
          ${data.servicios_inmueble.agua || false},
          ${data.servicios_inmueble.gas || false},
          ${data.servicios_inmueble.electricidad || false},
          ${data.servicios_inmueble.internet || false},
          ${data.servicios_inmueble.gasoil || false},
          ${data.servicios_inmueble.renovables || false}
        )
      `
    }

    /* CONDICIONES DE INSPECCIÓN */
    if (data.condiciones_inspeccion) {
      await sql`
        INSERT INTO condiciones_inspeccion (
          informe_id, temp_ambiente, lluvia_ultimos_3d, tiempo_atmosferico,
          zona_ruidosa, sup_exterior, trafico
        ) VALUES (
          ${informeId},
          ${data.condiciones_inspeccion.temp_ambiente || null},
          ${data.condiciones_inspeccion.lluvia_ultimos_3d || false},
          ${data.condiciones_inspeccion.tiempo_atmosferico || null},
          ${data.condiciones_inspeccion.zona_ruidosa || false},
          ${data.condiciones_inspeccion.sup_exterior || null},
          ${data.condiciones_inspeccion.trafico || null}
        )
      `
    }

    /* INFORMACIÓN GENERAL (fotos::jsonb) */
    if (data.informacion_general) {
      await sql`
        INSERT INTO informacion_general (
          informe_id, puerta_entrada_estado, patio_luces_estado, patio_ventilacion_estado,
          ascensor_estado, vestibulo_estado, fachadas_estado, jardines_estado,
          posib_ascensor, descripcion_general_texto, fotos
        ) VALUES (
          ${informeId},
          ${data.informacion_general.puerta_entrada_estado || null},
          ${data.informacion_general.patio_luces_estado || null},
          ${data.informacion_general.patio_ventilacion_estado || null},
          ${data.informacion_general.ascensor_estado || null},
          ${data.informacion_general.vestibulo_estado || null},
          ${data.informacion_general.fachadas_estado || null},
          ${data.informacion_general.jardines_estado || null},
          ${data.informacion_general.posib_ascensor || false},
          ${data.informacion_general.descripcion_general_texto || null},
          ${data.informacion_general.fotos ? JSON.stringify(data.informacion_general.fotos) : null}::jsonb
        )
      `
    }

    /* ----- SECCIONES TÉCNICAS / DOCUMENTALES ----- */
    if (tipo === "tecnico" || tipo === "documental") {
      // ESTRUCTURA VERTICAL (fotos::jsonb)
      if (data.estructura_vertical) {
        await sql`
          INSERT INTO estructura_vertical (
            informe_id, tipo_estructura_vertical, tipo_muros_carga, patologias_estructura_vertical, fotos
          ) VALUES (
            ${informeId},
            ${data.estructura_vertical.tipo_estructura_vertical || null},
            ${data.estructura_vertical.tipo_muros_carga || null},
            ${data.estructura_vertical.patologias_estructura_vertical || null},
            ${data.estructura_vertical.fotos ? JSON.stringify(data.estructura_vertical.fotos) : null}::jsonb
          )
        `
      }

      // ESTRUCTURA HORIZONTAL (fotos::jsonb)
      if (data.estructura_horizontal) {
        await sql`
          INSERT INTO estructura_horizontal (
            informe_id, tipo_vigas, patologias_vigas, tipo_viguetas, patologias_viguetas, fotos
          ) VALUES (
            ${informeId},
            ${data.estructura_horizontal.tipo_vigas || null},
            ${data.estructura_horizontal.patologias_vigas || null},
            ${data.estructura_horizontal.tipo_viguetas || null},
            ${data.estructura_horizontal.patologias_viguetas || null},
            ${data.estructura_horizontal.fotos ? JSON.stringify(data.estructura_horizontal.fotos) : null}::jsonb
          )
        `
      }

      // FORJADOS
      if (data.forjados) {
        await sql`
          INSERT INTO forjados (
            informe_id, tiene_desniveles, patologias_forjados
          ) VALUES (
            ${informeId},
            ${data.forjados.tiene_desniveles || false},
            ${data.forjados.patologias_forjados || null}
          )
        `
      }

      // SOLERAS/LOSAS
      if (data.soleras_losas) {
        await sql`
          INSERT INTO soleras_losas (
            informe_id, tiene_soleras, tiene_capilaridades, desniveles, patologias_soleras_losas
          ) VALUES (
            ${informeId},
            ${data.soleras_losas.tiene_soleras || false},
            ${data.soleras_losas.tiene_capilaridades || false},
            ${data.soleras_losas.desniveles || false},
            ${data.soleras_losas.patologias_soleras_losas || null}
          )
        `
      }

      // VOLADIZOS
      if (data.voladizos) {
        await sql`
          INSERT INTO voladizos (
            informe_id, patologias_voladizos
          ) VALUES (
            ${informeId},
            ${data.voladizos.patologias_voladizos || null}
          )
        `
      }

      // CUBIERTAS (fotos::jsonb)
      if (data.cubiertas) {
        await sql`
          INSERT INTO cubiertas (
            informe_id, tipo_cubierta, subtipo, acabado, cubierta_ventilada,
            tiene_aislamiento, aislamiento_estado_texto, impermeabilizacion,
            impermeabilizacion_estado_texto, fotos
          ) VALUES (
            ${informeId},
            ${data.cubiertas.tipo_cubierta || null},
            ${data.cubiertas.subtipo || null},
            ${data.cubiertas.acabado || null},
            ${data.cubiertas.cubierta_ventilada || false},
            ${data.cubiertas.tiene_aislamiento || false},
            ${data.cubiertas.aislamiento_estado_texto || null},
            ${data.cubiertas.impermeabilizacion || false},
            ${data.cubiertas.impermeabilizacion_estado_texto || null},
            ${data.cubiertas.fotos ? JSON.stringify(data.cubiertas.fotos) : null}::jsonb
          )
        `
      }

      // INSTALACIÓN ELÉCTRICA (fotos::jsonb)
      if (data.instalacion_electrica) {
        await sql`
          INSERT INTO instalacion_electrica (
            informe_id, tiene_instalacion, cuadro_en_norma, canalizaciones,
            cajas_empalme_estado, cableado_exterior, cableado_interior,
            toma_tierra, energias_renovables, observaciones_texto, fotos
          ) VALUES (
            ${informeId},
            ${data.instalacion_electrica.tiene_instalacion || false},
            ${data.instalacion_electrica.cuadro_en_norma || false},
            ${data.instalacion_electrica.canalizaciones || null},
            ${data.instalacion_electrica.cajas_empalme_estado || null},
            ${data.instalacion_electrica.cableado_exterior || null},
            ${data.instalacion_electrica.cableado_interior || null},
            ${data.instalacion_electrica.toma_tierra || false},
            ${data.instalacion_electrica.energias_renovables || false},
            ${data.instalacion_electrica.observaciones_texto || null},
            ${data.instalacion_electrica.fotos ? JSON.stringify(data.instalacion_electrica.fotos) : null}::jsonb
          )
        `
      }

      // INSTALACIÓN AGUA/ACS (bajantes, arquetas como texto) (fotos::jsonb)
      if (data.instalacion_agua_acs) {
        await sql`
          INSERT INTO instalacion_agua_acs (
            informe_id, dispone_acs, tipo_acs, sistema_normativa, extraccion_acs,
            llave_paso_general, llave_paso_estado, tuberias_empotradas,
            material_tuberias, bajantes, arquetas, observaciones_texto, fotos
          ) VALUES (
            ${informeId},
            ${data.instalacion_agua_acs.dispone_acs || false},
            ${data.instalacion_agua_acs.tipo_acs || null},
            ${data.instalacion_agua_acs.sistema_normativa || false},
            ${data.instalacion_agua_acs.extraccion_acs || null},
            ${data.instalacion_agua_acs.llave_paso_general || false},
            ${data.instalacion_agua_acs.llave_paso_estado || null},
            ${data.instalacion_agua_acs.tuberias_empotradas || false},
            ${data.instalacion_agua_acs.material_tuberias || null},
            ${data.instalacion_agua_acs.bajantes || null},
            ${data.instalacion_agua_acs.arquetas || null},
            ${data.instalacion_agua_acs.observaciones_texto || null},
            ${data.instalacion_agua_acs.fotos ? JSON.stringify(data.instalacion_agua_acs.fotos) : null}::jsonb
          )
        `
      }

      // CALEFACCIÓN (fotos::jsonb)
      if (data.calefaccion) {
        await sql`
          INSERT INTO calefaccion (
            informe_id, dispone_calefaccion, tipo_calefaccion, sistema_normativa,
            estado_caldera, tuberias_calefaccion, tuberias_empotradas,
            tipo_emisor, extraccion_calefaccion, observaciones_texto, fotos
          ) VALUES (
            ${informeId},
            ${data.calefaccion.dispone_calefaccion || false},
            ${data.calefaccion.tipo_calefaccion || null},
            ${data.calefaccion.sistema_normativa || false},
            ${data.calefaccion.estado_caldera || null},
            ${data.calefaccion.tuberias_calefaccion || null},
            ${data.calefaccion.tuberias_empotradas || false},
            ${data.calefaccion.tipo_emisor || null},
            ${data.calefaccion.extraccion_calefaccion || null},
            ${data.calefaccion.observaciones_texto || null},
            ${data.calefaccion.fotos ? JSON.stringify(data.calefaccion.fotos) : null}::jsonb
          )
        `
      }

      // CLIMATIZACIÓN
      if (data.climatizacion) {
        await sql`
          INSERT INTO climatizacion (informe_id, dispone_climatizacion)
          VALUES (${informeId}, ${data.climatizacion.dispone_climatizacion || false})
        `
      }

      // CARPINTERÍAS (fotos::jsonb)
      if (data.carpinterias) {
        await sql`
          INSERT INTO carpinterias (
            informe_id, material_carpinteria, rotura_puente_termico,
            aislamiento_termico_ventanas_estado, aislamiento_acustico_ventanas_estado,
            cristales_con_camara_estado, sistema_oscurecimiento, puentes_termicos_persiana,
            material_persianas, recogida_persianas, caja_persianas, tapa_cajon_persianas, fotos
          ) VALUES (
            ${informeId},
            ${data.carpinterias.material_carpinteria || null},
            ${data.carpinterias.rotura_puente_termico || false},
            ${data.carpinterias.aislamiento_termico_ventanas_estado || null},
            ${data.carpinterias.aislamiento_acustico_ventanas_estado || null},
            ${data.carpinterias.cristales_con_camara_estado || null},
            ${data.carpinterias.sistema_oscurecimiento || null},
            ${data.carpinterias.puentes_termicos_persiana || false},
            ${data.carpinterias.material_persianas || null},
            ${data.carpinterias.recogida_persianas || null},
            ${data.carpinterias.caja_persianas || null},
            ${data.carpinterias.tapa_cajon_persianas || null},
            ${data.carpinterias.fotos ? JSON.stringify(data.carpinterias.fotos) : null}::jsonb
          )
        `
      }

      // JARDÍN (fotos::jsonb)
      if (data.jardin) {
        await sql`
          INSERT INTO jardin (
            informe_id, descripcion_corta, puerta_parcela, valla_perimetral, cesped, arboles,
            zona_pavimentada, tarimas_madera, pergola_porche, piscina, zona_barbacoa,
            zona_ducha, banos_exteriores, iluminacion_exterior, riego_automatico,
            pozo, deposito_agua, camaras_seguridad, fachada_texto, observaciones_texto, fotos
          ) VALUES (
            ${informeId},
            ${data.jardin.descripcion_corta || null},
            ${data.jardin.puerta_parcela || null},
            ${data.jardin.valla_perimetral || null},
            ${data.jardin.cesped || null},
            ${data.jardin.arboles || null},
            ${data.jardin.zona_pavimentada || null},
            ${data.jardin.tarimas_madera || null},
            ${data.jardin.pergola_porche || null},
            ${data.jardin.piscina || null},
            ${data.jardin.zona_barbacoa || null},
            ${data.jardin.zona_ducha || null},
            ${data.jardin.banos_exteriores || null},
            ${data.jardin.iluminacion_exterior || null},
            ${data.jardin.riego_automatico || null},
            ${data.jardin.pozo || null},
            ${data.jardin.deposito_agua || null},
            ${data.jardin.camaras_seguridad || null},
            ${data.jardin.fachada_texto || null},
            ${data.jardin.observaciones_texto || null},
            ${data.jardin.fotos ? JSON.stringify(data.jardin.fotos) : null}::jsonb
          )
        `
      }

      // 🔹 estanciasS ESPECÍFICAS (opcionales)
      if (data.estancias_salon) {
        await sql`
          INSERT INTO estancias_salon (
            informe_id, estado_general, pavimento, paredes_techos, ventanas_carpinteria,
            ventilacion_natural, iluminacion_natural, observaciones_texto
          ) VALUES (
            ${informeId},
            ${data.estancias_salon.estado_general || null},
            ${data.estancias_salon.pavimento || null},
            ${data.estancias_salon.paredes_techos || null},
            ${data.estancias_salon.ventanas_carpinteria || null},
            ${data.estancias_salon.ventilacion_natural || false},
            ${data.estancias_salon.iluminacion_natural || false},
            ${data.estancias_salon.observaciones_texto || null}
          )
        `
      }

      if (data.estancias_cocina) {
        await sql`
          INSERT INTO estancias_cocina (
            informe_id, estado_general, encimera_mobiliario, campana_extractora, elec_adecuada,
            salida_humos, ventilacion_natural, griferia_fregadero, revestimientos, observaciones_texto
          ) VALUES (
            ${informeId},
            ${data.estancias_cocina.estado_general || null},
            ${data.estancias_cocina.encimera_mobiliario || null},
            ${data.estancias_cocina.campana_extractora || null},
            ${data.estancias_cocina.elec_adecuada || false},
            ${data.estancias_cocina.salida_humos || false},
            ${data.estancias_cocina.ventilacion_natural || false},
            ${data.estancias_cocina.griferia_fregadero || null},
            ${data.estancias_cocina.revestimientos || null},
            ${data.estancias_cocina.observaciones_texto || null}
          )
        `
      }

      if (data.estancias_dormitorio) {
        await sql`
          INSERT INTO estancias_dormitorio (
            informe_id, estado_general, pavimento, paredes_techos, ventanas_aislamiento,
            ventilacion_natural, iluminacion_natural, humedades, observaciones_texto
          ) VALUES (
            ${informeId},
            ${data.estancias_dormitorio.estado_general || null},
            ${data.estancias_dormitorio.pavimento || null},
            ${data.estancias_dormitorio.paredes_techos || null},
            ${data.estancias_dormitorio.ventanas_aislamiento || null},
            ${data.estancias_dormitorio.ventilacion_natural || false},
            ${data.estancias_dormitorio.iluminacion_natural || false},
            ${data.estancias_dormitorio.humedades || false},
            ${data.estancias_dormitorio.observaciones_texto || null}
          )
        `
      }

      if (data.estancias_bano) {
        await sql`
          INSERT INTO estancias_bano (
            informe_id, estado_general, revestimientos, fontaneria_sanitarios, ventilacion,
            humedades_filtraciones, elec_adecuada, observaciones_texto
          ) VALUES (
            ${informeId},
            ${data.estancias_bano.estado_general || null},
            ${data.estancias_bano.revestimientos || null},
            ${data.estancias_bano.fontaneria_sanitarios || null},
            ${data.estancias_bano.ventilacion || null},
            ${data.estancias_bano.humedades_filtraciones || false},
            ${data.estancias_bano.elec_adecuada || false},
            ${data.estancias_bano.observaciones_texto || null}
          )
        `
      }

      if (data.estancias_terraza) {
        await sql`
          INSERT INTO estancias_terraza (
            informe_id, tipo_terraza, pavimento_exterior, barandilla_estado,
            impermeabilizacion, grietas_fisuras, observaciones_texto
          ) VALUES (
            ${informeId},
            ${data.estancias_terraza.tipo_terraza || null},
            ${data.estancias_terraza.pavimento_exterior || null},
            ${data.estancias_terraza.barandilla_estado || null},
            ${data.estancias_terraza.impermeabilizacion || false},
            ${data.estancias_terraza.grietas_fisuras || false},
            ${data.estancias_terraza.observaciones_texto || null}
          )
        `
      }

      if (data.estancias_garaje) {
        await sql`
          INSERT INTO estancias_garaje (
            informe_id, estado_general, pavimento, paredes_techos, ventilacion,
            iluminacion, puerta_modo, filtraciones, observaciones_texto
          ) VALUES (
            ${informeId},
            ${data.estancias_garaje.estado_general || null},
            ${data.estancias_garaje.pavimento || null},
            ${data.estancias_garaje.paredes_techos || null},
            ${data.estancias_garaje.ventilacion || false},
            ${data.estancias_garaje.iluminacion || false},
            ${data.estancias_garaje.puerta_modo || null},
            ${data.estancias_garaje.filtraciones || false},
            ${data.estancias_garaje.observaciones_texto || null}
          )
        `
      }

      if (data.estancias_sotano) {
        await sql`
          INSERT INTO estancias_sotano (
            informe_id, estado_general, humedad, ventilacion, iluminacion,
            revestimientos, uso_actual, observaciones_texto
          ) VALUES (
            ${informeId},
            ${data.estancias_sotano.estado_general || null},
            ${data.estancias_sotano.humedad || false},
            ${data.estancias_sotano.ventilacion || false},
            ${data.estancias_sotano.iluminacion || false},
            ${data.estancias_sotano.revestimientos || null},
            ${data.estancias_sotano.uso_actual || null},
            ${data.estancias_sotano.observaciones_texto || null}
          )
        `
      }
    }

    /* ----- EXTRA DOCUMENTAL ----- */
    if (tipo === "documental") {
      // EFICIENCIA
        if (data.eficiencia) {
          await sql`
            INSERT INTO eficiencia (
              informe_id,
              notas_texto,
              certificado_energetico,
              calificacion_energetica,
              consumo_anual_estimado
            ) VALUES (
              ${informeId},
              ${data.eficiencia.notas_texto || null},
              ${data.eficiencia.certificado_energetico || null},
              ${data.eficiencia.calificacion_energetica || null},
              ${data.eficiencia.consumo_anual_estimado || null}
            )
          `
        }


              // SIGUIENTES PASOS
              if (data.siguientes_pasos) {
                await sql`
                  INSERT INTO siguientes_pasos (
                    informe_id, obtener_presupuestos_texto, estudios_complementarios_texto,
                    descripcion_servicio_texto, consejos_antes_comprar_texto, consejos_mantenimiento_texto
                  ) VALUES (
                    ${informeId},
                    ${data.siguientes_pasos.obtener_presupuestos_texto || null},
                    ${data.siguientes_pasos.estudios_complementarios_texto || null},
                    ${data.siguientes_pasos.descripcion_servicio_texto || null},
                    ${data.siguientes_pasos.consejos_antes_comprar_texto || null},
                    ${data.siguientes_pasos.consejos_mantenimiento_texto || null}
                  )
                `
              }



      // RESUMEN MÉTRICAS
      if (data.resumen_inspeccion_metricas) {
        await sql`
          INSERT INTO resumen_inspeccion_metricas (
            informe_id, puntos_inspeccionados, puntos_no_inspeccionados,
            necesitan_reparacion, no_necesitan_reparacion, defectos_graves
          ) VALUES (
            ${informeId},
            ${data.resumen_inspeccion_metricas.puntos_inspeccionados || 0},
            ${data.resumen_inspeccion_metricas.puntos_no_inspeccionados || 0},
            ${data.resumen_inspeccion_metricas.necesitan_reparacion || 0},
            ${data.resumen_inspeccion_metricas.no_necesitan_reparacion || 0},
            ${data.resumen_inspeccion_metricas.defectos_graves || 0}
          )
        `
      }
    }

    console.log("[v0] Informe creado exitosamente con ID:", informeId)
    return NextResponse.json({ success: true, informeId }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error al crear informe:", error)
    return NextResponse.json({ error: "Error al crear informe", details: String(error) }, { status: 500 })
  }
}
