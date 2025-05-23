"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type WalletBalance = {
  country: string
  code: string
  flagSrc: string
  amount: number
}

export default function CreateSettlementGroupPage() {
  const router = useRouter()
  const [groupName, setGroupName] = useState("")
  const [selectedWallet, setSelectedWallet] = useState<WalletBalance | null>(null)
  const [maxMembers, setMaxMembers] = useState(5)
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([])
  const [showWalletSelector, setShowWalletSelector] = useState(false)
  const [nameError, setNameError] = useState("")

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

      // Check if user has any wallet
      if (parsedBalances.length === 0) {
        alert("지갑이 없어 정산 그룹을 만들 수 없습니다. 먼저 지갑을 생성해주세요.")
        router.push("/wallet/charge")
      }
    } else {
      alert("지갑이 없어 정산 그룹을 만들 수 없습니다. 먼저 지갑을 생성해주세요.")
      router.push("/wallet/charge")
    }
  }, [router])

  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setGroupName(value)
    if (value.trim().length === 0) {
      setNameError("그룹 이름을 입력해주세요.")
    } else if (value.length > 20) {
      setNameError("그룹 이름은 20자 이내로 입력해주세요.")
    } else {
      setNameError("")
    }
  }

  const handleMaxMembersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= 2 && value <= 10) {
      setMaxMembers(value)
    }
  }

  const handleSelectWallet = (wallet: WalletBalance) => {
    setSelectedWallet(wallet)
    setShowWalletSelector(false)
  }

  const generateInviteCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      setNameError("그룹 이름을 입력해주세요.")
      return
    }

    if (!selectedWallet) {
      alert("공유 지갑을 선택해주세요.")
      return
    }

    // Create new group
    const newGroup = {
      id: `group-${Date.now()}`,
      name: groupName.trim(),
      isActive: true,
      isOwner: true,
      memberCount: 1, // Start with just the creator
      maxMembers: maxMembers,
      currency: selectedWallet.code,
      flagSrc: selectedWallet.flagSrc,
      inviteCode: generateInviteCode(),
      inviteExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      createdAt: new Date(),
    }

    // Save to localStorage
    const storedGroups = localStorage.getItem("mySettlementGroups")
    const myGroups = storedGroups ? JSON.parse(storedGroups) : []

    // Check if the wallet is already used in another active group
    // 내가 생성한 그룹에서만 동일 통화 체크
    const walletInUse = myGroups.some((group: any) => group.currency === selectedWallet.code && group.isActive)

    if (walletInUse) {
      alert(`${selectedWallet.code} 지갑은 이미 다른 활성화된 정산 그룹에서 사용 중입니다.`)
      return
    }

    myGroups.push(newGroup)
    localStorage.setItem("mySettlementGroups", JSON.stringify(myGroups))

    // Navigate to the new group
    router.push(`/settlement/group/${newGroup.id}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <Link href="/settlement" className="text-gray-700">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">정산 그룹 생성</h1>
        <div className="w-6"></div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="mb-6">
          <label htmlFor="groupName" className="mb-2 block text-sm font-medium text-gray-700">
            그룹 이름
          </label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={handleGroupNameChange}
            placeholder="예: 도쿄 여행, 회사 회식"
            className={`w-full rounded-lg border ${
              nameError ? "border-red-500" : "border-gray-300"
            } p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          {nameError && (
            <p className="mt-1 flex items-center text-sm text-red-500">
              <AlertCircle className="mr-1 h-4 w-4" />
              {nameError}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">공유 지갑 선택</label>
          <div
            className="flex items-center justify-between rounded-lg border border-gray-300 p-3"
            onClick={() => setShowWalletSelector(true)}
          >
            {selectedWallet ? (
              <div className="flex items-center">
                <div className="relative mr-3 h-8 w-8 overflow-hidden rounded-full border border-gray-200">
                  <img
                    src={selectedWallet.flagSrc || "/placeholder.svg"}
                    alt={selectedWallet.code}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {selectedWallet.country} {selectedWallet.code}
                  </p>
                  <p className="text-sm text-gray-500">잔액: {selectedWallet.amount.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <span className="text-gray-500">지갑을 선택해주세요</span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <p className="mt-1 text-xs text-gray-500">선택한 지갑의 거래 내역이 정산 그룹 멤버들과 공유됩니다.</p>
        </div>

        <div className="mb-6">
          <label htmlFor="maxMembers" className="mb-2 block text-sm font-medium text-gray-700">
            최대 멤버 수
          </label>
          <div className="flex items-center">
            <button
              onClick={() => maxMembers > 2 && setMaxMembers(maxMembers - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-l-lg border border-gray-300 bg-gray-100 text-gray-700"
            >
              -
            </button>
            <input
              type="number"
              id="maxMembers"
              value={maxMembers}
              onChange={handleMaxMembersChange}
              min="2"
              max="10"
              className="h-10 w-16 border-y border-gray-300 text-center"
            />
            <button
              onClick={() => maxMembers < 10 && setMaxMembers(maxMembers + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-gray-300 bg-gray-100 text-gray-700"
            >
              +
            </button>
            <span className="ml-2 text-gray-500">명</span>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-medium text-blue-700">정산 그룹 생성 시 유의사항</h3>
          <ul className="space-y-1 text-sm text-blue-600">
            <li>• 초대 코드는 생성 후 10분간 유효합니다.</li>
            <li>• 동일한 지갑은 다른 정산 그룹에서 동시에 사용할 수 없습니다.</li>
            <li>• 그룹 생성 후 멤버들이 초대 코드를 통해 참여할 수 있습니다.</li>
            <li>• 정산 그룹 활성화 시 선택한 지갑의 거래 내역이 멤버들과 공유됩니다.</li>
          </ul>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || !!nameError || !selectedWallet}
          className={`w-full rounded-lg py-3 text-center font-medium text-white ${
            groupName.trim() && !nameError && selectedWallet
              ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md"
              : "bg-gray-300"
          }`}
        >
          그룹 생성하기
        </button>
      </div>

      {/* Wallet Selector Modal */}
      {showWalletSelector && (
        <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50 sm:items-center sm:justify-center">
          <div className="w-full rounded-t-xl bg-white p-6 shadow-xl sm:max-w-md sm:rounded-xl">
            <h2 className="mb-4 text-xl font-bold">지갑 선택</h2>
            <div className="max-h-96 overflow-y-auto">
              {walletBalances.length > 0 ? (
                <div className="space-y-3">
                  {walletBalances.map((wallet, index) => (
                    <button
                      key={index}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                      onClick={() => handleSelectWallet(wallet)}
                    >
                      <div className="flex items-center">
                        <div className="relative mr-3 h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                          <img
                            src={wallet.flagSrc || "/placeholder.svg"}
                            alt={wallet.code}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {wallet.country} {wallet.code}
                          </p>
                          <p className="text-sm text-gray-500">잔액: {wallet.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      {selectedWallet?.code === wallet.code && <Check className="h-5 w-5 text-blue-500" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 rounded-full bg-gray-100 p-4">
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="mb-2 text-gray-500">사용 가능한 지갑이 없습니다.</p>
                  <p className="text-sm text-gray-400">먼저 지갑을 생성해주세요.</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowWalletSelector(false)}
              className="mt-4 w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
