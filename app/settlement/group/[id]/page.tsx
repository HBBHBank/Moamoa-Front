"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, Share2, Clock, Copy, RefreshCw, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import ModalPortal from "@/components/modal-portal"
import { getValidToken } from "@/lib/auth"

// SearchWalletResponseDto 타입 정의 (백엔드 DTO에 맞춤)
type Wallet = {
  id: number;
  walletNumber: string;
  balance: number;
  currency: string;
  ownerName: string;
  // 필요시 추가 필드
};

type Host = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  profileImage: string;
  wallets: Wallet[];
};

type SettlementMember = {
  userId: number;
  name: string;
  profileImage: string;
  wallets: Wallet[];
  hasTransferred: boolean;
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
  members: SettlementMember[];
  transactions?: SettlementTransaction[];
  selectedMembers?: number[];
  payments?: Payment[];
  deactivatedAt?: Date;
  inviteCode?: string;
  inviteExpiry?: Date;
  isSettling?: boolean;
  host: Host;
}

type SettlementTransaction = {
  fromUserId: number;
  toUserId: number;
  amount: number;
  isTransferred: boolean;
  maxMembers: number;
  dividedAmount: number;
}

// TransactionResponseDto 타입 추가
type TransactionResponseDto = {
  id: number;
  walletId: number;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  description?: string;
}

// 송금 내역 타입 추가
type Payment = {
  id: number;
  date: string;
  fromMemberId: number;
  fromMemberName: string;
  amount: number;
  currency: string;
}

// memberList 타입 정의
interface MemberListItem {
  id: number;
  name: string;
  profileImage: string;
  isHost: boolean;
  hasTransferred: boolean;
  color: string;
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
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [settlementAmount, setSettlementAmount] = useState(0)
  const [hasWallet, setHasWallet] = useState(false)
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [showActivateInfoModal, setShowActivateInfoModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [showInviteGuideModal, setShowInviteGuideModal] = useState(false)
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false)
  const [transactionsError, setTransactionsError] = useState<string | null>(null)
  const [sharedTransactions, setSharedTransactions] = useState<TransactionResponseDto[]>([])
  const [isSharedTxLoading, setIsSharedTxLoading] = useState(false)
  const [sharedTxError, setSharedTxError] = useState<string | null>(null)

  // Load group data from API on mount
  useEffect(() => {
    const fetchGroupData = async (forceJoin = false) => {
      try {
        const token = await getValidToken();
        const searchParams = new URLSearchParams(window.location.search);
        let allowIfJoinCodeValid = searchParams.get('allowIfJoinCodeValid') === 'true';
        if (forceJoin) allowIfJoinCodeValid = true;
        
        // Fetch group details with allowIfJoinCodeValid parameter
        const groupResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}?allowIfJoinCodeValid=${allowIfJoinCodeValid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include"
          }
        );

        if (!groupResponse.ok) {
          const errorData = await groupResponse.json().catch(() => ({}));
          let errorMessage = '해당 정산 그룹에 접근할 수 없습니다.';
          if (errorData.code === 'MEMBER_LIMIT_EXCEEDED') {
            errorMessage = '그룹의 최대 인원이 초과되었습니다.';
          } else if (errorData.code === 'GROUP_NOT_FOUND') {
            errorMessage = '존재하지 않는 그룹입니다.';
          }
          alert(errorMessage);
          router.push("/settlement");
          return;
        }

        const groupData = await groupResponse.json();
        // 본인 userId가 members에 없으면 한 번 더 allowIfJoinCodeValid=true로 요청
        const myId = Number(localStorage.getItem('userId'));
        const isMember = Array.isArray(groupData.result.members) && groupData.result.members.some((m: SettlementMember) => m.userId === myId);
        if (!isMember && !forceJoin) {
          // 멤버 자동 등록을 위해 한 번 더 요청
          await fetchGroupData(true);
          return;
        }
        // 멤버 등록이 완료된 직후 joinedGroupId 플래그 저장
        if (isMember && groupId) {
          localStorage.setItem("joinedGroupId", String(groupId));
          // 안내 메시지 표시 (최초 등록 시에만)
          if (forceJoin) {
            alert("정상적으로 그룹에 참여되었습니다!");
          }
        }
        setGroup(groupData.result);

        // Check if user has any wallet
        const walletResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        });

