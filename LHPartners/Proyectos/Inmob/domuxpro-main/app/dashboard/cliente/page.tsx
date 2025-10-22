"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { Building, FileText, Mail, Phone, Send, User } from "lucide-react"
import { useBrandToast } from "@/hooks/use-brand-toast"

interface Informe {
  id: number
  estado: string
  estado_aprobacion?: "pendiente" | "aprobado" | "rechazado"
  created_at: string
  direccion: string
  tipo_informe?: string
  arquitecto_nombre?: string
  arquitecto_apellido?: string
  ref_catastral?: string | null
  tipo_propiedad?: string | null
  coste_estimado_reparacion?: number | null
}

interface MensajeEnviado {
  id: number
  asunto: string
  mensaje: string
  estado: "pendiente" | "respondido" | "rechazado" | "en_proceso"
  fecha_creacion: string
  fecha_respuesta?: string | null
}

export default function ClienteDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const brandToast = useBrandToast()
  const [activeTab, setActiveTab] = useState("informes")
  const [informes, setInformes] = useState<Informe[]>([])
  const [mensajesEnviados, setMensajesEnviados] = useState<MensajeEnviado[]>([])
  const [informesLoading, setInformesLoading] = useState(true)

  // Formulario de contacto
  const [asunto, setAsunto] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [enviando, setEnviando] = useState(false)

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
        const response = await fetch("/api/informes", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setInformes(data.informes || [])
        } else if (response.status === 401) {
          setInformes([])
        } else {
          console.error("[cliente] Error al obtener informes:", response.status)
        }
      } catch (error) {
        console.error("[cliente] Error al cargar informes:", error)
        setInformes([])
      } finally {
        setInformesLoading(false)
      }
    }

    fetchInformes()
  }, [authLoading, user?.id])

  useEffect(() => {
    const fetchMensajesEnviados = async () => {
      if (authLoading) return
      if (!user?.id) {
        setMensajesEnviados([])
        return
      }

      try {
        const response = await fetch(`/api/contacto?cliente_id=${user.id}`, { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setMensajesEnviados(data.mensajes || [])
        } else if (response.status === 401) {
          setMensajesEnviados([])
        } else {
          console.error("[cliente] Error al cargar mensajes:", response.status)
        }
      } catch (error) {
        console.error("[cliente] Error al cargar mensajes:", error)
      }
    }

    fetchMensajesEnviados()
  }, [authLoading, user?.id])

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!asunto.trim() || !mensaje.trim()) {
      brandToast.info("Completa asunto y mensaje antes de enviarlo.")
      return
    }

    setEnviando(true)

    try {
      console.log("[v0] Enviando mensaje - Usuario:", user)
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asunto: asunto.trim(),
          mensaje: mensaje.trim(),
        }),
      })

      const data = await response.json()
      console.log("[v0] Respuesta del servidor:", data)

      if (response.ok) {
        brandToast.success("Mensaje enviado correctamente. El equipo lo recibirá pronto.")
        setAsunto("")
        setMensaje("")
        // Recargar mensajes enviados
        if (user?.id) {
          const mensajesResponse = await fetch(`/api/contacto?cliente_id=${user.id}`, { credentials: "include" })
          if (mensajesResponse.ok) {
            const mensajesData = await mensajesResponse.json()
            setMensajesEnviados(mensajesData.mensajes || [])
          }
        }
      } else {
        brandToast.error(`Error al enviar el mensaje: ${data.error || "Motivo desconocido"}.`)
      }
    } catch (error) {
      console.error("[v0] Error al enviar mensaje:", error)
      brandToast.error("No se pudo enviar el mensaje. Inténtalo de nuevo en unos instantes.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <DashboardLayout title="Panel de Cliente" roleLabel="Cliente">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informes">Informes</TabsTrigger>
          <TabsTrigger value="contactar">Contactar</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
        </TabsList>

        {/* Sección Informes */}
        <TabsContent value="informes" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mis Informes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{informes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Total recibidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{informes.filter((i) => i.estado === "en_progreso").length}</div>
                <p className="text-xs text-muted-foreground mt-1">Pendientes de entrega</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{informes.filter((i) => i.estado === "completo").length}</div>
                <p className="text-xs text-muted-foreground mt-1">Informes finalizados</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mis Informes Técnicos</CardTitle>
              <CardDescription>Informes de inspección de tus propiedades</CardDescription>
            </CardHeader>
            <CardContent>
              {informesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando informes...</div>
              ) : informes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tienes informes todavía. Contacta con el gestor para solicitar uno.
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
                            {informe.estado === "completo"
                              ? "Completado"
                              : informe.estado === "en_progreso"
                                ? "En Proceso"
                                : "Borrador"}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(informe.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1">{informe.direccion || "Sin dirección"}</h4>
                      {informe.tipo_propiedad && (
                        <p className="text-sm text-muted-foreground mb-1">Propiedad: {informe.tipo_propiedad}</p>
                      )}
                      {informe.ref_catastral && (
                        <p className="text-xs text-muted-foreground mb-1">Ref. catastral: {informe.ref_catastral}</p>
                      )}
                      {typeof informe.coste_estimado_reparacion === "number" && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Coste estimado: €{informe.coste_estimado_reparacion.toLocaleString("es-ES")}
                        </p>
                      )}
                      {informe.arquitecto_nombre && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Arquitecto: {informe.arquitecto_nombre} {informe.arquitecto_apellido}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {informe.estado === "completo" ? (
                          <>
                            <Button size="sm" className="flex-1">
                              Descargar PDF
                            </Button>
                            <Button size="sm" variant="outline">
                              Ver Detalles
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full bg-transparent" disabled>
                            En proceso de elaboración
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección Contactar */}
        <TabsContent value="contactar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensaje</CardTitle>
              <CardDescription>Contacta con nuestro equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleEnviarMensaje}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asunto</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="¿En qué podemos ayudarte?"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensaje</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={6}
                    placeholder="Escribe tu mensaje aquí..."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                  />
                </div>

                <Button className="w-full" type="submit" disabled={enviando}>
                  <Send className="w-4 h-4 mr-2" />
                  {enviando ? "Enviando..." : "Enviar Mensaje"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mensajes Enviados</CardTitle>
              <CardDescription>Historial de tus mensajes al equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {mensajesEnviados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No has enviado ningún mensaje todavía</div>
              ) : (
                <div className="space-y-4">
                  {mensajesEnviados.map((msg) => (
                    <div key={msg.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            msg.estado === "pendiente"
                              ? "secondary"
                              : msg.estado === "rechazado"
                                ? "destructive"
                                : "default"
                          }
                        >
                          {msg.estado === "pendiente"
                            ? "Pendiente"
                            : msg.estado === "rechazado"
                              ? "Rechazado"
                              : msg.estado === "respondido"
                                ? "Respondido"
                                : "En proceso"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(msg.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1">{msg.asunto}</h4>
                      <p className="text-sm text-muted-foreground">{msg.mensaje}</p>
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
                  <input type="text" className="w-full p-2 border rounded-md" value="Cliente" disabled />
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
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Tipo de Cliente</p>
                    <p className="text-sm text-muted-foreground">Particular</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
              <CardDescription>Tu actividad en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Informes Solicitados</p>
                  <p className="text-2xl font-bold mt-1">{informes.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Mensajes Enviados</p>
                  <p className="text-2xl font-bold mt-1">{mensajesEnviados.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Propiedades Inspeccionadas</p>
                  <p className="text-2xl font-bold mt-1">{informes.filter((i) => i.estado === "completo").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
