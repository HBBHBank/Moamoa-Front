"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getValidToken } from "@/lib/auth"

export default function JoinSettlementGroupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("code") || ""

  const [code, setCode] = useState(inviteCode)
  const [codeError, setCodeError] = useState("")
  const [hasWallet, setHasWallet] = useState(false)

  // Load wallet balances from localStorage on mount
  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (!isLoggedIn) {
      router.push("/")
      return
    }

    // Load wallet balances
    const storedBalances = localStorage.getItem("walletBalances")
    if (storedBalances) {
      const parsedBalances = JSON.parse(storedBalances)
      setHasWallet(parsedBalances.length > 0)
    }

    // Check if user has any wallet
    if (!hasWallet) {
      alert("지갑이 없어 정산 그룹에 참여할 수 없습니다. 먼저 지갑을 생성해주세요.")
      router.push("/wallet/charge")
    }
  }, [router, hasWallet])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setCode(value)
    setCodeError("")
  }

  const handleJoinGroup = async () => {
    if (!code.trim()) {
      setCodeError("초대 코드를 입력해주세요.")
      return
    }

    if (!hasWallet) {
      setCodeError("지갑이 없어 정산 그룹에 참여할 수 없습니다. 먼저 지갑을 생성해주세요.")
      router.push("/wallet/charge")
      return
    }

    try {
      const token = await getValidToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ joinCode: code.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setCodeError(errorData.message || '초대 코드 검증에 실패했습니다.');
        return;
      }

      const result = await response.json();
      console.log("verify join code API result:", result);
      const verifyData = result.result || result.data || result;
      if (!verifyData || !verifyData.groupId) {
        setCodeError("유효하지 않은 응답입니다.");
        return;
      }

      // 이미 멤버인 경우 메시지에 따라 바로 이동
      if (!verifyData.isValid) {
        if (verifyData.message && verifyData.message.includes("이미 참여한 그룹")) {
          alert("이미 참여한 그룹입니다. 해당 그룹으로 이동합니다.");
          router.push(`/settlement/group/${verifyData.groupId}?allowIfJoinCodeValid=true`);
          return;
        }
        setCodeError(verifyData.message || "초대 코드가 만료되었거나 유효하지 않습니다.");
        return;
      }

      // allowIfJoinCodeValid=true로 설정하여 자동 멤버 등록되도록 이동
      router.push(`/settlement/group/${verifyData.groupId}?allowIfJoinCodeValid=true`)
    } catch (error) {
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        setCodeError(error instanceof Error ? error.message : '그룹 참여 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <Link href="/settlement" className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">정산 그룹 참여</h1>
        <div className="w-6"></div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="mb-6">
          <label htmlFor="inviteCode" className="mb-2 block text-sm font-medium text-gray-700">
            초대 코드
          </label>
          <input
            type="text"
            id="inviteCode"
            value={code}
            onChange={handleCodeChange}
            placeholder="초대 코드를 입력하세요"
            className={`w-full rounded-lg border ${
              codeError ? "border-red-500" : "border-gray-300"
            } p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          {codeError && (
            <p className="mt-1 flex items-center text-sm text-red-500">
              <AlertCircle className="mr-1 h-4 w-4" />
              {codeError}
            </p>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-medium text-blue-700">참여 안내</h3>
          <ul className="space-y-1 text-sm text-blue-600">
            <li>• 초대 코드는 생성 후 10분간 유효합니다.</li>
            <li>• 정산 그룹에 참여하려면 지갑이 필요합니다.</li>
            <li>• 그룹 참여 후 정산 내역을 확인할 수 있습니다.</li>
          </ul>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleJoinGroup}
          disabled={!code.trim() || !hasWallet}
          className={`w-full rounded-lg py-3 text-center font-medium text-white ${
            code.trim() && hasWallet
              ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          참여하기
        </button>
      </div>
    </div>
  )
}