        if (!walletResponse.ok) {
          throw new Error('Failed to fetch wallets');
        }

        const walletData = await walletResponse.json();
        setHasWallet(walletData.result.length > 0);

      } catch (error) {
        if (error instanceof Error && error.message === "No token found") {
          router.push("/login");
        } else {
          alert(error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.');
          router.push("/settlement");
        }
      }
    };

    fetchGroupData();
  }, [groupId, router]);

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

  const handleRegenerateInviteCode = async () => {
    if (!group || !group.isOwner) return

    try {
      const token = await getValidToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/reissue-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '초대 코드 재발급에 실패했습니다.');
      }

      const result = await response.json();
      if (!result.result) {
        throw new Error('Invalid response format');
      }

      const updatedGroup = {
        ...group,
        inviteCode: result.result.newJoinCode,
        inviteExpiry: new Date(result.result.expiredAt),
      }

      setGroup(updatedGroup)
    } catch (error) {
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        alert(error instanceof Error ? error.message : '초대 코드 재발급 중 오류가 발생했습니다.');
      }
    }
  }

  const handleToggleActive = async () => {
    if (!group || !group.isOwner) return

    try {
      const token = await getValidToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/${group.isActive ? 'deactivate' : 'activate'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '그룹 상태 변경에 실패했습니다.');
      }

      const updatedGroup = {
        ...group,
        isActive: !group.isActive,
        deactivatedAt: !group.isActive ? undefined : new Date(),
      }

      setGroup(updatedGroup)
      setShowActivateInfoModal(false)
    } catch (error) {
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        alert(error instanceof Error ? error.message : '그룹 상태 변경 중 오류가 발생했습니다.');
      }
    }
  }

  const handleLeaveGroup = async () => {
    if (!group) return

    try {
      const token = await getValidToken();
      
      // 방장인 경우 그룹 폭파, 아닌 경우 그룹 나가기
      if (group.isOwner) {
        // 정산 진행 중이면 폭파 불가
        if (group.settlementStatus === "IN_PROGRESS") {
          alert('정산 진행 중에는 그룹을 폭파할 수 없습니다.');
          return;
        }
        // COMPLETE 상태면 모든 멤버 송금 완료 여부 체크
        if (group.settlementStatus === "COMPLETE") {
          const allSettled = Array.isArray(group.members) && 
            group.members.every(member => member.userId === group.host.id || member.hasTransferred);
          if (!allSettled) {
            alert('모든 멤버의 정산이 완료되어야 그룹을 폭파할 수 있습니다.');
            return;
          }
        }
        // BEFORE, COMPLETE(모든 송금 완료)만 삭제 허용
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: "include"
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '그룹 폭파에 실패했습니다.');
        }
      } else {
        // 일반 멤버의 그룹 나가기
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/leave`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: "include"
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '그룹 나가기에 실패했습니다.');
        }
      }

      router.push("/settlement")
    } catch (error) {
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        alert(error instanceof Error ? error.message : (group.isOwner ? '그룹 폭파 중 오류가 발생했습니다.' : '그룹 나가기 중 오류가 발생했습니다.'));
      }
    }
  }

  const handleStartSettlement = async () => {
    if (!group || !group.isOwner) return;

    if (!Array.isArray(group.members) || group.members.length <= 1) {
      setShowInviteGuideModal(true);
      return;
    }

    try {
      const token = await getValidToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '정산 시작에 실패했습니다.');
      }

      const result = await response.json();
      if (!result.result) {
        throw new Error('Invalid response format');
      }

      const updatedGroup = {
        ...group,
        isSettling: true,
        isActive: false,
        selectedMembers: result.result.selectedMembers,
      }

      setGroup(updatedGroup)
      setSelectedMembers(result.result.selectedMembers)
      setSettlementAmount(result.result.settlementAmount)
      setShowSettlementModal(true)
    } catch (error) {
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        alert(error instanceof Error ? error.message : '정산 시작 중 오류가 발생했습니다.');
      }
    }
  }

  const handleCancelSettlement = async () => {
    if (!group || !group.isOwner) return

    try {
      const token = await getValidToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '정산 취소에 실패했습니다.');
      }

      const updatedGroup = {
        ...group,
        isSettling: false,
        isActive: true,
        selectedMembers: [],
        members: group.members.map((member) => ({
          ...member,
          hasTransferred: false,
        })),
      }

      setGroup(updatedGroup)
      setShowSettlementModal(false)
    } catch (error) {
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        alert(error instanceof Error ? error.message : '정산 취소 중 오류가 발생했습니다.');
      }
    }
  }

  const handleSettlePayment = async () => {
    if (!group || group.isOwner) return

    try {
      const token = await getValidToken();
      setIsTransactionsLoading(true);
      setTransactionsError(null);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setTransactionsError(errorData.message || '정산 송금에 실패했습니다.');
        setIsTransactionsLoading(false);
        throw new Error(errorData.message || '정산 송금에 실패했습니다.');
      }

      // 거래 내역 새로고침
      const transactionsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/transactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        }
      );

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        if (transactionsData.result) {
          setGroup(prev => prev ? {
            ...prev,
            transactions: transactionsData.result
          } : null);
        }
      } else {
        const errorData = await transactionsResponse.json();
        setTransactionsError(errorData.message || '거래 내역을 불러오지 못했습니다.');
      }

      // 공유 거래 내역 새로고침 (방장인 경우)
      if (group.isOwner) {
        setIsSharedTxLoading(true);
        setSharedTxError(null);

        getValidToken().then(token => {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/shared-transactions`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"
          })
            .then(res => res.json())
            .then(data => {
              setSharedTransactions(data.result || []);
              setIsSharedTxLoading(false);
            })
            .catch(() => {
              setSharedTxError("공유 거래 내역을 불러오지 못했습니다.");
              setIsSharedTxLoading(false);
            });
        });
      }

      // Check if all members have settled
      const allSettled = group.members.every((member) => member.userId === group.host.id || member.hasTransferred)

      setIsTransactionsLoading(false);

      if (allSettled) {
        alert("정산이 완료되었습니다!")
      } else {
        alert("송금이 완료되었습니다!")
      }
    } catch (error) {
      setIsTransactionsLoading(false);
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        setTransactionsError(error instanceof Error ? error.message : '정산 송금 중 오류가 발생했습니다.');
        alert(error instanceof Error ? error.message : '정산 송금 중 오류가 발생했습니다.');
      }
    }
  }

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId)
      } else {
        return [...prev, memberId]
      }
    })
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

  // 멤버 리스트(방장 포함) 생성
  let memberList: MemberListItem[] = [];
  if (group && group.host) {
    // host
    memberList.push({
      id: group.host.id,
      name: group.host.name,
      profileImage: group.host.profileImage,
      isHost: true,
      hasTransferred: false,
      color: "bg-blue-500",
    });
    // members (host와 중복 제거)
    if (Array.isArray(group.members)) {
      memberList = memberList.concat(
        group.members
          .filter((member) => member.userId !== group.host.id)
          .map((member) => ({
            id: member.userId,
            name: member.name,
            profileImage: member.profileImage,
            isHost: false,
            hasTransferred: member.hasTransferred,
            color: "bg-gray-400",
          }))
      );
    }
    // 본인이 host도 아니고 members에도 없으면 members에 추가
    const myId = Number(localStorage.getItem('userId'));
    const alreadyInList = memberList.some((m) => m.id === myId);
    if (!alreadyInList && group.members && group.members.some((m) => m.userId === myId)) {
      const me = group.members.find((m) => m.userId === myId);
      if (me) {
        memberList.push({
          id: me.userId,
          name: me.name,
          profileImage: me.profileImage,
          isHost: false,
          hasTransferred: me.hasTransferred,
          color: "bg-gray-400",
        });
      }
    }
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
        <Link href="/settlement" className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">{group.name}</h1>
        <button onClick={() => setShowInviteModal(true)} className="text-blue-500 cursor-pointer">
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
                    : group.settlementStatus === "IN_PROGRESS"
                      ? "정산 진행 중입니다."
                      : "비활성화되어 있습니다."}
                </p>
              </div>
            </div>
            {group.isOwner && group.settlementStatus !== "IN_PROGRESS" && (
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
            멤버 {memberList.length}/{group.maxMembers}
          </h2>
          <div className="space-y-4">
            {memberList.map((member) => (
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
                      {member.isHost && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">대표</span>
                      )}
                    </div>
                    {group.isSettling && !member.isHost && (
                      <p className="text-sm text-gray-500">{member.hasTransferred ? "정산 완료" : "정산 대기중"}</p>
                    )}
                  </div>
                </div>
                {group.isSettling && member.hasTransferred && !member.isHost && (
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
              className="mt-4 w-full rounded-lg border border-blue-500 py-2 text-center text-blue-500 cursor-pointer"
            >
              멤버 초대하기
            </button>
          )}
        </div>

        {/* Shared Wallet Transactions Section */}
        {group && (
          <div className="border-b border-gray-200 p-4">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setShowTransactionHistory(!showTransactionHistory)}
            >
              <h2 className="text-lg font-medium">방장의 공유 지갑 거래 내역</h2>
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
            {/* 안내 메시지 */}
            {group.settlementStatus === "IN_PROGRESS" ? (
              <p className="mt-2 text-sm text-orange-600">
                ⚠️ 정산 진행 중에는 새로운 거래 내역이 공유되지 않습니다.<br />
                정산 시작 전까지의 거래 내역만 공유됩니다.
              </p>
            ) : !group.isActive ? (
              <p className="mt-2 text-sm text-orange-600">
                ⚠️ 그룹이 비활성화 상태입니다. 비활성화 이후의 거래 내역은 공유되지 않습니다.<br />
                비활성화 전까지의 거래 내역만 공유됩니다.
              </p>
            ) : (
              <p className="mt-2 text-sm text-blue-600">
                실시간으로 거래 내역이 공유되고 있습니다.
              </p>
            )}
            {isSharedTxLoading && <div className="text-blue-500 py-4">로딩 중...</div>}
            {sharedTxError && <div className="text-red-500 py-4">{sharedTxError}</div>}
            {showTransactionHistory && (
              <div className="mt-4 space-y-3">
                {sharedTransactions.length > 0 ? (
                  sharedTransactions.map((transaction) => (
                    <div key={transaction.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {transaction.type === "SETTLEMENT_SEND" ? "송금" : "입금"} 거래
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p className={`font-bold ${transaction.type === "SETTLEMENT_SEND" ? "text-red-600" : "text-blue-600"}`}>
                          {transaction.type === "SETTLEMENT_SEND" ? "-" : "+"}
                          {getCurrencySymbol(group.currencyCode)} {transaction.amount.toLocaleString()}
                        </p>
                      </div>
                      {transaction.description && (
                        <p className="mt-1 text-sm text-gray-500">{transaction.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    공유된 거래 내역이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Send Money Button Section */}
        {!group.isOwner &&
          group.isSettling &&
          !group.selectedMembers?.includes(
            (() => { const id = Array.isArray(group.members) ? group.members.find((m) => m.userId !== group.host.id && m.name === "이월렛")?.userId : -1; return typeof id === "number" ? id : -1; })()
          ) && (
            <div className="border-b border-gray-200 p-4">
              <button
                onClick={() => {
                  // 방장의 지갑 번호 생성 (실제로는 DB에서 가져와야 함)
                  const ownerWalletNumber = `9791-${group.currencyCode.charCodeAt(0)}${group.currencyCode.charCodeAt(1)}-${
                    group.currencyCode.length > 2 ? group.currencyCode.charCodeAt(2) : "00"
                  }1000-4618`

                  // 방장 이름 (첫 번째 멤버 중 isHost가 true인 멤버)
                  const ownerName = Array.isArray(group.members) ? group.members.find((m) => m.userId === group.host.id)?.name || "방장" : "방장"

                  // URL 파라미터 인코딩 및 전달 방식 개선
                  router.push(
                    `/wallet/transfer?currency=${encodeURIComponent(group.currencyCode)}&walletNumber=${encodeURIComponent(ownerWalletNumber)}&recipientName=${encodeURIComponent(ownerName)}&skipFirstStep=true`,
                  )
                }}
                className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md cursor-pointer"
              >
                방장에게 송금하기
              </button>
            </div>
          )}

        {!group.isOwner &&
          !group.isActive &&
          group.isSettling &&
          group.selectedMembers?.includes(
            (() => { const id = Array.isArray(group.members) ? group.members.find((m) => m.userId !== group.host.id && m.name === "이월렛")?.userId : -1; return typeof id === "number" ? id : -1; })()
          ) && (
            <div className="border-b border-gray-200 p-4">
              <button
                onClick={handleSettlePayment}
                className="w-full rounded-lg bg-gradient-to-b from-[#FF4D4D] to-[#FF3B3B] py-3 text-center font-medium text-white shadow-md cursor-pointer"
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
                {group.transactions.map((transaction, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          From: {transaction.fromUserId} → To: {transaction.toUserId}
                        </p>
                        <p className="text-sm text-gray-500">
                          인원: {transaction.maxMembers}, 1인당: {transaction.dividedAmount.toLocaleString()}
                        </p>
                      </div>
                      <p className={`font-bold ${transaction.isTransferred ? 'text-green-600' : 'text-gray-800'}`}> 
                        {transaction.amount.toLocaleString()} {getCurrencySymbol(group.currencyCode)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">송금 여부: {transaction.isTransferred ? '완료' : '대기'}</p>
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
        {group.settlementStatus === "IN_PROGRESS" ? (
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
                  {getCurrencySymbol(group.currencyCode)} {settlementAmount.toLocaleString()}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-blue-600">정산 완료</span>
                <span className="font-bold text-blue-700">
                  {Array.isArray(group.members) ? group.members.filter((m) => m.userId === group.host.id || m.hasTransferred).length : 0}
                  /
                  {Array.isArray(group.members) ? group.members.length : 0}
                </span>
              </div>

              {group.isOwner ? (
                <button
                  onClick={handleCancelSettlement}
                  className="w-full rounded-lg bg-white py-2 text-center font-medium text-red-500 cursor-pointer"
                >
                  정산 취소하기
                </button>
              ) : (
                group.selectedMembers?.includes(
                  (() => { const id = Array.isArray(group.members) ? group.members.find((m) => m.userId !== group.host.id && m.name === "이월렛")?.userId : -1; return typeof id === "number" ? id : -1; })()
                ) && (
                  <button
                    onClick={handleSettlePayment}
                    disabled={!hasWallet}
                    className={`w-full rounded-lg py-2 text-center font-medium text-white ${
                      hasWallet ? "bg-gradient-to-b from-[#FF4D4D] to-[#FF3B3B]" : "bg-gray-300"
                    } cursor-pointer`}
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
                className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md cursor-pointer"
              >
                정산 시작하기
              </button>
            </div>
          )
        )}

        {/* Leave Group Button */}
        <div className="mt-auto p-4">
          <button
            onClick={() => {
              if (
                group.settlementStatus === "IN_PROGRESS"
              ) {
                alert(
                  group.isOwner
                    ? "정산 진행 중에는 그룹을 폭파할 수 없습니다."
                    : "정산 진행 중에는 그룹을 나갈 수 없습니다."
                );
                return;
              }
              setShowLeaveModal(true);
            }}
            className={`w-full rounded-lg border border-red-500 py-2 text-center font-medium text-red-500 cursor-pointer ${
              group.settlementStatus === "IN_PROGRESS" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={group.settlementStatus === "IN_PROGRESS"}
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
              className="fixed inset-0 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" style={getCenterModalStyle()}>
                <h2 className="mb-4 text-xl font-bold">멤버 초대</h2>
                {group.inviteCode ? (
                  <>
                    <div className="mb-6">
                      <label className="mb-2 block text-sm font-medium text-gray-700">초대 코드</label>
                      <div className="flex items-center">
                        <div className="flex-1 rounded-l-lg border border-gray-300 bg-gray-50 p-3 font-mono">
                          {group.inviteCode}
                        </div>
                        <button onClick={handleCopyInviteCode} className="rounded-r-lg bg-blue-500 p-3 text-white cursor-pointer">
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
                        className="mb-4 flex w-full items-center justify-center rounded-lg border border-blue-500 py-2 text-center font-medium text-blue-500 cursor-pointer"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        초대 코드 재발급
                      </button>
                    )}
                  </>
                ) : (
                  <div className="mb-6 flex flex-col items-center rounded-lg bg-yellow-50 p-4 text-yellow-700">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="mb-3 text-base font-medium">초대 코드가 만료되었습니다.</p>
                    {group.isOwner ? (
                      <button
                        onClick={handleRegenerateInviteCode}
                        className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-2 text-center font-medium text-white shadow-md"
                      >
                        초대 코드 재발급
                      </button>
                    ) : (
                      <p className="text-sm text-yellow-700">방장에게 재발급을 요청하세요.</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="mt-4 w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
                >
                  닫기
                </button>
              </div>
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
                {group.settlementStatus === "IN_PROGRESS" ? (
                  <p className="mb-6 text-gray-600">
                    정산 진행 중에는 {group.isOwner ? "그룹을 폭파할 수 없습니다." : "그룹을 나갈 수 없습니다."}
                  </p>
                ) : (
                  <p className="mb-6 text-gray-600">
                    {group.isOwner
                      ? "그룹을 폭파하면 모든 멤버가 그룹에서 제외되고 그룹 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                      : "그룹을 나가면 더 이상 그룹 정보를 볼 수 없습니다. 계속하시겠습니까?"}
                  </p>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleLeaveGroup}
                    className="flex-1 rounded-lg bg-red-500 py-3 text-center font-medium text-white cursor-pointer"
                    disabled={group.settlementStatus === "IN_PROGRESS"}
                  >
                    {group.isOwner ? "폭파하기" : "나가기"}
                  </button>
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
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
                {Array.isArray(group.members) && group.members.map((member) => (
                  <div
                    key={member.userId}
                    className="mb-2 flex items-center justify-between rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-center">
                      <div
                        className={`relative mr-3 h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-medium`}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <p className="font-medium">{member.name}</p>
                    </div>
                    <div
                      onClick={() => toggleMemberSelection(Number(member.userId))}
                      className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border ${
                        selectedMembers.includes(Number(member.userId))
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selectedMembers.includes(Number(member.userId)) && <Check size={14} />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMemberSelectModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
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
                      {getCurrencySymbol(group.currencyCode)}{" "}
                      {group.transactions
                        ? group.transactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()
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
                      {getCurrencySymbol(group.currencyCode)} {settlementAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="mb-6 text-sm text-gray-600">
                  정산을 시작하면 그룹이 비활성화되고, 모든 멤버가 정산을 완료할 때까지 비활성화 상태가 유지됩니다.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSettlementModal(false)}
                    className="flex-1 rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white cursor-pointer"
                  >
                    확인
                  </button>
                  <button
                    onClick={handleCancelSettlement}
                    className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
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
                    onClick={handleToggleActive}
                    className="flex-1 rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white cursor-pointer"
                  >
                    확인
                  </button>
                  <button
                    onClick={() => setShowActivateInfoModal(false)}
                    className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Invite Guide Modal */}
      {showInviteGuideModal && (
        <ModalPortal>
          {renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={getModalBackgroundStyle()}
            onClick={() => setShowInviteGuideModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={getCenterModalStyle()}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-xl font-bold text-blue-600">멤버를 더 초대하세요</h2>
                <p className="mb-6 text-gray-600">
                  정산을 시작하려면 최소 2명 이상의 멤버가 필요합니다.<br />
                  멤버를 초대해 그룹을 완성하세요.
                </p>
                <button
                  onClick={() => {
                    setShowInviteGuideModal(false);
                    setShowInviteModal(true);
                  }}
                  className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white cursor-pointer"
                >
                  멤버 초대하기
                </button>
                <button
                  onClick={() => setShowInviteGuideModal(false)}
                  className="mt-3 w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Transaction Loading Indicator */}
      {isTransactionsLoading && (
        <div className="p-4 text-center text-blue-500">거래 내역을 불러오는 중...</div>
      )}

      {/* Transaction Error Message */}
      {transactionsError && (
        <div className="p-4 text-center text-red-500">{transactionsError}</div>
      )}
    </div>
  )
}