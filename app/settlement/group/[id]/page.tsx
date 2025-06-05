"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, Share2, Clock, Copy, RefreshCw, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import ModalPortal from "@/components/modal-portal"
import { getValidToken } from "@/lib/auth"

// 타입 정의
type Wallet = {
  id: number;
  walletNumber: string;
  balance: number;
  currency: string;
  ownerName: string;
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
  id: number;
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
  myMemberId?: number | null;
  selectedMemberIds?: number[];
  sharePeriods?: { startedAt: string; stoppedAt: string }[];
  // 정산 시작 시점의 고정된 멤버 수 추가
  settlementMemberCount?: number;
}

type SettlementTransaction = {
  fromUserId: number;
  toUserId: number;
  amount: number;
  isTransferred: boolean;
  maxMembers: number;
  dividedAmount: number;
  type?: string;
}

type Payment = {
  id: number;
  date: string;
  fromMemberId: number;
  fromMemberName: string;
  amount: number;
  currency: string;
}

interface MemberListItem {
  id: number;
  name: string;
  profileImage: string;
  isHost: boolean;
  hasTransferred: boolean;
  color: string;
}

type SharedTransaction = {
  id: number;
  walletNumber: string;
  counterWalletNumber: string;
  currencyCode: string;
  type: string;
  status: string;
  amount: number;
  transactedAt: string;
  external: boolean;
};

// 모달 스타일 훅
const useModalStyles = () => {
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
  );

  const getModalBackgroundStyle = () => ({
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(2px)",
    animation: "fadeIn 0.3s ease-out",
  });

  const getBottomSheetStyle = (): React.CSSProperties => ({
    animation: "slideUp 0.3s ease-out",
    maxHeight: "90vh",
    overflowY: "auto" as const,
  });

  const getCenterModalStyle = () => ({
    animation: "scaleIn 0.3s ease-out",
  });

  return {
    renderModalStyles,
    getModalBackgroundStyle,
    getBottomSheetStyle,
    getCenterModalStyle,
  };
};

