import { neon } from "@neondatabase/serverless"

// Configuración global para la base de datos (silencia el warning de Neon)
export const sql = neon(process.env.DATABASE_URL!, {
  disableWarningInBrowser: true,
})
