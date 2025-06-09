"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { getValidToken } from "@/lib/auth"

// 타입 정의
interface WalletResponse {
  currencyCode: string;
  currencyName: string;
  balance: number;
  walletNumber: string;
}

interface WalletBalance {
  country: string;
  code: string;
  flagSrc: string;
  amount: number;
  walletNumber: string;
}

interface ExchangeRate {
  country: string;
  code: string;
  flagSrc: string;
  rate: string;
  registrationTime: string;
}

const mapCurrencyToFlag = (code: string) => {
  const map: Record<string, string> = {
    KRW: "korea.png",
    USD: "usa.png",
    EUR: "eu.png",
    JPY: "japan.png",
    CNY: "china.png",
    INR: "india.png",
    VND: "vietnam.png",
  }
  return map[code] || "korea.png"
}

const mapCurrencyToCountry = (code: string) => {
  const map: Record<string, string> = {
    KRW: "대한민국",
    USD: "미국",
    EUR: "유럽",
    JPY: "일본",
    CNY: "중국",
    INR: "인도",
    VND: "베트남",
  }
  return map[code] || "알수없음"
}

const fetchWalletBalances = async (router: ReturnType<typeof useRouter>): Promise<WalletBalance[]> => {
  try {
    const token = await getValidToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/all`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (res.status === 401) {
      router.push("/")
      return []
    }

    const result = await res.json()
    console.log('Wallet API result:', result);

    if (!Array.isArray(result.result)) {
      // 지갑이 없거나 응답이 비정상이어도 홈화면은 보여줌
      return [];
    }

    const walletInfos: WalletBalance[] = result.result.map((wallet: WalletResponse) => ({
      country: mapCurrencyToCountry(wallet.currencyCode),
      code: wallet.currencyCode,
      flagSrc: `/images/flags/${mapCurrencyToFlag(wallet.currencyCode)}`,
      amount: Number(wallet.balance),
      walletNumber: wallet.walletNumber
    }));
    return walletInfos;
  } catch {
    // 에러가 나도 홈화면은 보여줌
    return [];
  }
}

// 환율 국가 코드와 국기, 한글명 매핑
const currencyMeta: Record<string, { country: string; flagSrc: string }> = {
  JPY: { country: "일본", flagSrc: "/images/flags/japan.png" },
  EUR: { country: "유럽", flagSrc: "/images/flags/eu.png" },
  USD: { country: "미국", flagSrc: "/images/flags/usa.png" },
  CNY: { country: "중국", flagSrc: "/images/flags/china.png" },
  VND: { country: "베트남", flagSrc: "/images/flags/vietnam.png" },
  INR: { country: "인도", flagSrc: "/images/flags/india.png" },
}

// 환율 변동 더미 데이터 (전날 대비)
const dummyRateChange: Record<string, { diff: number; percent: number }> = {
  JPY: { diff: -0.8, percent: -0.41 },
  EUR: { diff: 0.5, percent: 0.32 },
  USD: { diff: 1.2, percent: 0.09 },
  CNY: { diff: -0.8, percent: -0.41 },
  VND: { diff: 0.001, percent: 0.18 },
  INR: { diff: 0.02, percent: 0.13 },
};

type ExchangeRateDataDto = {
  currency: string;
  registrationTime: string;
  bankOfKoreaRate: string;
};

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [hasWallet, setHasWallet] = useState(false)
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [showNoWalletModal, setShowNoWalletModal] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getValidToken();
        fetchWalletBalances(router).then((balances) => {
          setWalletBalances(balances)
          setHasWallet(balances.length > 0)
          localStorage.setItem("walletBalances", JSON.stringify(balances))
          localStorage.setItem("hasChargedWallet", balances.length > 0 ? "true" : "false")
        })
      } catch {
        router.push("/")
      }
    }

    checkAuth();

    // 환율 정보 API robust fetch (with token, logging, and correct structure)
    const fetchRates = async () => {
      try {
        console.log('[환율] API URL:', process.env.NEXT_PUBLIC_API_URL);
        const token = await getValidToken();
        console.log('[환율] Token:', token ? token.substring(0, 20) + '...' : '없음');
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/exchange/rates-v3`;
        console.log('[환율] Fetching:', apiUrl);
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });
        console.log('[환율] Response status:', res.status);
        const result = await res.json();
        console.log('[환율] 최종 응답 구조 확인:', JSON.stringify(result, null, 2));
        const data: ExchangeRateDataDto[] = Array.isArray(result.result?.data) ? result.result.data : [];
        if (!data.length) {
          console.warn('[환율] result.result.data가 비어있거나 배열이 아님:', result.result?.data);
        } else {
          console.log('[환율] 사용된 경로: result.result.data');
        }
        const rates: ExchangeRate[] = data.map((item) => {
          const meta = currencyMeta[item.currency] || { country: item.currency, flagSrc: "" };
          return {
            country: meta.country,
            code: item.currency,
            flagSrc: meta.flagSrc,
            rate: item.bankOfKoreaRate,
            registrationTime: item.registrationTime,
          };
        });
        setExchangeRates(rates);
      } catch (err) {
        console.error('[환율] API 호출 실패:', err);
        setExchangeRates([]);
      }
    };
    fetchRates();
  }, []);

  // 스크롤 애니메이션은 별도 관리
  useEffect(() => {
    if (!isScrolling) {
      const interval = setInterval(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollLeft += 1
          if (carouselRef.current.scrollLeft % 150 === 0) {
            const newIndex = Math.floor(carouselRef.current.scrollLeft / 150) % exchangeRates.length
            setActiveCardIndex(newIndex)
          }
          if (
            carouselRef.current.scrollLeft >=
            carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10
          ) {
            carouselRef.current.scrollLeft = 0
            setActiveCardIndex(0)
          }
        }
      }, 30)
      return () => clearInterval(interval)
    }
  }, [isScrolling, exchangeRates.length])

  const handleCharge = () => {
    router.push("/wallet/charge")
  }

  const handleTransfer = () => {
    if (!hasWallet) {
      setShowNoWalletModal(true)
      return
    }
    router.push("/wallet/transfer")
  }

  const handleSettlement = () => {
    if (!hasWallet) {
      setShowNoWalletModal(true)
      return
    }
    router.push("/settlement")
  }

  const handlePayment = () => {
    if (!hasWallet) {
      setShowNoWalletModal(true)
      return
    }
    router.push("/payment")
  }

  // 지갑 항목 클릭 핸들러
  const handleWalletClick = (code: string) => {
    router.push(`/wallet/history?currency=${code}`)
  }

  // Navigation items with custom icons
  const navItems = [
    { name: "홈", path: "/home", icon: "/images/icons/home-icon.png", onClick: undefined },
    { name: "정산", path: "/settlement", icon: "/images/icons/settlement-icon.png", onClick: handleSettlement },
    { name: "환전", path: "/exchange", icon: "/images/icons/exchange-icon.png", onClick: undefined },
    { name: "결제", path: "/payment", icon: "/images/icons/payment-icon.png", onClick: handlePayment },
    { name: "더 보기", path: "/more", icon: "", onClick: undefined },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header with updated logo - removed decorative circles */}
      <header className="flex items-center justify-center bg-white p-4 shadow-sm">
        <Image src="/images/moamoa-header-logo.png" alt="MOAMOA" width={180} height={60} className="drop-shadow-sm" />
      </header>

      {/* Wallet Section */}
      <div className="relative mx-4 mt-6 overflow-hidden rounded-xl bg-white p-5 shadow-md">
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-blue-50 opacity-50"></div>
        <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-blue-50 opacity-50"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">내 지갑</h2>
            <Link
              href="/wallet/history"
              className="group rounded-full bg-gray-50 p-2 transition-all duration-300 hover:bg-blue-500"
            >
              <ChevronRight className="h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-blue-500" />
            </Link>
          </div>

          {hasWallet && walletBalances.length > 0 ? (
            <div className="mt-4 space-y-3">
              {walletBalances.map((balance, index) => (
                <div
                  key={index}
                  className="group flex cursor-pointer items-center justify-between border-b border-gray-100 pb-3 transition-all duration-300 hover:translate-x-1"
                  onClick={() => handleWalletClick(balance.code)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
                      <Image
                        src={balance.flagSrc || "/images/flags/korea.png"}
                        alt={balance.country}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        {balance.country} {balance.code}
                      </p>
                      <p className="text-lg font-bold text-gray-800">{balance.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{balance.walletNumber}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="my-10 text-center text-gray-500">
              <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-full bg-gray-100"></div>
              아직 충전된 통화가 없어요.
            </div>
          )}

          <div className="mt-5 flex space-x-4">
            <button
              onClick={handleTransfer}
              className={`group relative flex-1 overflow-hidden rounded-lg py-4 text-center font-medium text-white shadow-md transition-all duration-300 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] hover:shadow-[0_6px_10px_-1px_rgba(77,169,255,0.4),0_2px_6px_-2px_rgba(77,169,255,0.3)] active:translate-y-0.5 active:shadow-[0_2px_4px_-1px_rgba(77,169,255,0.3),0_1px_2px_-1px_rgba(77,169,255,0.2)] cursor-pointer`}
            >
              <span className="relative z-10">송금하기</span>
              <div className="absolute inset-0 -left-full h-full w-full translate-x-0 bg-white opacity-20 transition-transform duration-300 group-hover:translate-x-full"></div>
            </button>
            <button
              onClick={handleCharge}
              className={`group relative flex-1 overflow-hidden rounded-lg py-4 text-center font-medium text-white shadow-md transition-all duration-300 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] hover:shadow-[0_6px_10px_-1px_rgba(77,169,255,0.4),0_2px_6px_-2px_rgba(77,169,255,0.3)] active:translate-y-0.5 active:shadow-[0_2px_4px_-1px_rgba(77,169,255,0.3),0_1px_2px_-1px_rgba(77,169,255,0.2)] cursor-pointer`}
            >
              <span className="relative z-10">충전하기</span>
              <div className="absolute inset-0 -left-full h-full w-full translate-x-0 bg-white opacity-20 transition-transform duration-300 group-hover:translate-x-full"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Spacer with decorative elements */}
      <div className="relative mt-8 h-16">
        <div className="absolute left-0 right-0 top-0 h-4">
          <svg
            className="h-full w-full"
            viewBox="0 0 1200 30"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0 C300,30 600,0 900,20 C1000,30 1100,15 1200,0 L1200,30 L0 Z"
              fill="#E6F0FF"
              opacity="0.3"
            ></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4">
          <svg
            className="h-full w-full"
            viewBox="0 0 1200 30"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,30 C300,0 600,30 900,10 C1000,0 1100,15 1200,30 L1200,0 L0,0 Z"
              fill="#E6F0FF"
              opacity="0.3"
            ></path>
          </svg>
        </div>
      </div>

      {/* Exchange Rate Section - Horizontal Scrolling */}
      <div className="relative mt-8 px-4">
        <div className="flex items-center justify-between">
          <h2 className="mb-4 text-lg font-medium text-gray-800">환율 정보</h2>
          <div className="mb-4 flex space-x-1">
            {exchangeRates.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                  i === activeCardIndex ? "bg-[#4DA9FF]" : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div
          ref={carouselRef}
          className="flex overflow-x-auto pb-6 scrollbar-hide"
          onMouseEnter={() => setIsScrolling(true)}
          onMouseLeave={() => setIsScrolling(false)}
          onTouchStart={() => setIsScrolling(true)}
          onTouchEnd={() => setTimeout(() => setIsScrolling(false), 3000)}
        >
          <div className="flex space-x-3">
            {/* Duplicate the items for infinite scroll effect */}
            {[...exchangeRates, ...exchangeRates].map((rate, index) => (
              <div
                key={index}
                className="group min-w-[160px] max-w-[180px] rounded-xl bg-white p-5 shadow hover:shadow-md transition-all duration-200 flex flex-col items-center justify-between relative overflow-hidden animate-fade-in-scale cursor-pointer border border-gray-100 active:scale-95"
                style={{ minHeight: 130, animationDelay: `${index * 80}ms` }}
                onClick={() => window.location.href = '/exchange'}
              >
                {/* Flag and country */}
                <div className="mb-3 flex flex-col items-center z-10">
                  <div className="relative h-10 w-10 mb-1 overflow-hidden rounded-full border border-gray-200 shadow-sm">
                    <Image src={rate.flagSrc || '/images/flags/korea.png'} alt={rate.country} width={40} height={40} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 tracking-tight">{rate.country}</span>
                  <span className="text-xs font-medium text-gray-400 mt-0.5">{rate.code}</span>
                </div>
                {/* Rate info */}
                <div className="flex flex-col items-center z-10">
                  <span className="text-lg font-bold text-gray-700">{rate.rate}<span className="text-base font-medium ml-0.5 text-gray-400">원</span></span>
                  {/* 전날 대비 변동 더미데이터 */}
                  {dummyRateChange[rate.code] && (
                    <span className={`mt-1 text-xs font-medium ${dummyRateChange[rate.code].diff >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      ~ {dummyRateChange[rate.code].diff >= 0 ? '+' : ''}{dummyRateChange[rate.code].diff} ({dummyRateChange[rate.code].percent >= 0 ? '+' : ''}{dummyRateChange[rate.code].percent}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation with larger custom icons */}
      <div className="mt-auto border-t border-gray-200 bg-white shadow-md">
        <div className="flex">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              onClick={item.onClick}
              className={`group flex flex-1 flex-col items-center justify-center py-3 ${
                pathname === item.path ? "text-[#0DAEFF]" : "text-gray-500"
              } cursor-pointer`}
            >
              {item.name === "더 보기" ? (
                <MoreHorizontal className="h-8 w-8" />
              ) : (
                <div className="relative h-8 w-8">
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={32}
                    height={32}
                    className={`transition-all duration-300 ${
                      pathname === item.path ? "drop-shadow-sm opacity-100" : "opacity-70 group-hover:opacity-90"
                    }`}
                  />
                  {pathname === item.path && (
                    <div className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-[#0DAEFF]"></div>
                  )}
                </div>
              )}
              <span
                className={`mt-1 text-xs font-medium transition-all duration-300 ${
                  pathname === item.path ? "font-semibold" : "group-hover:text-gray-700"
                }`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* No Wallet Modal */}
      {showNoWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
          <div className="rounded-lg bg-white p-6 shadow-lg w-80 text-center">
            <h2 className="mb-4 text-lg font-semibold">지갑이 필요합니다</h2>
            <p className="mb-6 text-gray-600">해당 작업을 수행하려면 먼저 지갑을 생성해야합니다.<br />지갑을 생성하시겠습니까?</p>
            <button
              className="w-full rounded bg-blue-500 py-2 text-white font-semibold hover:bg-blue-600 transition"
              onClick={() => {
                setShowNoWalletModal(false)
                router.push("/wallet/charge")
              }}
            >
              지갑 생성하기
            </button>
            <button
              className="mt-3 w-full rounded border border-gray-300 py-2 text-gray-700 hover:bg-gray-100 transition"
              onClick={() => setShowNoWalletModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Animation keyframes for fade-in-scale */}
      <style jsx>{`
        @keyframes fade-in-scale {
          0% { opacity: 0; transform: scale(0.96) translateY(24px); }
          60% { opacity: 0.7; transform: scale(1.01) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  )
}