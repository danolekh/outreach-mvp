import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { generatedEmails, gmailConnections } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { EmailDetailClient } from "./client"

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null

  const { id } = await params

  const [email] = await db
    .select()
    .from(generatedEmails)
    .where(and(eq(generatedEmails.id, id), eq(generatedEmails.userId, session.user.id)))
    .limit(1)

  if (!email) notFound()

  const [connection] = await db
    .select({ gmailEmail: gmailConnections.gmailEmail })
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, session.user.id))
    .limit(1)

  return <EmailDetailClient email={email} gmailEmail={connection?.gmailEmail ?? null} />
}