// API 호출 훅
const useGroupAPI = (groupId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGroupData = useCallback(async () => {
    if (!groupId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = await getValidToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}?t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch group data');
      }

      const data = await response.json();
      return data.result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const refreshTransactions = useCallback(async () => {
    if (!groupId) return null;
    
    try {
      const token = await getValidToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/transactions?t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      return data.result;
    } catch (err) {
      console.error('Failed to refresh transactions:', err);
      return null;
    }
  }, [groupId]);

  return {
    refreshGroupData,
    refreshTransactions,
    isLoading,
    error,
  };
};

export default function SettlementGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const modalStyles = useModalStyles();
  const groupAPI = useGroupAPI(groupId);

  // State 관리
  const [group, setGroup] = useState<SettlementGroup | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showInviteGuideModal, setShowInviteGuideModal] = useState(false);
  const [sharedTransactions, setSharedTransactions] = useState<SharedTransaction[]>([]);
  const [isSharedTxLoading, setIsSharedTxLoading] = useState(false);
  const [sharedTxError, setSharedTxError] = useState<string | null>(null);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferSuccessModal, setShowTransferSuccessModal] = useState(false);
  const [showFinalResetModal, setShowFinalResetModal] = useState(false);

  // 정산 정보 상태 (백엔드 API에서 가져온 값 사용)
  const [settlementData, setSettlementData] = useState<{
    totalAmount: number;
    memberCount: number;
    perAmount: number;
  } | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await getValidToken();
        const searchParams = new URLSearchParams(window.location.search);
        const allowIfJoinCodeValid = searchParams.get('allowIfJoinCodeValid') === 'true';
        
        const groupResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}?allowIfJoinCodeValid=${allowIfJoinCodeValid}`,
          {
            headers: { Authorization: `Bearer ${token}` },
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
        setGroup(groupData.result);

        // 지갑 확인
        const walletResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/all`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          setHasWallet(walletData.result.length > 0);
        }

      } catch (error) {
        if (error instanceof Error && error.message === "No token found") {
          router.push("/login");
        } else {
          alert('데이터를 불러오는 중 오류가 발생했습니다.');
          router.push("/settlement");
        }
      }
    };

    fetchInitialData();
  }, [groupId, router]);

  // 정산 데이터 가져오기 (백엔드에서 계산된 값)
  useEffect(() => {
    const fetchSettlementData = async () => {
      if (!group?.id) return;
      
      try {
        const token = await getValidToken();
        
        // 정산 거래 내역 API에서 계산된 값 가져오기
        const transactionsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/transactions`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"
          }
        );

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          const transactions = transactionsData.result || [];
          
          if (transactions.length > 0) {
            // 백엔드에서 계산된 값 사용
            const firstTransaction = transactions[0];
            setSettlementData({
              totalAmount: firstTransaction.amount || 0,
              memberCount: firstTransaction.maxMembers || 0,
              perAmount: firstTransaction.dividedAmount || 0,
            });
          }
          
          // 거래 내역도 그룹에 저장
          setGroup(prev => prev ? { ...prev, transactions } : null);
        }
      } catch (error) {
        console.error('Failed to fetch settlement data:', error);
      }
    };

    fetchSettlementData();
  }, [groupId, group?.id, group?.settlementStatus]);

  // 공유 거래 내역 조회
  useEffect(() => {
    const fetchSharedTransactions = async () => {
      if (!group?.id) return;
      setIsSharedTxLoading(true);
      setSharedTxError(null);
      try {
        const token = await getValidToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/shared-transactions`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSharedTransactions(data.result || []);
        } else {
          setSharedTxError('공유 거래 내역을 불러오지 못했습니다.');
        }
      } catch {
        setSharedTxError('공유 거래 내역을 불러오지 못했습니다.');
      } finally {
        setIsSharedTxLoading(false);
      }
    };
    fetchSharedTransactions();
  }, [groupId, group?.id, group?.isSettling]);

  // 초대 코드 타이머
  useEffect(() => {
    if (!group?.inviteExpiry) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const expiryDate = new Date(group.inviteExpiry!);

      if (now > expiryDate) {
        setTimeLeft("만료됨");
        return;
      }

      const diffMs = expiryDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      setTimeLeft(`${diffMins}:${diffSecs.toString().padStart(2, "0")}`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [group?.inviteExpiry]);

  // 핸들러 함수들
  const handleCopyInviteCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleStartSettlement = async () => {
    if (!group?.isOwner) return;
    
    const memberList = getMemberList();
    if (memberList.length < 2) {
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
      
      // 정산 시작 시 백엔드에서 받은 정확한 값 저장
      setSettlementData({
        totalAmount: Number(result.result.totalAmount),
        memberCount: result.result.selectedMembers,
        perAmount: Number(result.result.perAmount),
      });

      // 그룹 상태 업데이트
      const updatedGroup = {
        ...group,
        isSettling: true,
        isActive: false,
        settlementStatus: "IN_PROGRESS",
        members: group.members.map((member) => ({
          ...member,
          hasTransferred: false,
        })),
      };
      setGroup(updatedGroup);
      setShowSettlementModal(true);

    } catch (error) {
      alert(error instanceof Error ? error.message : '정산 시작 중 오류가 발생했습니다.');
    }
  };

  const handleTransferToHost = async () => {
    setIsTransferLoading(true);
    try {
      const token = await getValidToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/transfer`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || '송금에 실패했습니다.');
        return;
      }

      const result = await response.json();
      const isAllDone = result.result === true;

      if (isAllDone) {
        setShowTransferSuccessModal(true);
        // 송금 완료 모달 닫힌 후에 최종 안내 모달을 띄우기 위해 콜백 추가
        // 아래 showTransferSuccessModal의 확인 버튼에서 setShowFinalResetModal(true)로 연결
      } else {
        setShowTransferSuccessModal(true);
        // 데이터 새로고침 - 백엔드에서 최신 정산 데이터 가져오기
        setTimeout(async () => {
          try {
            const updatedGroup = await groupAPI.refreshGroupData();
            const updatedTransactions = await groupAPI.refreshTransactions();
            if (updatedGroup) {
              setGroup(prev => ({ ...prev, ...updatedGroup }));
            }
            if (updatedTransactions && updatedTransactions.length > 0) {
              const firstTransaction = updatedTransactions[0];
              setSettlementData({
                totalAmount: firstTransaction.amount || 0,
                memberCount: firstTransaction.maxMembers || 0,
                perAmount: firstTransaction.dividedAmount || 0,
              });
              setGroup(prev => prev ? { ...prev, transactions: updatedTransactions } : null);
            }
          } catch (error) {
            console.error('Failed to refresh data:', error);
            window.location.reload();
          }
        }, 1000);
      }
    } catch {
      alert('송금 중 오류가 발생했습니다.');
    } finally {
      setIsTransferLoading(false);
    }
  };

  const getMemberList = (): MemberListItem[] => {
    if (!group?.host) return [];

    const memberList: MemberListItem[] = [];
    
    // 방장 추가
    memberList.push({
      id: group.host.id,
      name: group.host.name,
      profileImage: group.host.profileImage,
      isHost: true,
      hasTransferred: false,
      color: "bg-blue-500",
    });

    // 멤버들 추가 (방장 제외)
    if (Array.isArray(group.members)) {
      memberList.push(...group.members
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

    return memberList;
  };

  // 계산된 값들 (백엔드 API에서 가져온 값 사용)
  const memberList = getMemberList();

  // 백엔드에서 가져온 정산 데이터 사용, fallback으로 settlementInfo 사용
  const displaySettlementData = settlementData;

  // --- 핸들러 함수들 추가 ---
  const handleReissueInviteCode = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/reissue-code`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setGroup(prev => prev ? { ...prev, inviteCode: data.result.newJoinCode, inviteExpiry: data.result.expiredAt } : prev);
        setTimeLeft(''); // 타이머 갱신
      } else {
        alert('초대 코드 재발급에 실패했습니다.');
      }
    } catch {
      alert('초대 코드 재발급 중 오류가 발생했습니다.');
    }
  };

  const doCancelSettlement = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/cancel`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include'
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert('정산 취소에 실패했습니다.');
      }
    } catch {
      alert('정산 취소 중 오류가 발생했습니다.');
    }
  };

  const doDeleteGroup = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include'
      });
      if (response.ok) {
        router.push('/settlement');
      } else {
        alert('그룹 삭제에 실패했습니다.');
      }
    } catch {
      alert('그룹 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('정말 그룹을 나가시겠습니까?')) return;
    try {
      const token = await getValidToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/leave`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include'
      });
      if (response.ok) {
        router.push('/settlement');
      } else {
        alert('그룹 나가기에 실패했습니다.');
      }
    } catch {
      alert('그룹 나가기 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async () => {
    try {
      const token = await getValidToken();
      const url = group && group.isActive
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/deactivate`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}/activate`;
      const response = await fetch(url, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include'
      });
      if (response.ok) {
        setGroup(prev => prev ? { ...prev, isActive: !prev.isActive } : prev);
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch {
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
        <p className="mt-4 text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4 shadow-sm">
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
        <div className="rounded-xl bg-white shadow p-4 flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-blue-700">정산 그룹 활성화</p>
            <p className="text-sm text-gray-500">{group.isActive ? "활성화되어 있습니다." : "비활성화되어 있습니다."}</p>
          </div>
          {group.isOwner && (
            <button
              onClick={handleToggleActive}
              className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 ${group.isActive ? 'bg-[#0DAEFF]' : 'bg-gray-300'}`}
              disabled={group.settlementStatus === 'IN_PROGRESS'}
              style={group.settlementStatus === 'IN_PROGRESS' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${group.isActive ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          )}
        </div>

        {/* Members Section */}
        <div className="rounded-xl bg-white shadow p-4 mb-4">
          <h2 className="mb-2 text-lg font-medium text-blue-700">멤버 {memberList.length}/{group.maxMembers}</h2>
          <div className="space-y-4">
            {memberList.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`relative mr-3 h-10 w-10 rounded-full ${member.color} flex items-center justify-center text-white font-medium`}>
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
        </div>

        {/* Shared Wallet Transactions Section */}
        <div className="rounded-xl bg-white shadow p-4 mb-4">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowTransactionHistory(!showTransactionHistory)}>
            <h2 className="text-lg font-medium text-blue-700">방장의 공유 거래 내역</h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showTransactionHistory ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {showTransactionHistory && (
            <div className="mt-4 space-y-3">
              {/* 정산 정보 표시 */}
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-8">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">총 정산 금액: </span>
                  <span className="font-bold text-blue-700">
                    {displaySettlementData?.totalAmount?.toLocaleString() || '0'} {group.currencyCode}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1 md:mt-0">
                  <span className="font-medium">1인당 정산 금액: </span>
                  <span className="font-bold text-blue-700">
                    {displaySettlementData?.perAmount?.toLocaleString() || '0'} {group.currencyCode}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1 md:mt-0">
                  <span className="font-medium">정산 인원: </span>
                  <span className="font-bold text-blue-700">
                    {(displaySettlementData?.memberCount && displaySettlementData.memberCount > 0)
                      ? displaySettlementData.memberCount
                      : (group?.members?.length || 0) + 1}명
                  </span>
                </div>
              </div>
              
              {/* 거래내역 리스트 */}
              {isSharedTxLoading && <div className="text-blue-500 py-4">로딩 중...</div>}
              {sharedTxError && <div className="text-red-500 py-4">{sharedTxError}</div>}
              {!isSharedTxLoading && !sharedTxError && (
                sharedTransactions.length > 0 ? (
                  sharedTransactions.map((transaction) => (
                    <div key={transaction.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {transaction.type === "TRANSFER_OUT" ? "출금" : 
                             transaction.type === "TRANSFER_IN" ? "입금" : transaction.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.transactedAt).toLocaleString()}
                          </p>
                        </div>
                        <p className={`font-bold ${transaction.type === "TRANSFER_OUT" ? "text-red-600" : "text-blue-600"}`}>
                          {transaction.type === "TRANSFER_OUT" ? "-" : "+"}
                          {transaction.amount.toLocaleString()} {transaction.currencyCode}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">공유된 거래 내역이 없습니다.</div>
                )
              )}
            </div>
          )}
        </div>

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
              
              <div className="mb-6 rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 font-medium text-blue-700">정산 정보</h3>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-blue-600">총 정산 금액</span>
                  <span className="font-bold text-blue-700">
                    {displaySettlementData?.totalAmount?.toLocaleString() || '0'} {group.currencyCode}
                  </span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-blue-600">정산 인원</span>
                  <span className="font-bold text-blue-700">
                    {(displaySettlementData?.memberCount && displaySettlementData.memberCount > 0)
                      ? displaySettlementData.memberCount
                      : (group?.members?.length || 0) + 1}명
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600">1인당 정산 금액</span>
                  <span className="font-bold text-blue-700">
                    {displaySettlementData?.perAmount?.toLocaleString() || '0'} {group.currencyCode}
                  </span>
                </div>
              </div>

              {!group.isOwner && (
                <button
                  onClick={handleTransferToHost}
                  disabled={!hasWallet || isTransferLoading}
                  className={`w-full rounded-lg py-2 text-center font-medium text-white ${
                    hasWallet && !isTransferLoading ? "bg-gradient-to-b from-[#FF4D4D] to-[#FF3B3B]" : "bg-gray-300"
                  } cursor-pointer`}
                >
                  {isTransferLoading ? '송금 중...' : hasWallet ? "정산금 송금하기" : "지갑이 필요합니다"}
                </button>
              )}
            </div>
          </div>
        ) : (
          group.isOwner && (
            <div className="p-4">
              <button
                onClick={handleStartSettlement}
                className="w-full rounded-lg bg-gradient-to-b from-[#0DAEFF] to-[#3B9EFF] py-3 text-center font-medium text-white shadow-md cursor-pointer"
              >
                정산 시작하기
              </button>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <ModalPortal>
          {modalStyles.renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={modalStyles.getModalBackgroundStyle()}
            onClick={() => setShowInviteModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" style={modalStyles.getCenterModalStyle()}>
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
                  </>
                ) : (
                  <div className="mb-6 flex flex-col items-center rounded-lg bg-yellow-50 p-4 text-yellow-700">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="mb-3 text-base font-medium">초대 코드가 만료되었습니다.</p>
                    <button
                      onClick={handleReissueInviteCode}
                      className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-2 text-center font-medium text-white cursor-pointer mt-2"
                    >
                      초대 코드 재발급
                    </button>
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

      {showSettlementModal && (
        <ModalPortal>
          {modalStyles.renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={modalStyles.getModalBackgroundStyle()}
            onClick={() => setShowSettlementModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={modalStyles.getCenterModalStyle()}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-xl font-bold">정산 시작</h2>
                <div className="mb-6 rounded-lg bg-blue-50 p-4">
                  <h3 className="mb-2 font-medium text-blue-700">정산 정보</h3>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-blue-600">총 정산 금액</span>
                    <span className="font-bold text-blue-700">
                      {displaySettlementData?.totalAmount?.toLocaleString() || '0'} {group.currencyCode}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-blue-600">정산 인원</span>
                    <span className="font-bold text-blue-700">
                      {(displaySettlementData?.memberCount && displaySettlementData.memberCount > 0)
                        ? displaySettlementData.memberCount
                        : (group?.members?.length || 0) + 1}명
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600">1인당 정산 금액</span>
                    <span className="font-bold text-blue-700">
                      {displaySettlementData?.perAmount?.toLocaleString() || '0'} {group.currencyCode}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSettlementModal(false)}
                    className="flex-1 rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 text-center font-medium text-white cursor-pointer"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showInviteGuideModal && (
        <ModalPortal>
          {modalStyles.renderModalStyles()}
          <div
            className="fixed inset-0 z-50"
            style={modalStyles.getModalBackgroundStyle()}
            onClick={() => setShowInviteGuideModal(false)}
          >
            <div className="fixed inset-0 flex items-center justify-center">
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                style={modalStyles.getCenterModalStyle()}
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

      {showCancelModal && (
        <ModalPortal>
          {modalStyles.renderModalStyles()}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={modalStyles.getModalBackgroundStyle()}
            onClick={() => setShowCancelModal(false)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
              style={modalStyles.getCenterModalStyle()}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold text-red-600">정산 취소 안내</h2>
              <p className="mb-6 text-gray-700 text-base text-center">
                정산을 정말 취소하시겠습니까?<br />
                이미 정산금을 보낸 사람이 있다면, 해당 금액은 환불됩니다.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={() => { setShowCancelModal(false); doCancelSettlement(); }}
                  className="flex-1 rounded-lg bg-gradient-to-b from-[#FF4D4D] to-[#FF3B3B] py-3 text-center font-medium text-white cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showDeleteModal && (
        <ModalPortal>
          {modalStyles.renderModalStyles()}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={modalStyles.getModalBackgroundStyle()}
            onClick={() => setShowDeleteModal(false)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
              style={modalStyles.getCenterModalStyle()}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold text-red-600">그룹 삭제 안내</h2>
              <p className="mb-6 text-gray-700 text-base text-center">
                정말 그룹을 삭제하시겠습니까?<br />
                삭제하면 복구할 수 없습니다.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); doDeleteGroup(); }}
                  className="flex-1 rounded-lg bg-gradient-to-b from-[#FF4D4D] to-[#FF3B3B] py-3 text-center font-medium text-white cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showTransferSuccessModal && (
        <ModalPortal>
          {modalStyles.renderModalStyles()}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={modalStyles.getModalBackgroundStyle()}
            onClick={() => setShowTransferSuccessModal(false)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
              style={modalStyles.getCenterModalStyle()}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold text-blue-600">송금 완료</h2>
              <p className="mb-6 text-gray-700 text-base text-center">
                송금이 완료되었습니다.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowTransferSuccessModal(false);
                    // isAllDone이 true였던 경우에만 다음 모달로
                    if (group && group.transactions && group.transactions.length > 0) {
                      // 기존 송금 완료 후 새로고침 로직이 아니라, isAllDone true일 때만 다음 모달
                      setShowFinalResetModal(true);
                    }
                  }}
                  className="rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 px-8 text-center font-medium text-white cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showFinalResetModal && (
        <ModalPortal>
          {modalStyles.renderModalStyles()}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={modalStyles.getModalBackgroundStyle()}
            onClick={() => setShowFinalResetModal(false)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
              style={modalStyles.getCenterModalStyle()}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold text-blue-600">정산 완료</h2>
              <p className="mb-6 text-gray-700 text-base text-center">
                모든 멤버의 정산이 완료되어,<br />지금까지의 정산 내역이 초기화 됩니다.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    setShowFinalResetModal(false);
                    // 그룹 삭제 API 호출
                    try {
                      const token = await getValidToken();
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups/${groupId}`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        credentials: 'include',
                      });
                    } catch {}
                    router.push('/settlement');
                  }}
                  className="rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-3 px-8 text-center font-medium text-white cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 메인 컨텐츠 마지막에 버튼 배치 */}
      <div className="mt-8 mb-6 flex flex-col space-y-2">
        {group.isOwner && group.settlementStatus === 'IN_PROGRESS' && (
          <button
            className="w-[95%] mx-auto rounded-lg bg-gradient-to-b from-[#FF4D4D] to-[#FF3B3B] py-3 text-center font-medium text-white shadow-md cursor-pointer"
            onClick={() => setShowCancelModal(true)}
          >
            정산 취소
          </button>
        )}
        {group.isOwner && (
          <button
            className="w-[95%] mx-auto rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 shadow-md cursor-pointer"
            onClick={() => setShowDeleteModal(true)}
          >
            그룹 삭제
          </button>
        )}
        {!group.isOwner && (
          <button className="w-[95%] mx-auto rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 shadow-md cursor-pointer" onClick={handleLeaveGroup}>
            그룹 나가기
          </button>
        )}
      </div>
    </div>
  );
}