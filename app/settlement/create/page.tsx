"use client" // 이 파일이 클라이언트 측에서 렌더링됨을 나타냅니다.

import type React from "react" // React 타입 임포트

import { useState, useEffect } from "react" // React 훅 임포트
import { ChevronLeft, Check, AlertCircle } from "lucide-react" // 아이콘 임포트
import Link from "next/link" // Next.js Link 컴포넌트 임포트
import { useRouter } from "next/navigation" // Next.js 라우터 훅 임포트
import { getValidToken } from "@/lib/auth" // 인증 토큰 유효성 검사 함수 임포트
import ModalPortal from "@/components/modal-portal" // 모달 포털 컴포넌트 임포트

// 지갑 잔액의 타입을 정의합니다.
type WalletBalance = {
  id: number; // 지갑 ID
  country: string; // 국가
  code: string; // 통화 코드 (예: KRW, USD)
  flagSrc: string; // 국기 이미지 소스 경로
  amount: number; // 잔액
}

// 정산 그룹 생성 요청 DTO (Data Transfer Object)의 타입을 정의합니다.
type CreateSettlementGroupRequestDto = {
  groupName: string; // 그룹 이름
  walletId: number; // 선택된 지갑 ID
  maxMembers: number; // 최대 멤버 수
}

// 정산 그룹 생성 응답 DTO의 타입을 정의합니다.
type CreateSettlementGroupResponseDto = {
  groupId: number; // 생성된 그룹 ID
  groupName: string; // 생성된 그룹 이름
  joinCode: string; // 그룹 참여 코드
  maxMembers: number; // 최대 멤버 수
}

// 로컬 스토리지에서 읽어올 지갑 데이터의 원시 타입 (walletId 또는 id 중 하나가 있을 수 있음)
type RawWallet = {
  walletId?: number; // 지갑 ID (선택적)
  id?: number; // 지갑 ID (선택적)
  country: string; // 국가
  code: string; // 통화 코드
  flagSrc: string; // 국기 이미지 소스 경로
  amount: number; // 잔액
};

// 통화 코드에 맞는 국기 이미지 파일명을 반환하는 함수
function mapCurrencyToFlag(code: string): string {
  const map: Record<string, string> = {
    KRW: "korea.png",
    USD: "usa.png",
    JPY: "japan.png",
    EUR: "european-union.png",
    VND: "vietnam.png",
    CNY: "china.png",
    INR: "india.png",
  };
  return map[code] || "korea.png";
}

