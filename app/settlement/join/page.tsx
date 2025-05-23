"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function JoinSettlementGroupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("code") || ""

  const [code, setCode] = useState(inviteCode)
  const [codeError, setCodeError] = useState("")
  const [remainingAttempts, setRemainingAttempts] = useState(5)
  const [walletBalances, setWalletBalances] = useState<any[]>([])
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
      setWalletBalances(parsedBalances)
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

  const handleJoinGroup = () => {
    if (!code.trim()) {
      setCodeError("초대 코드를 입력해주세요.")
      return
    }

    if (!hasWallet) {
      alert("지갑이 없어 정산 그룹에 참여할 수 없습니다. 먼저 지갑을 생성해주세요.")
      router.push("/wallet/charge")
      return
    }

    // Check if code matches any existing group
    const storedMyGroups = localStorage.getItem("mySettlementGroups")
    const myGroups = storedMyGroups ? JSON.parse(storedMyGroups) : []

    const matchingGroup = myGroups.find((group: any) => group.inviteCode === code.trim())

    if (matchingGroup) {
      // Check if invite code is expired
      const expiryDate = new Date(matchingGroup.inviteExpiry)
      if (new Date() > expiryDate) {
        setCodeError("초대 코드가 만료되었습니다. 방장에게 재발급을 요청하세요.")
        return
      }

      // Check if group is full
      if (matchingGroup.memberCount >= matchingGroup.maxMembers) {
        setCodeError("그룹 인원이 가득 찼습니다.")
        return
      }

      // Add user to the group
      const updatedGroup = {
        ...matchingGroup,
        memberCount: matchingGroup.memberCount + 1,
      }

      // Update the group in myGroups
      const updatedMyGroups = myGroups.map((group: any) => (group.id === matchingGroup.id ? updatedGroup : group))
      localStorage.setItem("mySettlementGroups", JSON.stringify(updatedMyGroups))

      // Add group to joinedGroups
      const joinedGroup = {
        ...matchingGroup,
        isOwner: false,
      }

      const storedJoinedGroups = localStorage.getItem("joinedSettlementGroups")
      const joinedGroups = storedJoinedGroups ? JSON.parse(storedJoinedGroups) : []
      joinedGroups.push(joinedGroup)
      localStorage.setItem("joinedSettlementGroups", JSON.stringify(joinedGroups))

      // Navigate to the group
      router.push(`/settlement/group/${matchingGroup.id}`)
    } else {
      // Decrease remaining attempts
      const newAttempts = remainingAttempts - 1
      setRemainingAttempts(newAttempts)

      if (newAttempts <= 0) {
        setCodeError("시도 횟수(5회)를 초과했습니다. 나중에 다시 시도해주세요.")
        // Disable input for some time
        setTimeout(() => {
          setRemainingAttempts(5)
          setCodeError("")
        }, 60000) // 1 minute timeout
      } else {
        setCodeError(`유효하지 않은 초대 코드입니다. 남은 시도 횟수: ${newAttempts}회`)
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <Link href="/settlement" className="text-gray-700">
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
            disabled={remainingAttempts <= 0}
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
            <li>• 보안을 위해 초대 코드 입력은 3회로 제한됩니다.</li>
            <li>• 정산 그룹에 참여하려면 지갑이 필요합니다.</li>
            <li>• 그룹 참여 후 정산 내역을 확인할 수 있습니다.</li>
          </ul>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleJoinGroup}
          disabled={!code.trim() || remainingAttempts <= 0 || !hasWallet}
          className={`w-full rounded-lg py-3 text-center font-medium text-white ${
            code.trim() && remainingAttempts > 0 && hasWallet
              ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md"
              : "bg-gray-300"
          }`}
        >
          참여하기
        </button>
      </div>
    </div>
  )
}
