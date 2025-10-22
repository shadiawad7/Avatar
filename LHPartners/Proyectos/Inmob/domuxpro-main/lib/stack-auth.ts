// lib/stack-auth.ts
import { StackServerApp } from "@stackframe/stack"

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
const secretServerKey = process.env.STACK_SECRET_KEY

if (!projectId) {
  throw new Error("Missing NEXT_PUBLIC_STACK_PROJECT_ID")
}
if (!publishableClientKey) {
  throw new Error("Missing NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY")
}
if (!secretServerKey) {
  throw new Error("Missing STACK_SECRET_KEY")
}

export const stackServerApp = new StackServerApp({
  projectId,
  publishableClientKey, // <- requerido
  secretServerKey,      // <- NO es 'secretServerSide'
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    afterSignIn: "/auth/callback",
    afterSignOut: "/",
  },
})
