"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap } from "lucide-react"

export function GenerateClient({ gmailEmail }: { gmailEmail: string | null }) {
  const router = useRouter()
  const [niche, setNiche] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche, targetAudience }),
    })

    if (!res.ok) {
      toast.error("Failed to generate email. Please try again.")
      setLoading(false)
      return
    }

    const data = await res.json()
    router.push(`/emails/${data.id}`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Generate Outreach Email</h1>
        <p className="text-muted-foreground">
          Describe your service and target audience — Claude will write a personalized email.
          {!gmailEmail && (
            <span className="text-amber-600 dark:text-amber-400">
              {" "}Connect Gmail first to send emails.
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4" />
            Email Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="niche">Your niche or service</Label>
              <Input
                id="niche"
                placeholder="e.g. SaaS onboarding consulting, SEO for e-commerce, B2B copywriting"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target audience</Label>
              <Input
                id="audience"
                placeholder="e.g. B2B SaaS founders with 10-50 employees, Shopify store owners"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2">
              <Zap className="w-4 h-4" />
              {loading ? "Generating…" : "Generate with Claude"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
