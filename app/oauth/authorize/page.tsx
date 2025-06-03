"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const OAUTH_CLIENT_ID = "184837506" // 실제 값으로 교체
const OAUTH_SCOPE = "read"
const OAUTH_STATE = "xyz123"
const OAUTH_AUTH_URL = "http://localhost:9000/oauth2/authorize"
const OAUTH_REDIRECT_URI = "http://localhost:3000/login/oauth2/code/hwanbee"

export default function OAuthAuthorizePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const redirect = searchParams.get("redirect") || "/"

    if (!code) {
      // 인가 코드가 없으면 환비 인가 URL로 이동
      const url = `${OAUTH_AUTH_URL}?response_type=code&client_id=${OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&scope=${OAUTH_SCOPE}&state=${OAUTH_STATE}`
      window.location.href = url
      return
    }

    // code가 있으면 프론트 라우팅으로 /login/oauth2/code/hwanbee로 이동
    const nextUrl = `/login/oauth2/code/hwanbee?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`
    router.replace(nextUrl)
  }, [router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>OAuth 인증 처리 중입니다...</p>
    </div>
  )
} 