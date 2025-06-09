"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface ModalPortalProps {
  children: React.ReactNode
}

export default function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // 클라이언트 사이드에서만 렌더링
  if (!mounted) return null

  // document.body에 직접 렌더링
  return createPortal(children, document.body)
}
