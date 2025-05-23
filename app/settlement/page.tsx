"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Plus, Info, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import ModalPortal from "@/components/modal-portal"

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
  isSettling?: boolean
}

export default function SettlementPage() {
  const router = useRouter()
  const [myGroups, setMyGroups] = useState<SettlementGroup[]>([])
  const [joinedGroups, setJoinedGroups] = useState<SettlementGroup[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showSettlementGuideModal, setShowSettlementGuideModal] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [inviteCodeError, setInviteCodeError] = useState("")
  const [remainingAttempts, setRemainingAttempts] = useState(5)
  const [walletBalances, setWalletBalances] = useState<any[]>([])
  const [hasWallet, setHasWallet] = useState(false)

  // Load wallet balances and groups from localStorage on mount
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

    // Load settlement groups
    const storedMyGroups = localStorage.getItem("mySettlementGroups")
    if (storedMyGroups) {
      setMyGroups(JSON.parse(storedMyGroups))
    } else {
      // Set demo data if none exists
      // "홍대 모임"을 "유럽 여행"으로 변경
      const demoMyGroups: SettlementGroup[] = [
        {
          id: "group1",
          name: "도쿄 여행",
          isActive: true,
          isOwner: true,
          memberCount: 3,
          maxMembers: 8,
          currency: "JPY",
          flagSrc: "/images/flags/japan.png",
          inviteCode: "TOKYO2025",
          inviteExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
          createdAt: new Date(),
        },
        {
          id: "group2",
          name: "인도 여행",
          isActive: false,
          isOwner: true,
          memberCount: 5,
          maxMembers: 10,
          currency: "INR",
          flagSrc: "/images/flags/india.png",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
        {
          id: "group5",
          name: "유럽 여행",
          isActive: false,
          isOwner: true,
          isSettling: true, // 정산 진행 중 상태
          memberCount: 4,
          maxMembers: 6,
          currency: "EUR",
          flagSrc: "/images/flags/eu.png",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
      ]
      setMyGroups(demoMyGroups)
      localStorage.setItem("mySettlementGroups", JSON.stringify(demoMyGroups))
    }

    const storedJoinedGroups = localStorage.getItem("joinedSettlementGroups")
    if (storedJoinedGroups) {
      setJoinedGroups(JSON.parse(storedJoinedGroups))
    } else {
      // Set demo data if none exists
      const demoJoinedGroups: SettlementGroup[] = [
        {
          id: "group3",
          name: "미국 여행",
          isActive: true,
          isOwner: false,
          memberCount: 4,
          maxMembers: 5,
          currency: "USD",
          flagSrc: "/images/flags/usa.png",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          id: "group4",
          name: "인도 여행",
          isActive: false,
          isOwner: false,
          isSettling: true, // 정산 진행 중 상태
          memberCount: 3,
          maxMembers: 5,
          currency: "INR",
          flagSrc: "/images/flags/india.png",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      ]
      setJoinedGroups(demoJoinedGroups)
      localStorage.setItem("joinedSettlementGroups", JSON.stringify(demoJoinedGroups))
    }
  }, [router])

  const handleCreateGroup = () => {
    if (!hasWallet) {
      alert("지갑이 없어 정산 그룹을 만들 수 없습니다. 먼저 지갑을 생성해주세요.")
      return
    }
    setShowCreateModal(true)
  }

  const handleJoinGroup = () => {
    if (!hasWallet) {
      alert("지갑이 없어 정산 그룹에 참여할 수 없습니다. 먼저 지갑을 생성해주세요.")
      return
    }
    setShowJoinModal(true)
  }

  const handleInviteCodeSubmit = () => {
    if (!inviteCode.trim()) {
      setInviteCodeError("초대 코드를 입력해주세요.")
      return
    }

    // Check if code matches any existing group
    const matchingGroup = myGroups.find((group) => group.inviteCode === inviteCode.trim())

    if (matchingGroup) {
      // Navigate to the group
      router.push(`/settlement/group/${matchingGroup.id}`)
      setShowJoinModal(false)
      setInviteCode("")
      setInviteCodeError("")
      setRemainingAttempts(5)
    } else {
      // Decrease remaining attempts
      const newAttempts = remainingAttempts - 1
      setRemainingAttempts(newAttempts)

      if (newAttempts <= 0) {
        setInviteCodeError("시도 횟수(5회)를 초과했습니다. 나중에 다시 시도해주세요.")
        // Disable input for some time
        setTimeout(() => {
          setRemainingAttempts(5)
          setInviteCodeError("")
        }, 60000) // 1 minute timeout
      } else {
        setInviteCodeError(`유효하지 않은 초대 코드입니다. 남은 시도 횟수: ${newAttempts}회`)
      }
    }
  }

  // Navigation items with custom icons
  const navItems = [
    { name: "홈", path: "/home", icon: "/images/icons/home-icon.png" },
    { name: "정산", path: "/settlement", icon: "/images/icons/settlement-icon.png" },
    { name: "환전", path: "/exchange", icon: "/images/icons/exchange-icon.png" },
    { name: "결제", path: "/payment", icon: "/images/icons/payment-icon.png" },
    { name: "더 보기", path: "/more", icon: "" }, // Using Lucide icon for this one
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <Link href="/home" className="text-gray-700">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">정산</h1>
        <div className="w-6"></div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* Info Banner */}
        <div
          className="mb-6 flex items-center rounded-lg bg-blue-50 p-3 text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setShowSettlementGuideModal(true)}
        >
          <Info className="mr-2 h-5 w-5" />
          <p className="text-sm">정산이 어떻게 진행되나요?</p>
        </div>

        {/* My Groups Section */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">
              내가 생성한 그룹 {myGroups.length}/{10}
            </h2>
          </div>

          {myGroups.length > 0 ? (
            <div className="space-y-3">
              {myGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/settlement/group/${group.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-3 h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                        <Image
                          src={group.flagSrc || "/placeholder.svg"}
                          alt={group.currency}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          멤버 {group.memberCount}/{group.maxMembers} •
                          {group.isSettling ? "정산 진행 중" : group.isActive ? "활성" : "비활성"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        group.isSettling ? "bg-red-500" : group.isActive ? "bg-green-500" : "bg-gray-300"
                      } shadow-sm`}
                    ></div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <Info className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mb-2 text-gray-500">생성한 그룹이 없습니다.</p>
              <p className="text-sm text-gray-400">새로운 정산 그룹을 만들어보세요.</p>
            </div>
          )}
        </div>

        {/* Joined Groups Section */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">
              참여중인 그룹 {joinedGroups.length}/{10}
            </h2>
          </div>

          {joinedGroups.length > 0 ? (
            <div className="space-y-3">
              {joinedGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/settlement/group/${group.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-3 h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                        <Image
                          src={group.flagSrc || "/placeholder.svg"}
                          alt={group.currency}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          멤버 {group.memberCount}/{group.maxMembers} •
                          {group.isSettling ? "정산 진행 중" : group.isActive ? "활성" : "비활성"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        group.isSettling ? "bg-red-500" : group.isActive ? "bg-green-500" : "bg-gray-300"
                      } shadow-sm`}
                    ></div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <Info className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mb-2 text-gray-500">참여중인 그룹이 없습니다.</p>
              <p className="text-sm text-gray-400">초대 코드를 통해 그룹에 참여해보세요.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-20 right-4 flex flex-col space-y-3">
          <button
            onClick={handleJoinGroup}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-500 shadow-lg transition-all hover:bg-blue-50"
          >
            <Share2 size={20} />
          </button>
          <button
            onClick={handleCreateGroup}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white shadow-lg transition-all hover:shadow-xl"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto border-t border-gray-200 bg-white shadow-md">
        <div className="flex">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className={`group flex flex-1 flex-col items-center justify-center py-3 ${
                item.path === "/settlement" ? "text-[#0DAEFF]" : "text-gray-500"
              }`}
            >
              {item.name === "더 보기" ? (
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
                  className="h-8 w-8"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              ) : (
                <div className="relative h-8 w-8">
                  <Image
                    src={item.icon || "/placeholder.svg"}
                    alt={item.name}
                    width={32}
                    height={32}
                    className={`transition-all duration-300 ${
                      item.path === "/settlement" ? "drop-shadow-sm opacity-100" : "opacity-70 group-hover:opacity-90"
                    }`}
                  />
                  {item.path === "/settlement" && (
                    <div className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-[#0DAEFF]"></div>
                  )}
                </div>
              )}
              <span
                className={`mt-1 text-xs font-medium transition-all duration-300 ${
                  item.path === "/settlement" ? "font-semibold" : "group-hover:text-gray-700"
                }`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Settlement Guide Modal */}
      {showSettlementGuideModal && (
        <ModalPortal>
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
          `}</style>
          <div
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(2px)",
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={() => setShowSettlementGuideModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={{
                  animation: "scaleIn 0.3s ease-out",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-xl font-bold text-blue-600">정산 진행 안내</h2>

                <div className="space-y-4 text-sm text-gray-700">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h3 className="mb-2 font-semibold text-blue-700">1. 정산 그룹 생성</h3>
                    <p>
                      그룹을 생성하고 멤버들을 초대합니다. 그룹이 활성화되면 방장의 지갑 거래 내역이 자동으로
                      공유됩니다.
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <h3 className="mb-2 font-semibold text-green-700">2. 거래 내역 공유</h3>
                    <p>그룹이 활성화된 상태에서 방장이 결제한 내역들이 실시간으로 멤버들에게 공유됩니다.</p>
                  </div>

                  <div className="rounded-lg bg-orange-50 p-3">
                    <h3 className="mb-2 font-semibold text-orange-700">3. 정산 시작</h3>
                    <p>
                      방장이 정산할 멤버를 선택하고 정산을 시작합니다. 총 금액이 인원수로 나누어져 1인당 정산 금액이
                      계산됩니다.
                    </p>
                  </div>

                  <div className="rounded-lg bg-purple-50 p-3">
                    <h3 className="mb-2 font-semibold text-purple-700">4. 송금 완료</h3>
                    <p>멤버들이 각자의 정산 금액을 방장에게 송금하면 정산이 완료됩니다.</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSettlementGuideModal(false)}
                  className="mt-6 w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <ModalPortal>
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
          `}</style>
          <div
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(2px)",
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={{
                  animation: "scaleIn 0.3s ease-out",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-xl font-bold">정산 그룹 생성</h2>
                <p className="mb-6 text-sm text-gray-600">
                  정산 그룹을 생성하면 초대 코드가 발급됩니다. 이 코드를 공유하여 멤버들을 초대할 수 있습니다.
                </p>

                <Link
                  href="/settlement/create"
                  className="mb-4 block w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md"
                >
                  그룹 생성하기
                </Link>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <ModalPortal>
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
          `}</style>
          <div
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(2px)",
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={() => {
              setShowJoinModal(false)
              setInviteCode("")
              setInviteCodeError("")
              setRemainingAttempts(5)
            }}
          >
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={{
                  animation: "scaleIn 0.3s ease-out",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-xl font-bold">정산 그룹 참여</h2>
                <p className="mb-6 text-sm text-gray-600">
                  정산 그룹 방장에게 받은 초대 코드를 입력하여 그룹에 참여하세요.
                </p>

                <div className="mb-4">
                  <label htmlFor="inviteCode" className="mb-2 block text-sm font-medium text-gray-700">
                    초대 코드
                  </label>
                  <input
                    type="text"
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="초대 코드를 입력하세요"
                    className={`w-full rounded-lg border ${
                      inviteCodeError ? "border-red-500" : "border-gray-300"
                    } p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    disabled={remainingAttempts <= 0}
                  />
                  {inviteCodeError && <p className="mt-1 text-sm text-red-500">{inviteCodeError}</p>}
                </div>

                <button
                  onClick={handleInviteCodeSubmit}
                  disabled={remainingAttempts <= 0}
                  className="mb-4 w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md disabled:bg-gray-300"
                >
                  참여하기
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false)
                    setInviteCode("")
                    setInviteCodeError("")
                    setRemainingAttempts(5)
                  }}
                  className="w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
