import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { gmailConnections } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { GenerateClient } from "./client"

export default async function GeneratePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const [connection] = await db
    .select({ gmailEmail: gmailConnections.gmailEmail })
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, session.user.id))
    .limit(1)

  return <GenerateClient gmailEmail={connection?.gmailEmail ?? null} />
}
