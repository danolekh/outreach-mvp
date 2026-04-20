import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { gmailConnections } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { GmailConnectClient } from "./client"

export default async function ConnectGmailPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const [connection] = await db
    .select({
      id: gmailConnections.id,
      gmailEmail: gmailConnections.gmailEmail,
      createdAt: gmailConnections.createdAt,
    })
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, session.user.id))
    .limit(1)

  const params = await searchParams

  return (
    <GmailConnectClient
      connection={connection ?? null}
      success={params.success === "true"}
      error={params.error}
    />
  )
}
