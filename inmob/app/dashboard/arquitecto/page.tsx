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
import { Briefcase, ClipboardList, FileText, TrendingUp, Building2, Mail, Phone, Check, X } from "lucide-react"

interface Asignacion {
  id: number
  informe_id: number
  arquitecto_id: number
  cliente_id: number | null
  notas: string | null
  estado: "pendiente" | "aceptada" | "rechazada"
  fecha_asignacion: string
  updated_at: string
  fecha_respuesta?: string | null
  informe_direccion?: string
  informe_estado?: string
  tipo_informe?: string
  cliente_nombre?: string
  cliente_apellido?: string
  cliente_email?: string
}

interface InformeResumen {
  id: number
  estado: string
  coste_estimado_reparacion: number | null
  created_at: string
  direccion?: string | null
  tipo_propiedad?: string | null
  ref_catastral?: string | null
  cliente_id?: number | null
  cliente_nombre?: string | null
  cliente_apellido?: string | null
}

export default function ArquitectoDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("asignacion")
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [informes, setInformes] = useState<InformeResumen[]>([])
  const [informesLoading, setInformesLoading] = useState(true)

  // Cargar asignaciones en cuanto tengamos el user (o sepamos que no hay)
  useEffect(() => {
    const fetchAsignaciones = async () => {
      if (authLoading) return
      if (!user?.id) {
        setAsignaciones([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch("/api/asignaciones", { credentials: "include" })
        if (!res.ok) {
          if (res.status !== 401) {
            console.error("[arquitecto] Error al obtener asignaciones:", res.status)
          }
          setAsignaciones([])
          return
        }
        const data = await res.json()
        setAsignaciones(data.asignaciones || [])
      } catch (error) {
        console.error("[arquitecto] Error inesperado al cargar asignaciones:", error)
        setAsignaciones([])
      } finally {
        setLoading(false)
      }
    }

    fetchAsignaciones()
  }, [authLoading, user?.id])

  useEffect(() => {
    const fetchInformes = async () => {
      if (authLoading) return
      if (!user?.id) {
        setInformes([])
        setInformesLoading(false)
        return
      }
      setInformesLoading(true)
      try {
        const res = await fetch("/api/informes", { credentials: "include" })
        if (!res.ok) {
          if (res.status !== 401) {
            console.error("[arquitecto] Error al obtener informes:", res.status)
          }
          setInformes([])
          return
        }
        const data = await res.json()
        setInformes(data.informes || [])
      } catch (error) {
        console.error("[arquitecto] Error inesperado al cargar informes:", error)
        setInformes([])
      } finally {
        setInformesLoading(false)
      }
    }
    fetchInformes()
  }, [authLoading, user?.id])

  const asignacionesPendientes = asignaciones.filter((a) => a.estado === "pendiente")
  const asignacionesAceptadas = asignaciones.filter((a) => a.estado === "aceptada")
  const totalSolicitudes = asignaciones.length
  const totalInformes = informes.length

  const handleAceptarAsignacion = async (asignacionId: number) => {
    try {
      const response = await fetch(`/api/asignaciones/${asignacionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado: "aceptada" }),
      })

      if (response.ok) {
        setAsignaciones((prev) =>
          prev.map((a) =>
            a.id === asignacionId ? { ...a, estado: "aceptada", fecha_respuesta: new Date().toISOString() } : a,
          ),
        )
        alert("Asignación aceptada correctamente")
      } else {
        alert("Error al aceptar la asignación")
      }
    } catch (error) {
      console.error("[v0] Error al aceptar asignación:", error)
      alert("Error al aceptar la asignación")
    }
  }

  const handleRechazarAsignacion = async (asignacionId: number) => {
    if (!confirm("¿Estás seguro de que quieres rechazar esta asignación?")) return

    try {
      const response = await fetch(`/api/asignaciones/${asignacionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado: "rechazada" }),
      })

      if (response.ok) {
        setAsignaciones((prev) =>
          prev.map((a) =>
            a.id === asignacionId ? { ...a, estado: "rechazada", fecha_respuesta: new Date().toISOString() } : a,
          ),
        )
        alert("Asignación rechazada")
      } else {
        alert("Error al rechazar la asignación")
      }
    } catch (error) {
      console.error("[v0] Error al rechazar asignación:", error)
      alert("Error al rechazar la asignación")
    }
  }

  const handleCrearInforme = (asignacion: Asignacion) => {
    router.push(`/dashboard/arquitecto/nuevo-informe?asignacion_id=${asignacion.id}&cliente_id=${asignacion.cliente_id}`)
  }

  return (
    <DashboardLayout title="Panel de Arquitecto" roleLabel="Arquitecto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="asignacion">Asignación</TabsTrigger>
          <TabsTrigger value="informes">Informes</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
        </TabsList>

        {/* Sección Asignación */}
        <TabsContent value="asignacion" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes Totales</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSolicitudes}</div>
                <p className="text-xs text-muted-foreground mt-1">Todas las solicitudes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{asignacionesPendientes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Esperando tu respuesta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aceptadas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{asignacionesAceptadas.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Proyectos activos</p>
              </CardContent>
            </Card>
          </div>

          {/* Mis Asignaciones - Solicitudes Pendientes */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Asignaciones</CardTitle>
              <CardDescription>Solicitudes de informes pendientes de tu respuesta</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando asignaciones...</div>
              ) : asignacionesPendientes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tienes solicitudes pendientes en este momento
                </div>
              ) : (
                <div className="space-y-4">
                  {asignacionesPendientes.map((asignacion) => (
                    <div key={asignacion.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">ASG-{asignacion.id}</span>
                          <Badge variant="secondary">Pendiente</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(asignacion.fecha_asignacion).toLocaleDateString()}
                        </span>
                      </div>
                      {asignacion.cliente_nombre && (
                        <div className="mb-3 p-3 bg-muted/50 rounded-md">
                          <p className="text-sm font-medium">
                            Cliente: {asignacion.cliente_nombre} {asignacion.cliente_apellido}
                          </p>
                          {asignacion.cliente_email && (
                            <p className="text-sm text-muted-foreground">{asignacion.cliente_email}</p>
                          )}
                        </div>
                      )}
                      {asignacion.notas && (
                        <p className="text-sm text-muted-foreground mb-3">
                          <span className="font-medium">Notas:</span> {asignacion.notas}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleAceptarAsignacion(asignacion.id)}>
                          <Check className="w-4 h-4 mr-1" />
                          Aceptar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRechazarAsignacion(asignacion.id)}>
                          <X className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asignaciones Aceptadas - Crear Informe */}
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Aceptados</CardTitle>
              <CardDescription>Solicitudes aceptadas - Crea los informes para tus clientes</CardDescription>
            </CardHeader>
            <CardContent>
              {asignacionesAceptadas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No has aceptado ninguna solicitud todavía</div>
              ) : (
                <div className="space-y-4">
                  {asignacionesAceptadas.map((asignacion) => (
                    <div key={asignacion.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">ASG-{asignacion.id}</span>
                          <Badge variant="default">Aceptada</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Aceptada:{" "}
                          {asignacion.fecha_respuesta ? new Date(asignacion.fecha_respuesta).toLocaleDateString() : "-"}
                        </span>
                      </div>
                      {asignacion.cliente_nombre && (
                        <div className="mb-3 p-3 bg-muted/50 rounded-md">
                          <p className="text-sm font-medium">
                            Cliente: {asignacion.cliente_nombre} {asignacion.cliente_apellido}
                          </p>
                          {asignacion.cliente_email && (
                            <p className="text-sm text-muted-foreground">{asignacion.cliente_email}</p>
                          )}
                        </div>
                      )}
                      <Button size="sm" className="w-full" onClick={() => handleCrearInforme(asignacion)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Crear Informe para este Cliente
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección Informes */}
        <TabsContent value="informes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mis Informes</CardTitle>
                  <CardDescription>Informes técnicos que he creado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {informesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando informes...</div>
              ) : totalInformes === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aún no has creado informes. Acepta una asignación y completa el informe correspondiente.
                </div>
              ) : (
                <div className="space-y-4">
                  {informes.map((informe) => (
                    <div key={informe.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
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
                            {informe.estado.charAt(0).toUpperCase() + informe.estado.slice(1)}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(informe.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold">{informe.direccion || "Sin dirección"}</h4>
                      <p className="text-sm text-muted-foreground">
                        Cliente:{" "}
                        {informe.cliente_nombre || informe.cliente_apellido
                          ? `${informe.cliente_nombre ?? ""} ${informe.cliente_apellido ?? ""}`.trim()
                          : informe.cliente_id
                            ? `ID ${informe.cliente_id}`
                            : "No asignado"}
                      </p>
                      {informe.coste_estimado_reparacion != null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Coste estimado: €{informe.coste_estimado_reparacion.toLocaleString("es-ES")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección Perfil */}
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
                  <Button variant="outline" size="sm">Cambiar Foto</Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre</label>
                  <input type="text" className="w-full p-2 border rounded-md" defaultValue={user?.nombre ?? ""} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Apellido</label>
                  <input type="text" className="w-full p-2 border rounded-md" defaultValue={user?.apellido ?? ""} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="w-full p-2 border rounded-md" defaultValue={user?.email ?? ""} disabled />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <input type="text" className="w-full p-2 border rounded-md" value="Arquitecto" disabled />
                </div>

                <Button className="w-full">Guardar Cambios</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información Profesional</CardTitle>
                <CardDescription>Datos profesionales y contacto</CardDescription>
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
                    <p className="text-sm font-medium">Colegiado</p>
                    <p className="text-sm text-muted-foreground">COA-12345</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Especialización</label>
                  <input type="text" className="w-full p-2 border rounded-md" defaultValue="Inspección Técnica de Edificios" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Rendimiento</CardTitle>
              <CardDescription>Tu actividad y rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Informes Completados</p>
                  <p className="text-2xl font-bold mt-1">67</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Tasa de Completado</p>
                  <p className="text-2xl font-bold mt-1">94%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Calificación Media</p>
                  <p className="text-2xl font-bold mt-1">4.8</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                  <p className="text-2xl font-bold mt-1">{asignacionesAceptadas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
