"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Plus, Info, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import ModalPortal from "@/components/modal-portal"
import { getValidToken } from "@/lib/auth"
import { mapCurrencyToFlag } from "@/lib/utils"

type Wallet = {
  id: number;
  walletNumber: string;
  balance: number;
  currency: string;
  ownerName: string;
};

type SettlementGroup = {
  id: number;
  name: string;
  isActive: boolean;
  isOwner: boolean;
  memberCount: number;
  maxMembers: number;
  currencyCode: string;
  currencyName: string;
  settlementStatus: string;
  createdAt: string;
  flagSrc?: string;
  members?: SettlementMember[];
}

type SettlementMember = {
  userId: number;
  name: string;
  profileImage: string;
  wallets: Wallet[];
  hasTransferred: boolean;
};

export default function SettlementPage() {
  const router = useRouter()
  const [myGroups, setMyGroups] = useState<SettlementGroup[]>([])
  const [joinedGroups, setJoinedGroups] = useState<SettlementGroup[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showSettlementGuideModal, setShowSettlementGuideModal] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [inviteCodeError, setInviteCodeError] = useState("")
  const [hasWallet, setHasWallet] = useState(false)
  const [memberCounts, setMemberCounts] = useState<{ [groupId: number]: number }>({})

  // Load groups from API on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = await getValidToken();
        
        // Fetch my groups
        const myGroupsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        });

        if (!myGroupsResponse.ok) {
          const errorData = await myGroupsResponse.json().catch(() => ({}));
          throw new Error(errorData.message || '내 그룹 목록을 불러오지 못했습니다.');
        }

        const myGroupsData = await myGroupsResponse.json();
        console.log("My Groups API result:", myGroupsData.result);
        setMyGroups(
          (myGroupsData.result as SettlementGroup[]).map((group: SettlementGroup) => ({
            ...group,
            flagSrc: `/images/flags/${mapCurrencyToFlag(group.currencyCode || "KRW")}`
          }))
        );

        // Fetch joined groups
        const joinedGroupsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/joined`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        });

        if (!joinedGroupsResponse.ok) {
          const errorData = await joinedGroupsResponse.json().catch(() => ({}));
          throw new Error(errorData.message || '참여 그룹 목록을 불러오지 못했습니다.');
        }

        const joinedGroupsData = await joinedGroupsResponse.json();
        console.log("Joined Groups API result:", joinedGroupsData.result);
        setJoinedGroups(
          (joinedGroupsData.result as SettlementGroup[])
            .filter((group) => !!group)
            .map((group: SettlementGroup) => ({
              ...group,
              flagSrc: `/images/flags/${mapCurrencyToFlag(group.currencyCode || "KRW")}`
            }))
        );

        // Check if user has any wallet
        const walletResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        });

        if (!walletResponse.ok) {
          const errorData = await walletResponse.json().catch(() => ({}));
          throw new Error(errorData.message || '지갑 정보를 불러오지 못했습니다.');
        }

        const walletData = await walletResponse.json();
        console.log("Wallet API result:", walletData.result);
        setHasWallet(walletData.result.length > 0);

      } catch (error) {
        console.error('Error fetching data:', error);
        if (error instanceof Error && error.message === "No token found") {
          router.push("/login");
        } else {
          alert(error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.');
        }
      }
    };

    // joinedGroupId 플래그가 있으면 joinedGroups를 강제로 새로고침
    const joinedGroupId = localStorage.getItem("joinedGroupId");
    if (joinedGroupId) {
      fetchGroups();
      localStorage.removeItem("joinedGroupId");
    } else {
      fetchGroups();
    }
  }, [router]);

  // 그룹 리스트 fetch 후, 각 그룹별 멤버 수 fetch
  useEffect(() => {
    if (joinedGroups.length === 0) return;
    joinedGroups.forEach(async (group) => {
      if (!group) return;
      try {
        const token = await getValidToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${group.id}/member-count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );
        if (!res.ok) {
          // 에러 핸들링
          console.error("멤버 수 API 에러:", res.status, await res.text());
          return;
        }
        const data = await res.json();
        setMemberCounts((prev) => ({
          ...prev,
          [group.id]: data.result + 1, // 방장 포함하려면 +1
        }));
      } catch (e) {
        console.error("멤버 수 fetch 예외:", e);
      }
    });
  }, [joinedGroups]);

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

  const handleInviteCodeSubmit = async () => {
    if (!inviteCode.trim()) {
      setInviteCodeError("초대 코드를 입력해주세요.")
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
        body: JSON.stringify({ joinCode: inviteCode.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // SettlementErrorCode에 따른 안내 메시지 처리
        let errorMessage = errorData.message || '초대 코드 검증에 실패했습니다.';
        if (errorData.code === 'SETTLEMENT_001') {
          errorMessage = '정산 그룹이 존재하지 않습니다.';
        } else if (errorData.code === 'SETTLEMENT_013') {
          errorMessage = '해당 정산 그룹에 접근할 수 없습니다.';
        } else if (errorData.code === 'SETTLEMENT_015') {
          errorMessage = '정산 그룹의 최대 참여 인원을 초과했습니다.';
        }
        setInviteCodeError(errorMessage);
        return;
      }

      const result = await response.json();
      console.log("verify join code API result:", result);
      const verifyData = result.result || result.data || result;
      if (!verifyData) {
        throw new Error('Invalid response format');
      }
      
      if (!verifyData.isValid) {
        setInviteCodeError(verifyData.message || "초대 코드가 만료되었거나 유효하지 않습니다.");
        return;
      }

      // 참여 성공 시 플래그 저장
      if (verifyData.groupId) {
        localStorage.setItem("joinedGroupId", String(verifyData.groupId));
      }
      router.push(`/settlement/group/${verifyData.groupId}`)
      setShowJoinModal(false)
      setInviteCode("")
      setInviteCodeError("")
    } catch (error) {
      console.error('Error joining group:', error);
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        alert(error instanceof Error ? error.message : '그룹 참여 중 오류가 발생했습니다.');
      }
    }
  };

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
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4 shadow-sm">
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
              {myGroups.filter((group) => !!group).map((group) => (
                <Link
                  key={group.id}
                  href={`/settlement/group/${group.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-3 h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                        <Image
                          src={group.flagSrc || "/images/flags/korea.png"}
                          alt={group.currencyName}
                          width={40}
                          height={40}
                          style={{height: 'auto', width: 40}}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          멤버 {memberCounts[group.id] ?? (Array.isArray(group.members) ? group.members.length + 1 : 1)}/{group.maxMembers} •
                          {group.settlementStatus === "IN_PROGRESS" ? "정산 진행 중" : group.isActive ? "활성" : "비활성"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        group.settlementStatus === "IN_PROGRESS" ? "bg-red-500" : group.isActive ? "bg-green-500" : "bg-gray-300"
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
              {joinedGroups.filter((group) => !!group).map((group) => (
                <Link
                  key={group.id}
                  href={`/settlement/group/${group.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-3 h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                        <Image
                          src={group.flagSrc || "/images/flags/korea.png"}
                          alt={group.currencyName}
                          width={40}
                          height={40}
                          style={{height: 'auto', width: 40}}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          멤버 {memberCounts[group.id] ?? (Array.isArray(group.members) ? group.members.length : 1)}/{group.maxMembers} •
                          {group.settlementStatus === "IN_PROGRESS" ? "정산 진행 중" : group.isActive ? "활성" : "비활성"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        group.settlementStatus === "IN_PROGRESS" ? "bg-red-500" : group.isActive ? "bg-green-500" : "bg-gray-300"
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
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-500 shadow-lg transition-all hover:bg-blue-50 cursor-pointer"
          >
            <Share2 size={20} />
          </button>
          <button
            onClick={handleCreateGroup}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white shadow-lg transition-all hover:shadow-xl cursor-pointer"
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
                    src={item.icon || "/images/flags/korea.png"}
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
                  className="mb-4 block w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md cursor-pointer"
                >
                  그룹 생성하기
                </Link>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
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
                  />
                  {inviteCodeError && <p className="mt-1 text-sm text-red-500">{inviteCodeError}</p>}
                </div>

                <button
                  onClick={handleInviteCodeSubmit}
                  className="mb-4 w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md disabled:bg-gray-300 cursor-pointer"
                >
                  참여하기
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false)
                    setInviteCode("")
                    setInviteCodeError("")
                  }}
                  className="w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
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
