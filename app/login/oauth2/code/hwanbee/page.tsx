"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getValidToken } from "@/lib/auth"

export default function OAuthCodeHandlerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const redirect = "/wallet/charge" // 인증 후 이동할 경로

    if (code) {
      const postToken = async () => {
        try {
          const token = await getValidToken();
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/oauth2/token`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ code }),
          })
          if (!res) return;
          const data = await res.json()
          if (data && (data.success || data.result)) {
            if (typeof window !== "undefined") {
              localStorage.setItem("hwanbee_oauth_authenticated", "true")
            }
            router.replace(redirect)
          } else {
            alert("토큰 발급 실패: " + (data?.message || "알 수 없는 오류"))
          }
        } catch {
          alert("인증 처리 중 오류가 발생했습니다. 다시 로그인 해주세요.")
          router.replace("/login")
        }
      }
      postToken()
    } else {
      alert("인가 코드가 없습니다.")
      router.replace(redirect)
    }
  }, [router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>OAuth 인증 처리 중입니다...</p>
    </div>
  )
} 