// 정산 그룹 생성 페이지 컴포넌트 정의
export default function CreateSettlementGroupPage() {
  const router = useRouter() // Next.js 라우터 인스턴스 가져오기

  // 상태 변수 정의
  const [groupName, setGroupName] = useState("") // 그룹 이름 상태
  const [selectedWallet, setSelectedWallet] = useState<WalletBalance | null>(null) // 선택된 지갑 상태
  const [maxMembers, setMaxMembers] = useState(5) // 최대 멤버 수 상태 (기본값 5)
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]) // 사용자의 지갑 잔액 목록 상태
  const [showWalletSelector, setShowWalletSelector] = useState(false) // 지갑 선택 모달 표시 여부 상태
  const [nameError, setNameError] = useState("") // 그룹 이름 유효성 검사 오류 메시지 상태

  // 컴포넌트 마운트 시 실행되는 useEffect 훅
  useEffect(() => {
    // 사용자가 로그인했는지 확인
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (!isLoggedIn) {
      router.push("/") // 로그인하지 않았다면 홈 페이지로 리다이렉트
      return
    }

    // 로컬 스토리지에서 지갑 잔액 정보를 가져옴
    const storedBalances = localStorage.getItem("walletBalances")
    if (storedBalances) {
      // JSON 문자열을 파싱하여 RawWallet 배열로 변환
      const parsedBalancesRaw: RawWallet[] = JSON.parse(storedBalances)
      // RawWallet을 WalletBalance 타입으로 매핑 (id 또는 walletId를 id로 통합)
      const parsedBalances = parsedBalancesRaw.map(wallet => ({
        id: wallet.walletId ?? wallet.id ?? 0, // walletId 또는 id 중 존재하는 값을 사용하고, 둘 다 없으면 0으로 기본값 설정
        country: wallet.country,
        code: wallet.code,
        flagSrc: `/images/flags/${mapCurrencyToFlag(wallet.code)}`,
        amount: wallet.amount,
      }))
      setWalletBalances(parsedBalances) // 파싱된 지갑 잔액을 상태에 설정

      // 지갑이 하나도 없으면 알림을 띄우고 지갑 충전 페이지로 리다이렉트
      if (parsedBalances.length === 0) {
        alert("지갑이 없어 정산 그룹을 만들 수 없습니다. 먼저 지갑을 생성해주세요.")
        router.push("/wallet/charge")
      }
    } else {
      // 로컬 스토리지에 지갑 잔액이 없으면 알림을 띄우고 지갑 충전 페이지로 리다이렉트
      alert("지갑이 없어 정산 그룹을 만들 수 없습니다. 먼저 지갑을 생성해주세요.")
      router.push("/wallet/charge")
    }
  }, [router]) // router가 변경될 때마다 이 훅이 다시 실행되도록 의존성 배열에 추가

  // 그룹 이름 변경 핸들러
  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value // 입력된 값 가져오기
    setGroupName(value) // 그룹 이름 상태 업데이트
    // 그룹 이름 유효성 검사
    if (value.trim().length === 0) {
      setNameError("그룹 이름을 입력해주세요.") // 비어있으면 오류 메시지 설정
    } else if (value.length > 20) {
      setNameError("그룹 이름은 20자 이내로 입력해주세요.") // 20자 초과 시 오류 메시지 설정
    } else {
      setNameError("") // 유효하면 오류 메시지 제거
    }
  }

  // 최대 멤버 수 변경 핸들러
  const handleMaxMembersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) // 입력된 값을 숫자로 변환
    // 숫자가 유효하고 2에서 10 사이인지 확인
    if (!isNaN(value) && value >= 2 && value <= 10) {
      setMaxMembers(value) // 최대 멤버 수 상태 업데이트
    }
  }

  // 지갑 선택 핸들러 (API로 최신 지갑 정보 조회)
  const handleSelectWallet = async (wallet: WalletBalance) => {
    try {
      const token = await getValidToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet?currencyCode=${encodeURIComponent(wallet.code)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );
      if (!response.ok) {
        // 백엔드에서 내려주는 에러 메시지(예: WalletErrorCode의 message)를 표시
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "지갑 정보를 불러오지 못했습니다.");
        return;
      }
      const result = await response.json();
      if (!result.result) {
        alert("지갑 정보가 올바르지 않습니다.");
        return;
      }
      setSelectedWallet({
        id: result.result.walletId,
        country: wallet.country,
        code: wallet.code,
        flagSrc: `/images/flags/${mapCurrencyToFlag(wallet.code)}`,
        amount: Number(result.result.balance),
      });
      setShowWalletSelector(false);
    } catch {
      alert("지갑 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 그룹 생성 버튼 클릭 핸들러
  const handleCreateGroup = async () => {
    // 그룹 이름이 비어있으면 오류 메시지 설정 후 함수 종료
    if (!groupName.trim()) {
      setNameError("그룹 이름을 입력해주세요.")
      return
    }

    // 공유 지갑이 선택되지 않았거나 지갑 ID가 없으면 알림 후 함수 종료
    if (!selectedWallet || !selectedWallet.id) {
      alert("공유 지갑을 선택해주세요.")
      return
    }

    // 콘솔에 그룹 생성 요청 데이터 로깅
    console.log("그룹 생성 요청:", {
      groupName: groupName.trim(),
      walletId: selectedWallet.id,
      maxMembers: maxMembers
    });

    try {
      // 유효한 인증 토큰 가져오기
      const token = await getValidToken();
      
      // 요청 본문 생성
      const request: CreateSettlementGroupRequestDto = {
        groupName: groupName.trim(),
        walletId: selectedWallet.id,
        maxMembers: maxMembers
      };

      // API에 그룹 생성 요청 보내기
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settlement-groups`, {
        method: 'POST', // POST 요청
        headers: {
          'Content-Type': 'application/json', // JSON 형식
          Authorization: `Bearer ${token}`, // 인증 토큰 포함
        },
        credentials: "include", // 쿠키 포함
        body: JSON.stringify(request) // 요청 본문을 JSON 문자열로 변환
      });

      // 응답이 성공적이지 않으면 오류 처리
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '그룹 생성에 실패했습니다.');
      }

      const result = await response.json(); // 성공 응답 데이터 파싱
      // 응답 형식이 유효하지 않으면 오류 던지기
      if (!result.result) {
        throw new Error('Invalid response format');
      }

      // 응답 결과를 CreateSettlementGroupResponseDto 타입으로 캐스팅
      const groupData = result.result as CreateSettlementGroupResponseDto;
      
      // 그룹 생성 성공 알림 및 초대 코드 표시
      alert(`정산 그룹이 성공적으로 생성되었습니다.\n초대 코드: ${groupData.joinCode}`);

      // 생성된 그룹 상세 페이지로 리다이렉트
      router.push(`/settlement/group/${groupData.groupId}`);
    } catch (error) {
      console.error('Error creating group:', error); // 오류 콘솔에 로깅
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        alert(error instanceof Error ? error.message : '그룹 생성 중 오류가 발생했습니다.');
      }
    }
  };

  // 컴포넌트 렌더링
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 헤더 섹션 */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        {/* 뒤로 가기 링크 */}
        <Link href="/settlement" className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} /> {/* 왼쪽 화살표 아이콘 */}
        </Link>
        <h1 className="text-lg font-medium">정산 그룹 생성</h1> {/* 페이지 제목 */}
        <div className="w-6"></div> {/* 오른쪽 정렬을 위한 빈 공간 */}
      </header>

      {/* 메인 콘텐츠 섹션 */}
      <div className="flex-1 p-4">
        {/* 그룹 이름 입력 필드 */}
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
              nameError ? "border-red-500" : "border-gray-300" // 오류가 있으면 빨간색 테두리
            } p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          {nameError && ( // 그룹 이름 오류 메시지 표시
            <p className="mt-1 flex items-center text-sm text-red-500">
              <AlertCircle className="mr-1 h-4 w-4" /> {/* 경고 아이콘 */}
              {nameError}
            </p>
          )}
        </div>

        {/* 공유 지갑 선택 필드 */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">공유 지갑 선택</label>
          <div
            className="flex items-center justify-between rounded-lg border border-gray-300 p-3"
            onClick={() => setShowWalletSelector(true)} // 클릭 시 지갑 선택 모달 열기
          >
            {selectedWallet ? ( // 선택된 지갑이 있으면 정보 표시
              <div className="flex items-center">
                <div className="relative mr-3 h-8 w-8 overflow-hidden rounded-full border border-gray-200">
                  <img
                    src={selectedWallet.flagSrc}
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
              <span className="text-gray-500">지갑을 선택해주세요</span> // 선택된 지갑이 없으면 안내 메시지
            )}
            {/* 아래 화살표 아이콘 */}
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

        {/* 최대 멤버 수 설정 필드 */}
        <div className="mb-6">
          <label htmlFor="maxMembers" className="mb-2 block text-sm font-medium text-gray-700">
            최대 멤버 수
          </label>
          <div className="flex items-center">
            {/* 멤버 수 감소 버튼 */}
            <button
              onClick={() => maxMembers > 2 && setMaxMembers(maxMembers - 1)} // 2보다 크면 감소
              className="flex h-10 w-10 items-center justify-center rounded-l-lg border border-gray-300 bg-gray-100 text-gray-700 cursor-pointer"
            >
              -
            </button>
            {/* 멤버 수 입력 필드 */}
            <input
              type="number"
              id="maxMembers"
              value={maxMembers}
              onChange={handleMaxMembersChange}
              min="2"
              max="10"
              className="h-10 w-16 border-y border-gray-300 text-center"
            />
            {/* 멤버 수 증가 버튼 */}
            <button
              onClick={() => maxMembers < 10 && setMaxMembers(maxMembers + 1)} // 10보다 작으면 증가
              className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-gray-300 bg-gray-100 text-gray-700 cursor-pointer"
            >
              +
            </button>
            <span className="ml-2 text-gray-500">명</span>
          </div>
        </div>

        {/* 유의사항 섹션 */}
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

      {/* 그룹 생성 버튼 섹션 */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleCreateGroup} // 클릭 시 그룹 생성 함수 호출
          disabled={!groupName.trim() || !!nameError || !selectedWallet} // 그룹 이름, 오류, 선택된 지갑 여부에 따라 버튼 비활성화
          className={`w-full rounded-lg py-3 text-center font-medium text-white ${
            groupName.trim() && !nameError && selectedWallet
              ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md cursor-pointer" // 활성화 상태 스타일
              : "bg-gray-300 cursor-not-allowed" // 비활성화 상태 스타일
          }`}
        >
          그룹 생성하기
        </button>
      </div>

      {/* 지갑 선택 모달 */}
      {showWalletSelector && (
        <ModalPortal> {/* 모달을 DOM의 다른 위치로 렌더링 */}
          {/* 전역 스타일 (모달이 열릴 때 스크롤 막기 및 애니메이션) */}
          <style jsx global>{`
            body {
              overflow: hidden; /* 모달이 열릴 때 스크롤 막기 */
            }
            @keyframes fadeIn { /* 페이드인 애니메이션 */
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn { /* 스케일인 애니메이션 */
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
          {/* 모달 오버레이 (배경) */}
          <div
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)", // 반투명 검정 배경
              backdropFilter: "blur(2px)", // 블러 효과
              animation: "fadeIn 0.3s ease-out", // 페이드인 애니메이션 적용
            }}
            onClick={() => setShowWalletSelector(false)} // 오버레이 클릭 시 모달 닫기
          >
            {/* 모달 콘텐츠 컨테이너 */}
            <div
              className="fixed inset-0 flex items-center justify-center p-4"
              style={{
                animation: "scaleIn 0.3s ease-out", // 스케일인 애니메이션 적용
              }}
              onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 오버레이 클릭 이벤트 전파 방지
            >
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xl font-bold">지갑 선택</h2>
                <div className="max-h-96 overflow-y-auto"> {/* 지갑 목록 스크롤 가능 영역 */}
                  {walletBalances.length > 0 ? ( // 지갑이 있으면 목록 표시
                    <div className="space-y-3">
                      {walletBalances.map((wallet, index) => (
                        <button
                          key={index}
                          className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSelectWallet(wallet)}
                        >
                          <div className="flex items-center">
                            <div className="relative mr-3 h-10 w-10 overflow-hidden rounded-full border border-gray-200">
                              <img
                                src={wallet.flagSrc}
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
                          {selectedWallet?.code === wallet.code && <Check className="h-5 w-5 text-blue-500" />} {/* 선택된 지갑에 체크 아이콘 표시 */}
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
                {/* 취소 버튼 */}
                <button
                  onClick={() => setShowWalletSelector(false)} // 클릭 시 모달 닫기
                  className="mt-4 w-full rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 cursor-pointer"
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