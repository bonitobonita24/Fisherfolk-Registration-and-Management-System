"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ theme: _propTheme, ...rest }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  // next-themes resolves the theme only on the client, so the toaster's persistent
  // DOM element must render a deterministic theme during SSR + first client render
  // to avoid an intermittent hydration mismatch (React #418). Default to the app's
  // always-dark baseline until mounted, then follow the resolved theme.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const theme = (mounted ? (resolvedTheme ?? "dark") : "dark") as Exclude<
    ToasterProps["theme"],
    undefined
  >

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...rest}
    />
  )
}

export { Toaster }
