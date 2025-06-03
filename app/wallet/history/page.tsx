"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronDown, Filter, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import FilterModal from "@/components/filter-modal"
import { getValidToken } from "@/lib/auth"
import {
  getCurrencySymbol,
  getCountryName,
  mapCurrencyToFlag,
  formatDateForDisplay,
  formatTimeForDisplay,
  getTransactionTypeName,
} from "@/lib/utils"
import { DateRangeType, TransactionType } from '@/types' // 거래 타입 가져오기

// 거래내역 한 건을 표현하는 타입
type Transaction = {
  id: number // 거래 고유번호
  walletNumber: string // 내 지갑 번호
  counterWalletNumber: string | null // 상태방 지갑 번호
  currencyCode: string // 통화 코드
  type: TransactionType // 거래 타입
  status: "COMPLETED" | "PENDING" | "FAILED" // 거래 상태
  amount: number // 거래 금액
  transactedAt: string // 거래 시각
  external: boolean // 환비 연결 여부
}

// 지갑 정보 타입
type WalletInfo = {
  country: string // 국가 이름
  currencyCode: string // 통화 코드
  flagSrc: string // 통화 플래그 이미지
  amount: number // 잔액
  walletNumber: string // 내 지갑 번호
}

// 필터 옵션 타입
type FilterOptions = {
  dateRangeType: DateRangeType // 기간 필터 (전체 날짜/지정 날짜)
  startDate: string // 시작 날짜 (지정 날짜 선택 시)
  endDate: string // 종료 날짜 (지정 날짜 선택 시)
  transactionType: TransactionType // 거래 타입 필터
}

// 지갑 정보 조회 API 응답 DTO 타입
type SearchWalletResponseDto = {
  currencyCode: string // 통화 코드
  currencyName: string // 통화 이름
  balance: number // 잔액
  walletNumber: string // 내 지갑 번호
}

// 거래 내역 조회 API 응답 DTO 타입
type TransactionResponseDto = {
  id: number
  walletNumber: string
  counterWalletNumber: string | null
  currencyCode: string
  type: TransactionType
  status: "COMPLETED" | "PENDING" | "FAILED"
  amount: number
  transactedAt: string
  external: boolean
}

