import { Geist, Geist_Mono, Noto_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app"

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", notoSans.variable)}
    >
      <body suppressHydrationWarning>
        <TRPCReactProvider>
          <NuqsAdapter>
            <ThemeProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </ThemeProvider>
          </NuqsAdapter>
        </TRPCReactProvider>
      </body>
    </html>
  )
}
