"use client"

import * as React from "react"
import { ArrowRight, Check, Loader2, Sparkles, Zap } from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const PRO_FEATURES = [
  {
    title: "Unlimited Workflows",
    description: "Build and run complex automated workflows without limits",
  },
  {
    title: "Real-time Execution & Logs",
    description: "Instant event triggers with in-depth step debugging",
  },
  {
    title: "Priority Queueing",
    description: "Zero latency background job processing and automatic retries",
  },
  {
    title: "Advanced Integrations",
    description: "Unlock all premium third-party tools and credentials",
  },
]

export interface UpgradeModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  title?: string
  description?: string
  featureName?: string
  onUpgrade?: () => void | Promise<void>
}

export function UpgradeModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  featureName,
  onUpgrade,
}: UpgradeModalProps) {
  const [isPending, setIsPending] = React.useState(false)

  const handleUpgrade = async () => {
    try {
      setIsPending(true)
      if (onUpgrade) {
        await onUpgrade()
      } else {
        await authClient.checkout({ slug: "Clock-Work-Pro" })
      }
    } catch (error) {
      console.error("Upgrade checkout error:", error)
      toast.error("Failed to initiate checkout. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  const modalTitle = title ?? "Upgrade to Pro"
  const modalDescription =
    description ??
    (featureName
      ? `Upgrade to ClockWork Pro to unlock ${featureName} and supercharge your automation.`
      : "Upgrade to ClockWork Pro to unlock this feature and take your automation to the next level.")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Sleek top glowing banner / header decorative pattern */}
        <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-6 pt-8 pb-4 text-center">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 size-40 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="relative mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-background border border-primary/20 shadow-md shadow-primary/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-60" />
            <Zap className="size-7 text-primary fill-primary/20 transition-transform hover:scale-110 duration-200" />
          </div>

          <Badge
            variant="outline"
            className="mb-2 gap-1.5 border-primary/30 bg-background/80 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-primary shadow-xs backdrop-blur-xs"
          >
            <Sparkles className="size-3 text-primary animate-pulse" />
            PRO PLAN
          </Badge>

          <DialogHeader className="gap-1.5 text-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {modalTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground max-w-sm mx-auto">
              {modalDescription}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Feature Highlights */}
        <div className="px-6 py-2">
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 space-y-3">
            {PRO_FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                onClick={() => onOpenChange?.(false)}
                >
                  <Check className="size-2.5 stroke-[3]" />
                </div>
                <div className="text-xs leading-tight">
                  <span className="font-semibold text-foreground">
                    {feature.title}
                  </span>
                  <span className="text-muted-foreground">
                    {" — "}
                    {feature.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <DialogFooter className="px-6 pt-4 pb-9 flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 mt-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="default"
              disabled={isPending}
              onClick={() => onOpenChange?.(false)}
              className="text-muted-foreground hover:text-foreground text-xs font-normal"
            >
              Will do later
            </Button>
          </DialogClose>

          <Button
            type="button"
            size="default"
            disabled={isPending}
            onClick={handleUpgrade}
            className="gap-2 font-medium shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Redirecting...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Upgrade to Pro</span>
                <ArrowRight className="size-4 opacity-70" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UpgradeModal