// --- 메인 컴포넌트 ---
export default function TransactionHistoryPage() {
  const router = useRouter() // Next.js 라우터 객체를 초기화합니다. 페이지 이동, URL 변경 등에 사용됩니다.
  const searchParams = useSearchParams() // 현재 URL의 쿼리 파라미터를 읽어오는 훅을 초기화합니다.
  const currencyParam = searchParams.get("currency") // URL에서 "currency" 쿼리 파라미터 값을 가져옵니다.

  // --- 상태 관리 ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false) // 통화 선택 드롭다운 메뉴의 열림/닫힘 상태를 관리합니다.
  // 선택된 통화 상태. URL 쿼리 파라미터에 'currency'가 있으면 그 값을 사용하고, 없으면 "전체통화"가 기본값입니다.
  const [selectedCurrency, setSelectedCurrency] = useState(currencyParam || "전체통화")
  const [showFilterModal, setShowFilterModal] = useState(false) // 필터 모달의 표시/숨김 상태를 관리합니다.

  // 필터 관련 상태들 (필터 모달에서 적용될 값들)
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>("전체기간") // 기간 필터 타입 (전체 기간 또는 지정 기간)
  // 시작 날짜. 초기값은 오늘 날짜를 YYYY-MM-DD 형식으로 설정합니다.
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  // 종료 날짜. 초기값은 오늘 날짜를 YYYY-MM-DD 형식으로 설정합니다.
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [transactionType, setTransactionType] = useState<TransactionType>("all") // 거래 타입 필터. 초기값은 "all"(전체)입니다.

  // 데이터 관련 상태들
  const [transactions, setTransactions] = useState<Transaction[]>([]) // API로부터 가져온 거래 내역 목록을 저장합니다.
  const [wallets, setWallets] = useState<WalletInfo[]>([]) // API로부터 가져온 지갑 정보 목록을 저장합니다.

  // UI 관련 상태들
  const [isLoading, setIsLoading] = useState(true) // 초기 데이터 로딩 중인지 여부를 나타냅니다.
  const [isRefreshing, setIsRefreshing] = useState(false) // "당겨서 새로고침" 기능이 활성화되었는지 여부를 나타냅니다.
  // cf. "당겨서 새로고침": 모바일 앱에서 화면을 아래로 당기면 데이터를 새로 불러오는 기능
  const [startY, setStartY] = useState(0) // "당겨서 새로고침"을 위한 터치 시작 Y 좌표를 저장합니다.
  const contentRef = useRef<HTMLDivElement>(null) // 스크롤 영역 (거래 내역 리스트)의 DOM 요소를 참조하기 위한 ref입니다.

  // --- API fetch 함수 ---
  // 지갑 정보를 가져오는 비동기 함수. useCallback으로 감싸져 불필요한 함수 재생성을 막습니다.
  const fetchWallets = useCallback(async () => {
    setIsLoading(true); // 로딩 상태를 true로 설정하여 UI에 로딩 중임을 표시합니다.
    try {
      const token = await getValidToken(); // 유효한 인증 토큰을 가져옵니다.
      if (!token) { // 토큰이 없으면
        router.push("/login"); // 로그인 페이지로 리다이렉션합니다.
        return []; // 빈 배열 반환
      }

      let response;
      if (selectedCurrency === "전체통화") {
        // 전체 지갑 정보 조회
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/all`, {
          headers: { Authorization: `Bearer ${token}` }, // 인증 토큰을 헤더에 추가합니다.
          credentials: "include", // 쿠키를 포함하여 요청을 보냅니다.
        });
      } else {
        // 특정 통화의 지갑 정보 조회
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet?currencyCode=${selectedCurrency}`,
          {
            headers: { Authorization: `Bearer ${token}` }, // 인증 토큰을 헤더에 추가합니다.
            credentials: "include", // 쿠키를 포함하여 요청을 보냅니다.
          }
        );
      }

      if (!response.ok) { // 응답이 성공적이지 않으면 (HTTP 상태 코드 200번대가 아니면)
        const errorData = await response.json(); // 에러 응답 본문을 JSON으로 파싱
        let errorMsg = errorData.message || '지갑 정보를 가져오는 데 실패했습니다.';
        if (errorData.errorCode) {
          switch (errorData.errorCode) {
            case "WALLET_001": errorMsg = "존재하지 않는 지갑입니다."; break;
            case "WALLET_002": errorMsg = "이미 해당 통화의 지갑이 존재합니다."; break;
            case "WALLET_003": errorMsg = "존재하지 않는 통화 코드입니다."; break;
            case "WALLET_004": errorMsg = "지갑 생성에 실패했습니다."; break;
            case "WALLET_005": errorMsg = "잔액이 부족합니다."; break;
            case "WALLET_006": errorMsg = "유효하지 않은 거래 금액입니다."; break;
            case "WALLET_007": errorMsg = "유효하지 않은 거래 유형입니다."; break;
            case "WALLET_009": errorMsg = "계좌 연결 정보를 찾을 수 없습니다."; break;
            case "WALLET_010": errorMsg = "거래 내역을 찾을 수 없습니다."; break;
            case "WALLET_011": errorMsg = "사용자와 계좌 연결 정보가 일치하지 않습니다."; break;
            case "WALLET_012": errorMsg = "사용자와 계좌 연결 정보의 통화가 일치하지 않습니다."; break;
            case "WALLET_013": errorMsg = "인증에 실패했습니다."; break;
            default: if (errorData.message) errorMsg = errorData.message;
          }
        }
        throw new Error(errorMsg);
      }

      const result = await response.json(); // 성공 응답 본문을 JSON으로 파싱
      
      // 전체 지갑 조회와 단일 지갑 조회의 응답 구조가 다름 -> 응답 구조 통일하기 위해 배열 처리
      const walletData = selectedCurrency === "전체통화" 
        ? result.result 
        : [result.result];

      if (!Array.isArray(walletData)) { // 응답 데이터가 배열이 아니면
        console.warn('Wallet API did not return expected data:', result); // 에러 메세지 출력
        return []; // 빈 배열 반환
      }

      const walletInfos: WalletInfo[] = walletData.map((wallet: SearchWalletResponseDto) => ({ // 지갑 정보 목록을 생성합니다.
        country: getCountryName(wallet.currencyCode), // 국가 이름
        currencyCode: wallet.currencyCode, // 통화 코드
        flagSrc: `/images/flags/${mapCurrencyToFlag(wallet.currencyCode)}`, // 국기 이미지
        amount: Number(wallet.balance), // 잔액
        walletNumber: wallet.walletNumber, // 지갑 번호
      }))

      setWallets(walletInfos); // 지갑 정보 목록을 상태에 저장

      return walletInfos; // 지갑 정보 목록을 반환

    } catch (error) { // 에러 발생 시
      
      console.error('Error fetching wallets:', error); // 에러 콘솔에 로깅
      alert(`지갑 정보 로딩 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`); // 사용자에게 알림
      setWallets([]); // 지갑 정보를 빈 배열로 초기화
      return []; // 빈 배열 반환
    
    } finally { // 예외 발생 여부에 관계없이 실행됨
      
      setIsLoading(false); // 로딩 상태를 false로 설정
    
    }
  }, [router, selectedCurrency]); // selectedCurrency 의존성 추가

  // --- 파생 상태 ---
  // 거래 내역이 변경될 때마다 지갑 정보 업데이트
  useEffect(() => {
    if (transactions.length > 0) {
      fetchWallets();
    }
  }, [transactions, fetchWallets]);

  // 선택된 통화에 해당하는 지갑 정보를 계산
  const selectedWallet = useMemo(() => {
    if (selectedCurrency === "전체통화") return null;
    return wallets.find(wallet => wallet.currencyCode === selectedCurrency) || null;
  }, [selectedCurrency, wallets]);

  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      const date = formatDateForDisplay(tx.transactedAt);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(tx);
    });
    return grouped;
  }, [transactions]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true); // Indicate loading when fetching transactions
    try {
      const token = await getValidToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const queryParams = new URLSearchParams({
        page: '0',
        size: '20'
      });

      if (selectedCurrency !== "전체통화") {
        queryParams.append('currencyCode', selectedCurrency);
      }

      if (dateRangeType === "지정기간") {
        queryParams.append('startDate', `${startDate}T00:00:00`);
        queryParams.append('endDate', `${endDate}T23:59:59`);
      }

      if (transactionType !== "all") {
        queryParams.append('type', transactionType);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = errorData.message || '거래 내역을 가져오는 데 실패했습니다.';
        if (errorData.errorCode) {
          switch (errorData.errorCode) {
            case "WALLET_001": errorMsg = "존재하지 않는 지갑입니다."; break;
            case "WALLET_002": errorMsg = "이미 해당 통화의 지갑이 존재합니다."; break;
            case "WALLET_003": errorMsg = "존재하지 않는 통화 코드입니다."; break;
            case "WALLET_004": errorMsg = "지갑 생성에 실패했습니다."; break;
            case "WALLET_005": errorMsg = "잔액이 부족합니다."; break;
            case "WALLET_006": errorMsg = "유효하지 않은 거래 금액입니다."; break;
            case "WALLET_007": errorMsg = "유효하지 않은 거래 유형입니다."; break;
            case "WALLET_009": errorMsg = "계좌 연결 정보를 찾을 수 없습니다."; break;
            case "WALLET_010": errorMsg = "거래 내역을 찾을 수 없습니다."; break;
            case "WALLET_011": errorMsg = "사용자와 계좌 연결 정보가 일치하지 않습니다."; break;
            case "WALLET_012": errorMsg = "사용자와 계좌 연결 정보의 통화가 일치하지 않습니다."; break;
            case "WALLET_013": errorMsg = "인증에 실패했습니다."; break;
            default: if (errorData.message) errorMsg = errorData.message;
          }
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      if (result.errorCode) {
        alert(result.message || '거래 내역 조회 중 에러가 발생했습니다.');
        setTransactions([]);
        return;
      }

      if (!result.result || !Array.isArray(result.result.content)) {
        console.warn('Transaction API did not return expected content:', result);
        setTransactions([]);
        return;
      }

      // TransactionResponseDto 타입을 사용하여 응답 데이터 매핑
      const transactions: Transaction[] = result.result.content.map((tx: TransactionResponseDto) => ({
        id: tx.id,
        walletNumber: tx.walletNumber,
        counterWalletNumber: tx.counterWalletNumber,
        currencyCode: tx.currencyCode,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        transactedAt: tx.transactedAt,
        external: tx.external
      }));

      setTransactions(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert(`거래 내역 로딩 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setTransactions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false); // End refreshing state
    }
  }, [selectedCurrency, dateRangeType, startDate, endDate, transactionType, router]);

  // --- Effects ---
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await Promise.all([fetchWallets(), fetchTransactions()]);
      setIsLoading(false);
    };

    initData();
  }, [fetchWallets, fetchTransactions, router]);

  useEffect(() => {
    // Update selected currency from URL param on mount or param change
    if (currencyParam) {
      setSelectedCurrency(currencyParam);
    }
  }, [currencyParam]);

  // 거래 내역이 변경될 때마다 지갑 정보도 새로 불러오기
  useEffect(() => {
    if (transactions.length > 0) {
      fetchWallets(); // 지갑 정보 새로 불러오기
    }
  }, [transactions, fetchWallets]);

  // 주기적으로 지갑 정보 갱신 (예: 30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWallets();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchWallets]);

  // --- Event Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY
    const diff = currentY - startY

    // Only activate refresh if scrolled to top and pulling down
    if (diff > 50 && contentRef.current && contentRef.current.scrollTop === 0 && !isRefreshing) {
      setIsRefreshing(true)
    }
  }

  const handleTouchEnd = () => {
    if (isRefreshing) {
      fetchTransactions(); // Re-fetch data on pull-to-refresh
    }
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const selectCurrency = (currency: string) => {
    if (currency === selectedCurrency) {
      setIsDropdownOpen(false)
      return
    }

    setSelectedCurrency(currency)
    setIsDropdownOpen(false)

    // Update URL and trigger new fetch
    if (currency === "전체통화") {
      router.push("/wallet/history", { scroll: false })
    } else {
      router.push(`/wallet/history?currency=${currency}`, { scroll: false })
    }
  }

  const toggleFilterModal = () => {
    setShowFilterModal(!showFilterModal)
  }

  const handleCharge = () => {
    router.push(`/wallet/charge${selectedCurrency !== "전체통화" ? `?currency=${selectedCurrency}` : ""}`)
  }

  const handleTransfer = () => {
    router.push(`/wallet/transfer${selectedCurrency !== "전체통화" ? `?currency=${selectedCurrency}` : ""}`)
  }

  const handleRefund = () => {
    router.push(`/wallet/refund${selectedCurrency !== "전체통화" ? `?currency=${selectedCurrency}` : ""}`)
  }

  const handleApplyFilters = (filters: FilterOptions) => {
    // Only update states if they are different to prevent unnecessary re-renders
    if (filters.dateRangeType !== dateRangeType) setDateRangeType(filters.dateRangeType);
    if (filters.startDate !== startDate) setStartDate(filters.startDate);
    if (filters.endDate !== endDate) setEndDate(filters.endDate);
    if (filters.transactionType !== transactionType) setTransactionType(filters.transactionType);

    setShowFilterModal(false);
    // fetchTransactions will be called by useEffect when filter states change
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <Link href="/home" className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">이용내역</h1>
        <Link href="/wallet/guide" className="text-blue-500 cursor-pointer">
          안내
        </Link>
      </header>

      {/* Currency Selector Section */}
      <div className="flex flex-col items-center border-b border-gray-200 bg-white py-6">
        <div className="flex items-center space-x-2">
          <div className="relative h-6 w-6 overflow-hidden rounded-full">
            <Image
              src={selectedWallet?.flagSrc || "/images/moamoa-logo.png"}
              alt={selectedWallet?.country || "전체통화"}
              width={24}
              height={24}
              className="object-cover"
            />
          </div>
          <div className="flex items-center space-x-1 font-medium cursor-pointer" onClick={toggleDropdown}>
            <span>{selectedWallet ? `${selectedWallet.country} ${selectedWallet.currencyCode}` : "전체통화"}</span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Display balance if specific currency is selected */}
        {selectedWallet && (
          <>
            <div className="mt-2 text-3xl font-bold">
              {getCurrencySymbol(selectedWallet.currencyCode)} {selectedWallet.amount.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              지갑번호: {selectedWallet.walletNumber}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex w-full max-w-md justify-around px-4">
          <div className="flex flex-col items-center">
            <button
              onClick={handleCharge}
              className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md cursor-pointer"
            >
              <span className="text-2xl font-bold text-white">+</span>
            </button>
            <span className="text-sm font-medium text-gray-700">충전</span>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={handleTransfer}
              disabled={wallets.length === 0}
              className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full shadow-md ${
                wallets.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] cursor-pointer"
              }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${wallets.length === 0 ? "text-gray-400" : "text-white"}`}
              >
                <path
                  d="M5 12H19M19 12L13 6M19 12L13 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className={`text-sm font-medium ${wallets.length === 0 ? "text-gray-400" : "text-gray-700"}`}>송금</span>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={handleRefund}
              disabled={wallets.length === 0}
              className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full shadow-md ${
                wallets.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] cursor-pointer"
              }`}
            >
              <RefreshCw size={20} className={wallets.length === 0 ? "text-gray-400" : "text-white"} />
            </button>
            <span className={`text-sm font-medium ${wallets.length === 0 ? "text-gray-400" : "text-gray-700"}`}>환불</span>
          </div>
        </div>
      </div>

      {/* Currency Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute left-4 right-4 top-32 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
          <ul>
            <li>
              <button
                onClick={() => selectCurrency("전체통화")}
                className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50 cursor-pointer"
              >
                전체통화
              </button>
            </li>
            {wallets.map((wallet) => (
              <li key={wallet.currencyCode}>
                <button
                  onClick={() => selectCurrency(wallet.currencyCode)}
                  className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50 cursor-pointer"
                >
                  <div className="mr-2 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-gray-200">
                    <Image
                      src={wallet.flagSrc}
                      alt={wallet.country}
                      width={24}
                      height={24}
                    />
                  </div>
                  {wallet.country} {wallet.currencyCode}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter section */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <span>
            {dateRangeType === "전체기간" ? "전체기간" : `${startDate} ~ ${endDate}`}・
            {transactionType === "all" ? "전체" : getTransactionTypeName(transactionType)}
          </span>
          <ChevronDown size={16} onClick={toggleFilterModal} className="cursor-pointer" />
        </div>
        <button onClick={toggleFilterModal} className="cursor-pointer">
          <Filter size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Loading/Refreshing indicators */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
          <span className="ml-2 text-gray-600">데이터 로딩 중...</span>
        </div>
      )}
      {!isLoading && isRefreshing && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
          <span className="ml-2 text-gray-600">새로고침 중...</span>
        </div>
      )}

      {/* Transaction List */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!isLoading && Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions)
            .sort(([dateA], [dateB]) =>
              new Date(dateB.replace(/\./g, "-")).getTime() - new Date(dateA.replace(/\./g, "-")).getTime()
            )
            .map(([date, dateTransactions]) => (
              <div key={date} className="mb-4">
                <div className="bg-gray-100 px-4 py-2 text-sm text-gray-500">{date}</div>
                <div className="bg-white">
                  {dateTransactions.map((transaction, idx) => (
                    <div key={`${transaction.id}-${idx}`} className="border-b border-gray-100 px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-3 flex items-center">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100">
                              <Image
                                src={`/images/flags/${mapCurrencyToFlag(transaction.currencyCode)}`}
                                alt={transaction.currencyCode}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              {getCountryName(transaction.currencyCode)} {transaction.currencyCode}
                            </span>
                          </div>
                        </div>
                        <div className={`text-right font-medium ${
                            transaction.type === "CHARGE" || transaction.type === "TRANSFER_IN" || transaction.type === "SETTLEMENT_RECEIVE"
                              ? "text-blue-500"
                              : "text-gray-700"
                          }`}>
                          {transaction.type === "CHARGE" || transaction.type === "TRANSFER_IN" || transaction.type === "SETTLEMENT_RECEIVE"
                            ? `+ ${getCurrencySymbol(transaction.currencyCode)}${transaction.amount.toLocaleString()}`
                            : `- ${getCurrencySymbol(transaction.currencyCode)}${transaction.amount.toLocaleString()}`
                          }
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {getTransactionTypeName(transaction.type)}
                          {transaction.external && " (외부)"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimeForDisplay(transaction.transactedAt)}
                        </span>
                      </div>
                      {/* InternalWalletTransaction일 경우에만 상대 지갑번호 표시 */}
                      {[
                        "QR_PAYMENT",
                        "TRANSFER_OUT",
                        "TRANSFER_IN",
                        "SETTLEMENT_SEND",
                        "SETTLEMENT_RECEIVE"
                      ].includes(transaction.type) && transaction.counterWalletNumber && (
                        <div className="mt-1 text-xs text-gray-500">
                          상대 지갑번호: {transaction.counterWalletNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
        ) : !isLoading ? ( // Only show "no transactions" if not loading and no transactions
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-400"
              >
                <path
                  d="M9 14L4 9M4 9L9 4M4 9H20M15 10L20 15M20 15L15 20M20 15H4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-lg font-medium">이용내역이 없습니다.</p>
            <p className="mt-2 text-sm">선택한 조건에 맞는 거래 내역이 없습니다.</p>
          </div>
        ) : null /* Do nothing if loading */
        }
      </div>

      {/* Filter Modal Component */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={toggleFilterModal}
        onApply={handleApplyFilters}
        initialFilters={{
          dateRangeType,
          startDate,
          endDate,
          transactionType,
        }}
      />
    </div>
  )
}