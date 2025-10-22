import { redirect } from "next/navigation"

export default function HomePage() {
  // El middleware se encargará de redirigir al dashboard correcto
  redirect("/auth/signin")
}
