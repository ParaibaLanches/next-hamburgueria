import * as React from "react"
import { cn } from "@/lib/utils"

interface PrivacyMaskProps {
  children: React.ReactNode
  isUnmasked: boolean
  className?: string
  /** 
   * Alternative text to show when masked. 
   * if provided, it will replace the children instead of blurring them.
   */
  maskText?: string
}

/**
 * PrivacyMask Component
 * 
 * Safely masks sensitive data for LGPD compliance.
 * Uses a div with display: contents to avoid breaking layouts while
 * allowing child elements (like <div> or <p>) to render safely.
 */
export function PrivacyMask({ children, isUnmasked, className, maskText }: PrivacyMaskProps) {
  // Guard against null/undefined children to prevent React rendering errors
  if (children === null || children === undefined) {
    return null
  }

  if (maskText && !isUnmasked) {
    return <span className={cn("font-mono", className)}>{maskText}</span>
  }

  return (
    <div
      className={cn(
        "transition-all duration-300",
        !isUnmasked && "blur-md select-none pointer-events-none opacity-40",
        className
      )}
      style={{ display: isUnmasked ? 'contents' : 'inline-block' }}
      aria-hidden={!isUnmasked}
    >
      {children}
    </div>
  )
}
