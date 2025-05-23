"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, Share2, Clock, Copy, RefreshCw, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import ModalPortal from "@/components/modal-portal"

// 파일 상단에 BigDecimal 타입 정의 추가
type BigDecimal = number

type SettlementGroup = {
  id: string
  name: string
  isActive: boolean
  isOwner: boolean
  memberCount: number
  maxMembers: number
  currency: string
  flagSrc: string
  inviteCode?: string
  inviteExpiry?: Date
  createdAt: Date
  members: Member[]
  transactions?: Transaction[]
  isSettling?: boolean
  selectedMembers?: string[]
  payments?: Payment[] // 송금 내역 추가
  deactivatedAt?: Date // 비활성화 시점 추가
}

type Member = {
  id: string
  name: string
  profileImage: string
  color: string // 추가
  isOwner: boolean
  hasSettled?: boolean
}

type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  currency: string
  timestamp: Date // 거래 발생 시점 추가
}

// 송금 내역 타입 추가
type Payment = {
  id: string
  date: string
  fromMemberId: string
  fromMemberName: string
  amount: number
  currency: string
}

export default function SettlementGroupPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<SettlementGroup | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [showMemberSelectModal, setShowMemberSelectModal] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [settlementAmount, setSettlementAmount] = useState(0)
  const [walletBalances, setWalletBalances] = useState<any[]>([])
  const [hasWallet, setHasWallet] = useState(false)
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [showActivateInfoModal, setShowActivateInfoModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)

  // Load group data from localStorage on mount
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

    // Load group data
    const storedMyGroups = localStorage.getItem("mySettlementGroups")
    const storedJoinedGroups = localStorage.getItem("joinedSettlementGroups")

    const myGroups = storedMyGroups ? JSON.parse(storedMyGroups) : []
    const joinedGroups = storedJoinedGroups ? JSON.parse(storedJoinedGroups) : []

    const foundGroup = [...myGroups, ...joinedGroups].find((g: SettlementGroup) => g.id === groupId)

    if (foundGroup) {
      // Add mock members if not present
      if (!foundGroup.members) {
        const mockMembers: Member[] = [
          {
            id: "user1",
            name: "김트윈",
            profileImage: "",
            color: "bg-blue-500",
            isOwner: true,
          },
          {
            id: "user2",
            name: "이월렛",
            profileImage: "",
            color: "bg-green-500",
            isOwner: false,
          },
          {
            id: "user3",
            name: "박페이",
            profileImage: "",
            color: "bg-purple-500",
            isOwner: false,
          },
          {
            id: "user4",
            name: "최결제",
            profileImage: "",
            color: "bg-orange-500",
            isOwner: false,
          },
          {
            id: "user5",
            name: "이환전",
            profileImage: "",
            color: "bg-pink-500",
            isOwner: false,
          },
        ]
        foundGroup.members = mockMembers.slice(0, foundGroup.memberCount)
      }

      // Add mock transactions if not present
      // 비활성화 시점 이전의 거래 내역은 항상 보여주고, 이후 거래는 활성화 상태에서만 추가
      if (!foundGroup.transactions) {
        const baseDate = new Date(foundGroup.createdAt)
        const deactivatedAt = foundGroup.deactivatedAt ? new Date(foundGroup.deactivatedAt) : null

        const mockTransactions: Transaction[] = [
          {
            id: "tx1",
            date: "2025-05-22",
            description: "맥도날드",
            amount: 15000,
            currency: foundGroup.currency,
            timestamp: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000), // 생성 후 1일
          },
          {
            id: "tx2",
            date: "2025-05-21",
            description: "스타벅스",
            amount: 8500,
            currency: foundGroup.currency,
            timestamp: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 생성 후 2일
          },
          {
            id: "tx3",
            date: "2025-05-20",
            description: "택시",
            amount: 12000,
            currency: foundGroup.currency,
            timestamp: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 생성 후 3일
          },
        ]

        // 비활성화 시점이 있다면, 그 이후의 거래는 필터링
        if (deactivatedAt) {
          foundGroup.transactions = mockTransactions.filter((tx) => tx.timestamp <= deactivatedAt)
        } else {
          foundGroup.transactions = mockTransactions
        }
      }

      setGroup(foundGroup)

      // Calculate settlement amount if group is settling
      if (foundGroup.isSettling && foundGroup.selectedMembers && foundGroup.transactions) {
        const totalAmount = foundGroup.transactions.reduce((sum: BigDecimal, tx: Transaction) => sum + tx.amount, 0)
        const perPersonAmount = Math.ceil(totalAmount / foundGroup.selectedMembers.length)
        setSettlementAmount(perPersonAmount)
        setSelectedMembers(foundGroup.selectedMembers)
      }
    } else {
      alert("존재하지 않는 그룹입니다.")
      router.push("/settlement")
    }
  }, [groupId, router])

  // 모달 관련 중복 스타일 코드를 제거하고 하나의 공통 스타일로 통합합니다.
  // 각 모달 컴포넌트에서 반복되는 style jsx global 태그를 하나로 통합합니다.

  // 파일 상단에 useEffect 아래에 다음 코드를 추가합니다:
  const renderModalStyles = () => (
    <style jsx global>{`
      body {
        overflow: hidden;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
    `}</style>
  )

  // 모달 배경과 컨테이너 스타일을 함수로 추출하여 중복 코드를 더 줄입니다.
  // renderModalStyles() 함수 아래에 다음 함수들을 추가합니다:

  const getModalBackgroundStyle = () => ({
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(2px)",
    animation: "fadeIn 0.3s ease-out",
  })

  const getBottomSheetStyle = (): React.CSSProperties => ({
    animation: "slideUp 0.3s ease-out",
    maxHeight: "90vh",
    overflowY: "auto" as const,
  })

  const getCenterModalStyle = () => ({
    animation: "scaleIn 0.3s ease-out",
  })

  // Update invite code expiry timer
  useEffect(() => {
    if (!group || !group.inviteExpiry) return

    const updateTimeLeft = () => {
      const now = new Date()
      const expiryDate = new Date(group.inviteExpiry!)

      if (now > expiryDate) {
        setTimeLeft("만료됨")
        return
      }

      const diffMs = expiryDate.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffSecs = Math.floor((diffMs % 60000) / 1000)

      setTimeLeft(`${diffMins}:${diffSecs.toString().padStart(2, "0")}`)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [group])

  const handleCopyInviteCode = () => {
    if (!group?.inviteCode) return

    navigator.clipboard.writeText(group.inviteCode)
    setInviteCopied(true)

    setTimeout(() => {
      setInviteCopied(false)
    }, 2000)
  }

  const handleRegenerateInviteCode = () => {
    if (!group || !group.isOwner) return

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let newCode = ""
    for (let i = 0; i < 8; i++) {
      newCode += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    const updatedGroup = {
      ...group,
      inviteCode: newCode,
      inviteExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    }

    setGroup(updatedGroup)

    // Update in localStorage
    const storedGroups = localStorage.getItem("mySettlementGroups")
    if (storedGroups) {
      const groups = JSON.parse(storedGroups)
      const updatedGroups = groups.map((g: SettlementGroup) => (g.id === group.id ? updatedGroup : g))
      localStorage.setItem("mySettlementGroups", JSON.stringify(updatedGroups))
    }
  }

  const handleToggleActive = () => {
    if (!group || !group.isOwner) return

    // 활성화/비활성화 정보 모달 표시
    setShowActivateInfoModal(true)
  }

  // 4. 활성화/비활성화 확인 함수 추가
  const confirmToggleActive = () => {
    if (!group || !group.isOwner) return

    const updatedGroup = {
      ...group,
      isActive: !group.isActive,
      // 비활성화할 때 현재 시점을 기록
      deactivatedAt: !group.isActive ? undefined : new Date(),
    }

    setGroup(updatedGroup)
    setShowActivateInfoModal(false)

    // Update in localStorage
    const storedGroups = localStorage.getItem("mySettlementGroups")
    if (storedGroups) {
      const groups = JSON.parse(storedGroups)
      const updatedGroups = groups.map((g: SettlementGroup) => (g.id === group.id ? updatedGroup : g))
      localStorage.setItem("mySettlementGroups", JSON.stringify(updatedGroups))
    }
  }

  const handleLeaveGroup = () => {
    if (!group) return

    // If owner is trying to leave and settlement is not complete
    if (group.isOwner && group.isSettling) {
      alert("정산이 완료되지 않았습니다. 정산을 취소하거나 완료 후 그룹을 나갈 수 있습니다.")
      setShowLeaveModal(false)
      return
    }

    // If owner is leaving, delete the group
    if (group.isOwner) {
      const storedGroups = localStorage.getItem("mySettlementGroups")
      if (storedGroups) {
        const groups = JSON.parse(storedGroups)
        const updatedGroups = groups.filter((g: SettlementGroup) => g.id !== group.id)
        localStorage.setItem("mySettlementGroups", JSON.stringify(updatedGroups))
      }
    } else {
      // If member is leaving, remove from joined groups
      const storedGroups = localStorage.getItem("joinedSettlementGroups")
      if (storedGroups) {
        const groups = JSON.parse(storedGroups)
        const updatedGroups = groups.filter((g: SettlementGroup) => g.id !== group.id)
        localStorage.setItem("joinedSettlementGroups", JSON.stringify(updatedGroups))
      }
    }

    router.push("/settlement")
  }

  const handleStartSettlement = () => {
    if (!group || !group.isOwner) return

    // 시작할 때 첫 번째 멤버(그룹 방장)을 기본으로 선택
    setSelectedMembers([group.members[0].id])
    setShowMemberSelectModal(true)
  }

  const handleConfirmMemberSelection = () => {
    if (!group || selectedMembers.length === 0) return

    // Calculate settlement amount
    if (group.transactions) {
      const totalAmount = group.transactions.reduce((sum: BigDecimal, tx: Transaction) => sum + tx.amount, 0)
      const perPersonAmount = Math.ceil(totalAmount / selectedMembers.length)
      setSettlementAmount(perPersonAmount)
    }

    const updatedGroup = {
      ...group,
      isSettling: true,
      isActive: false, // Deactivate group during settlement
      selectedMembers: selectedMembers,
    }

    setGroup(updatedGroup)
    setShowMemberSelectModal(false)
    setShowSettlementModal(true)

    // Update in localStorage
    const storedGroups = localStorage.getItem("mySettlementGroups")
    if (storedGroups) {
      const groups = JSON.parse(storedGroups)
      const updatedGroups = groups.map((g: SettlementGroup) => (g.id === group.id ? updatedGroup : g))
      localStorage.setItem("mySettlementGroups", JSON.stringify(updatedGroups))
    }
  }

  const handleCancelSettlement = () => {
    if (!group || !group.isOwner) return

    // Check if any members have already settled
    const anySettled = group.members.some((member) => member.hasSettled)

    if (anySettled) {
      if (!confirm("이미 정산한 멤버가 있습니다. 정산을 취소하면 송금된 금액이 환불됩니다. 계속하시겠습니까?")) {
        return
      }

      // In a real app, we would process refunds here
    }

    const updatedGroup = {
      ...group,
      isSettling: false,
      isActive: true, // Reactivate group
      selectedMembers: [],
      members: group.members.map((member) => ({
        ...member,
        hasSettled: false,
      })),
    }

    setGroup(updatedGroup)
    setShowSettlementModal(false)

    // Update in localStorage
    const storedGroups = localStorage.getItem("mySettlementGroups")
    if (storedGroups) {
      const groups = JSON.parse(storedGroups)
      const updatedGroups = groups.map((g: SettlementGroup) => (g.id === group.id ? updatedGroup : g))
      localStorage.setItem("mySettlementGroups", JSON.stringify(updatedGroups))
    }
  }

  const handleSettlePayment = () => {
    if (!group || group.isOwner) return

    // Check if user has wallet with matching currency
    const matchingWallet = walletBalances.find((wallet) => wallet.code === group.currency)

    if (!matchingWallet) {
      alert(`${group.currency} 지갑이 없습니다. 다른 통화 지갑에서 환전하거나 충전해주세요.`)
      return
    }

    if (matchingWallet.amount < settlementAmount) {
      alert(`잔액이 부족합니다. 충전 후 다시 시도해주세요.`)
      return
    }

    // Process payment
    const updatedWalletBalances = walletBalances.map((wallet) => {
      if (wallet.code === group.currency) {
        return {
          ...wallet,
          amount: wallet.amount - settlementAmount,
        }
      }
      return wallet
    })

    setWalletBalances(updatedWalletBalances)
    localStorage.setItem("walletBalances", JSON.stringify(updatedWalletBalances))

    // Update member status
    const updatedMembers = group.members.map((member) => {
      if (!member.isOwner && member.name === "이월렛") {
        // Assuming current user is 이월렛 for demo
        return {
          ...member,
          hasSettled: true,
        }
      }
      return member
    })

    const updatedGroup = {
      ...group,
      members: updatedMembers,
    }

    // 송금 내역 추가
    const newPayment = {
      id: `payment-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      fromMemberId: group.members.find((m) => !m.isOwner && m.name === "이월렛")?.id || "",
      fromMemberName: "이월렛", // 현재 사용자 이름
      amount: settlementAmount,
      currency: group.currency,
    }

    const updatedPayments = group.payments ? [...group.payments, newPayment] : [newPayment]
    const updatedGroupWithPayment = {
      ...updatedGroup,
      payments: updatedPayments,
    }

    setGroup(updatedGroupWithPayment)

    // Check if all members have settled
    const allSettled = updatedMembers.every((member) => member.isOwner || member.hasSettled)

    if (allSettled) {
      // Settlement complete, reactivate group
      const completedGroup = {
        ...updatedGroupWithPayment,
        isSettling: false,
        isActive: true,
        selectedMembers: [],
      }

      // 방장의 그룹도 업데이트
      const storedMyGroups = localStorage.getItem("mySettlementGroups")
      if (storedMyGroups) {
        const myGroups = JSON.parse(storedMyGroups)
        const updatedMyGroups = myGroups.map((g: SettlementGroup) => (g.id === group.id ? completedGroup : g))
        localStorage.setItem("mySettlementGroups", JSON.stringify(updatedMyGroups))
      }

      setGroup(completedGroup)

      // Update in localStorage (joined groups)
      const storedGroups = localStorage.getItem("joinedSettlementGroups")
      if (storedGroups) {
        const groups = JSON.parse(storedGroups)
        const updatedGroups = groups.map((g: SettlementGroup) => (g.id === group.id ? completedGroup : g))
        localStorage.setItem("joinedSettlementGroups", JSON.stringify(updatedGroups))
      }

      alert("정산이 완료되었습니다!")
    } else {
      // Update in localStorage (joined groups)
      const storedGroups = localStorage.getItem("joinedSettlementGroups")
      if (storedGroups) {
        const groups = JSON.parse(storedGroups)
        const updatedGroups = groups.map((g: SettlementGroup) => (g.id === group.id ? updatedGroupWithPayment : g))
        localStorage.setItem("joinedSettlementGroups", JSON.stringify(updatedGroups))
      }

      alert("송금이 완료되었습니다!")
    }
  }

  const toggleMemberSelection = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      KRW: "₩",
      USD: "$",
      EUR: "€",
      JPY: "¥",
      CNY: "¥",
      VND: "₫",
      INR: "₹",
      SGD: "S$",
    }
    return symbols[code] || ""
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
        <p className="mt-4 text-gray-500">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <Link href="/settlement" className="text-gray-700">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">{group.name}</h1>
        <button onClick={() => setShowInviteModal(true)} className="text-blue-500">
          <Share2 size={20} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {/* Active Toggle */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-500">
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
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <p className="font-medium">정산 그룹 활성화</p>
                <p className="text-sm text-gray-500">
                  {group.isActive
                    ? "활성화되어 있습니다."
                    : group.isSettling
                      ? "정산 진행 중입니다."
                      : "비활성화되어 있습니다."}
                </p>
              </div>
            </div>
            {group.isOwner && !group.isSettling && (
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={group.isActive}
                  onChange={handleToggleActive}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </label>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="border-b border-gray-200 p-4">
          <h2 className="mb-4 text-lg font-medium">
            멤버 {group.memberCount}/{group.maxMembers}
          </h2>
          <div className="space-y-4">
            {group.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`relative mr-3 h-10 w-10 rounded-full ${member.color} flex items-center justify-center text-white font-medium`}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">{member.name}</p>
                      {member.isOwner && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">대표</span>
                      )}
                    </div>
                    {group.isSettling && !member.isOwner && (
                      <p className="text-sm text-gray-500">{member.hasSettled ? "정산 완료" : "정산 대기중"}</p>
                    )}
                  </div>
                </div>
                {group.isSettling && member.hasSettled && (
                  <div className="rounded-full bg-green-100 p-1 text-green-500">
                    <Check size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {!group.isSettling && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="mt-4 w-full rounded-lg border border-blue-500 py-2 text-center text-blue-500"
            >
              멤버 초대하기
            </button>
          )}
        </div>

        {/* Send Money Button Section */}
        {!group.isOwner &&
          group.isSettling &&
          !group.selectedMembers?.includes(group.members.find((m) => !m.isOwner && m.name === "이월렛")?.id || "") && (
            <div className="border-b border-gray-200 p-4">
              <button
                onClick={() => {
                  // 방장의 지갑 번호 생성 (실제로는 DB에서 가져와야 함)
                  const ownerWalletNumber = `9791-${group.currency.charCodeAt(0)}${group.currency.charCodeAt(1)}-${
                    group.currency.length > 2 ? group.currency.charCodeAt(2) : "00"
                  }1000-4618`

                  // 방장 이름 (첫 번째 멤버 중 isOwner가 true인 멤버)
                  const ownerName = group.members.find((m) => m.isOwner)?.name || "방장"

                  // URL 파라미터 인코딩 및 전달 방식 개선
                  router.push(
                    `/wallet/transfer?currency=${encodeURIComponent(group.currency)}&walletNumber=${encodeURIComponent(ownerWalletNumber)}&recipientName=${encodeURIComponent(ownerName)}&skipFirstStep=true`,
                  )
                }}
                className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md"
              >
                방장에게 송금하기
              </button>
            </div>
          )}

        {!group.isOwner &&
          !group.isActive &&
          group.isSettling &&
          group.selectedMembers?.includes(group.members.find((m) => !m.isOwner && m.name === "이월렛")?.id || "") && (
            <div className="border-b border-gray-200 p-4">
              <button
                onClick={handleSettlePayment}
                className="w-full rounded-lg bg-gradient-to-b from-[#FF4D4D] to-[#FF3B3B] py-3 text-center font-medium text-white shadow-md"
              >
                정산금 송금하기
              </button>
            </div>
          )}

        {/* Transaction History Section - 비활성화되어도 기존 거래 내역은 보여줌 */}
        {group.transactions && group.transactions.length > 0 && (
          <div className="border-b border-gray-200 p-4">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setShowTransactionHistory(!showTransactionHistory)}
            >
              <h2 className="text-lg font-medium">거래 내역</h2>
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
                className={`transition-transform ${showTransactionHistory ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {!group.isActive && !group.isSettling && (
              <p className="mt-2 text-sm text-orange-600">
                ⚠️ 그룹이 비활성화되어 새로운 거래 내역은 추가되지 않습니다.
              </p>
            )}

            {showTransactionHistory && (
              <div className="mt-4 space-y-3">
                {group.transactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="font-bold text-gray-800">
                        {getCurrencySymbol(transaction.currency)} {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment History Section */}
        {(group.isOwner || !group.isActive) && group.payments && group.payments.length > 0 && (
          <div className="border-b border-gray-200 p-4">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            >
              <h2 className="text-lg font-medium">송금 내역</h2>
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
                className={`transition-transform ${showPaymentHistory ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {showPaymentHistory && (
              <div className="mt-4 space-y-3">
                {group.payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{payment.fromMemberName}님의 송금</p>
                      <p className="font-bold text-green-600">
                        +{getCurrencySymbol(payment.currency)} {payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">{payment.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settlement Section */}
        {group.isSettling ? (
          <div className="p-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="mb-4 flex items-center justify-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              </div>
              <h3 className="mb-2 text-center text-xl font-bold text-blue-700">정산 진행 중</h3>
              {!group.isOwner && (
                <div className="mb-4 rounded-lg bg-yellow-50 p-2 text-center text-yellow-700 text-sm">
                  <AlertCircle className="inline mr-1 h-4 w-4" />
                  정산이 진행 중입니다. 방장의 요청에 따라 정산금을 송금해주세요.
                </div>
              )}
              <p className="mb-4 text-center text-blue-600">
                {group.isOwner ? "멤버들의 정산이 완료될 때까지 기다려주세요." : "정산 금액을 확인하고 송금해주세요."}
              </p>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-blue-600">1인당 정산 금액</span>
                <span className="font-bold text-blue-700">
                  {getCurrencySymbol(group.currency)} {settlementAmount.toLocaleString()}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-blue-600">정산 완료</span>
                <span className="font-bold text-blue-700">
                  {group.members.filter((m) => m.isOwner || m.hasSettled).length}/{group.members.length}
                </span>
              </div>

              {group.isOwner ? (
                <button
                  onClick={handleCancelSettlement}
                  className="w-full rounded-lg bg-white py-2 text-center font-medium text-red-500"
                >
                  정산 취소하기
                </button>
              ) : (
                group.selectedMembers?.includes(
                  group.members.find((m) => !m.isOwner && m.name === "이월렛")?.id || "",
                ) && (
                  <button
                    onClick={handleSettlePayment}
                    disabled={!hasWallet}
                    className={`w-full rounded-lg py-2 text-center font-medium text-white ${
                      hasWallet ? "bg-gradient-to-b from-[#FF4D4D] to-[#FF3B3B]" : "bg-gray-300"
                    }`}
                  >
                    {hasWallet ? "정산금 송금하기" : "지갑이 필요합니다"}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          group.isOwner && (
            <div className="p-4">
              <button
                onClick={handleStartSettlement}
                className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md"
              >
                정산 시작하기
              </button>
            </div>
          )
        )}

        {/* Leave Group Button */}
        <div className="mt-auto p-4">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="w-full rounded-lg border border-red-500 py-2 text-center font-medium text-red-500"
          >
            {group.isOwner ? "그룹 폭파하기" : "그룹 나가기"}
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <ModalPortal>
          {renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={getModalBackgroundStyle()}
            onClick={() => setShowInviteModal(false)}
          >
            <div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl bg-white p-6 shadow-xl"
              style={getBottomSheetStyle()}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold">멤버 초대</h2>

              {group.inviteCode ? (
                <>
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700">초대 코드</label>
                    <div className="flex items-center">
                      <div className="flex-1 rounded-l-lg border border-gray-300 bg-gray-50 p-3 font-mono">
                        {group.inviteCode}
                      </div>
                      <button onClick={handleCopyInviteCode} className="rounded-r-lg bg-blue-500 p-3 text-white">
                        {inviteCopied ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock size={16} className="mr-1" />
                      <span>유효시간: {timeLeft}</span>
                    </div>
                  </div>

                  {group.isOwner && (
                    <button
                      onClick={handleRegenerateInviteCode}
                      className="mb-4 flex w-full items-center justify-center rounded-lg border border-blue-500 py-2 text-center font-medium text-blue-500"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      초대 코드 재발급
                    </button>
                  )}
                </>
              ) : (
                <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-yellow-700">
                  <div className="flex items-center">
                    <AlertCircle size={20} className="mr-2" />
                    <p>초대 코드가 만료되었습니다. 방장에게 재발급을 요청하세요.</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full rounded-lg bg-gray-200 py-3 text-center font-medium text-gray-700"
              >
                닫기
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <ModalPortal>
          {renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={getModalBackgroundStyle()}
            onClick={() => setShowLeaveModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={getCenterModalStyle()}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-xl font-bold text-red-500">
                  {group.isOwner ? "그룹 폭파하기" : "그룹 나가기"}
                </h2>
                <p className="mb-6 text-gray-600">
                  {group.isOwner
                    ? "그룹을 폭파하면 모든 멤버가 그룹에서 제외되고 그룹 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                    : "그룹을 나가면 더 이상 그룹 정보를 볼 수 없습니다. 계속하시겠습니까?"}
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={handleLeaveGroup}
                    className="flex-1 rounded-lg bg-red-500 py-3 text-center font-medium text-white"
                  >
                    {group.isOwner ? "폭파하기" : "나가기"}
                  </button>
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Member Selection Modal */}
      {showMemberSelectModal && (
        <ModalPortal>
          {renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={getModalBackgroundStyle()}
            onClick={() => setShowMemberSelectModal(false)}
          >
            <div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl bg-white p-6 shadow-xl"
              style={getBottomSheetStyle()}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold">정산 멤버 선택</h2>
              <p className="mb-4 text-sm text-gray-600">
                정산에 포함할 멤버를 선택해주세요. 선택 후에는 변경할 수 없습니다.
              </p>

              <div className="mb-6 max-h-60 overflow-y-auto">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="mb-2 flex items-center justify-between rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-center">
                      <div
                        className={`relative mr-3 h-10 w-10 rounded-full ${member.color} flex items-center justify-center text-white font-medium`}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <p className="font-medium">{member.name}</p>
                    </div>
                    <div
                      onClick={() => toggleMemberSelection(member.id)}
                      className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border ${
                        selectedMembers.includes(member.id)
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selectedMembers.includes(member.id) && <Check size={14} />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmMemberSelection}
                  disabled={selectedMembers.length === 0}
                  className={`flex-1 rounded-lg py-3 text-center font-medium text-white ${
                    selectedMembers.length > 0 ? "bg-[#0DAEFF]" : "bg-gray-300"
                  }`}
                >
                  확인
                </button>
                <button
                  onClick={() => setShowMemberSelectModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Settlement Modal */}
      {showSettlementModal && (
        <ModalPortal>
          {renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={getModalBackgroundStyle()}
            onClick={() => setShowSettlementModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={getCenterModalStyle()}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-xl font-bold">정산 시작</h2>

                <div className="mb-6 rounded-lg bg-blue-50 p-4">
                  <h3 className="mb-2 font-medium text-blue-700">정산 정보</h3>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-blue-600">총 정산 금액</span>
                    <span className="font-bold text-blue-700">
                      {getCurrencySymbol(group.currency)}{" "}
                      {group.transactions
                        ? group.transactions
                            .reduce((sum: BigDecimal, tx: Transaction) => sum + tx.amount, 0)
                            .toLocaleString()
                        : "0"}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-blue-600">정산 인원</span>
                    <span className="font-bold text-blue-700">{selectedMembers.length}명</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600">1인당 정산 금액</span>
                    <span className="font-bold text-blue-700">
                      {getCurrencySymbol(group.currency)} {settlementAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="mb-6 text-sm text-gray-600">
                  정산을 시작하면 그룹이 비활성화되고, 모든 멤버가 정산을 완료할 때까지 비활성화 상태가 유지됩니다.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSettlementModal(false)}
                    className="flex-1 rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white"
                  >
                    확인
                  </button>
                  <button
                    onClick={handleCancelSettlement}
                    className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700"
                  >
                    정산 취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Activate/Deactivate Info Modal */}
      {showActivateInfoModal && (
        <ModalPortal>
          {renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={getModalBackgroundStyle()}
            onClick={() => setShowActivateInfoModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={getCenterModalStyle()}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-xl font-bold">{group.isActive ? "정산 그룹 비활성화" : "정산 그룹 활성화"}</h2>

                <div className="mb-6 rounded-lg bg-blue-50 p-4">
                  {group.isActive ? (
                    <p className="text-blue-700">
                      비활성화 시, 당신이 그룹을 만들었을 때 선택했던 지갑의 이용 내역이 멤버들에게 공유되지 않습니다.
                      그리고 정산 금액에도 자동으로 포함되지 않습니다. 단, 이전에 공유된 거래 내역은 그대로 유지됩니다.
                    </p>
                  ) : (
                    <p className="text-blue-700">
                      활성화 시, 당신이 그룹을 만들었을 때 선택했던 지갑의 이용 내역이 멤버들에게 공유됩니다. 해당 이용
                      내역은 정산 금액에 자동으로 포함됩니다.
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={confirmToggleActive}
                    className="flex-1 rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white"
                  >
                    확인
                  </button>
                  <button
                    onClick={() => setShowActivateInfoModal(false)}
                    className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}