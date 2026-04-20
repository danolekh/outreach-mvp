"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail, AlertCircle, ExternalLink } from "lucide-react"

type Connection = {
  id: string
  gmailEmail: string
  createdAt: Date
} | null

export function GmailConnectClient({
  connection,
  success,
  error,
}: {
  connection: Connection
  success: boolean
  error?: string
}) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (success) toast.success("Gmail connected successfully!")
    if (error) {
      const messages: Record<string, string> = {
        invalid_state: "Authorization failed — please try again.",
        missing_tokens: "Google did not return tokens. Make sure to approve all permissions.",
        exchange_failed: "Authorization failed — please try again.",
      }
      toast.error(messages[error] ?? "Connection failed. Please try again.")
    }
  }, [success, error])

  async function handleDisconnect() {
    setDisconnecting(true)
    const res = await fetch("/api/gmail/disconnect", { method: "POST" })
    if (res.ok) {
      toast.success("Gmail disconnected")
      router.refresh()
    } else {
      toast.error("Failed to disconnect")
    }
    setDisconnecting(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Gmail Connection</h1>
        <p className="text-muted-foreground">
          Connect your Gmail account to send outreach emails directly from your address.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Gmail Account
          </CardTitle>
          <CardDescription>
            We only request permission to send emails — we never read your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Connected</p>
                  <p className="text-muted-foreground text-sm truncate">{connection.gmailEmail}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  Active
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/gmail/connect">Reconnect</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">Not connected</p>
                  <p className="text-muted-foreground text-sm">Connect your Gmail to start sending</p>
                </div>
              </div>
              <a href="/api/gmail/connect">
                <Button className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Connect Gmail Account
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2 text-sm">What permissions are requested?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Send emails on your behalf</li>
            <li>✗ Read or access your inbox</li>
            <li>✗ Access contacts or calendar</li>
            <li>✗ Manage or delete messages</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
