"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

type WalletBalance = {
  country: string
  code: string
  flagSrc: string
  amount: number
}

type ExchangeRate = {
  country: string
  code: string
  flagSrc: string
  rate: string
  change: string
  percentage: string
  isPositive: boolean
}

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [hasWallet, setHasWallet] = useState(false)
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [activeCardIndex, setActiveCardIndex] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (!isLoggedIn) {
      router.push("/")
      return
    }

    // Check if wallet has been charged before
    const hasChargedWallet = localStorage.getItem("hasChargedWallet")
    setHasWallet(hasChargedWallet === "true")

    if (hasChargedWallet === "true") {
      // Mock wallet data with actual flag images
      setWalletBalances([
        { country: "대한민국", code: "KRW", flagSrc: "/images/flags/korea.png", amount: 10000 },
        { country: "중국", code: "CNY", flagSrc: "/images/flags/china.png", amount: 50 },
        { country: "인도", code: "INR", flagSrc: "/images/flags/india.png", amount: 800 },
        { country: "일본", code: "JPY", flagSrc: "/images/flags/japan.png", amount: 1000 },
        { country: "유럽", code: "EUR", flagSrc: "/images/flags/eu.png", amount: 10 },
      ])
    }

    // Set exchange rate data
    setExchangeRates([
      {
        country: "일본",
        code: "JPY",
        flagSrc: "/images/flags/japan.png",
        rate: "961.32원",
        change: "+2.3",
        percentage: "0.24%",
        isPositive: true,
      },
      {
        country: "유럽",
        code: "EUR",
        flagSrc: "/images/flags/eu.png",
        rate: "1,565.66원",
        change: "+3.67",
        percentage: "0.23%",
        isPositive: true,
      },
      {
        country: "미국",
        code: "USD",
        flagSrc: "/images/flags/usa.png",
        rate: "1,393.0원",
        change: "+2.9",
        percentage: "0.21%",
        isPositive: true,
      },
      {
        country: "중국",
        code: "CNY",
        flagSrc: "/images/flags/china.png",
        rate: "192.45원",
        change: "-0.8",
        percentage: "0.41%",
        isPositive: false,
      },
      {
        country: "베트남",
        code: "VND",
        flagSrc: "/images/flags/vietnam.png",
        rate: "0.056원",
        change: "+0.001",
        percentage: "0.18%",
        isPositive: true,
      },
      {
        country: "인도",
        code: "INR",
        flagSrc: "/images/flags/india.png",
        rate: "16.72원",
        change: "+0.05",
        percentage: "0.30%",
        isPositive: true,
      },
    ])

    // Set up auto-scrolling for the carousel
    const interval = setInterval(() => {
      if (carouselRef.current && !isScrolling) {
        carouselRef.current.scrollLeft += 1

        // Update active card index
        if (carouselRef.current.scrollLeft % 150 === 0) {
          const newIndex = Math.floor(carouselRef.current.scrollLeft / 150) % exchangeRates.length
          setActiveCardIndex(newIndex)
        }

        // Reset to beginning when reaching the end
        if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10) {
          carouselRef.current.scrollLeft = 0
          setActiveCardIndex(0)
        }
      }
    }, 30)

    return () => clearInterval(interval)
  }, [router, isScrolling, exchangeRates.length])

  const handleCharge = () => {
    // Simulate charging the wallet
    localStorage.setItem("hasChargedWallet", "true")
    setHasWallet(true)
    setWalletBalances([
      { country: "대한민국", code: "KRW", flagSrc: "/images/flags/korea.png", amount: 10000 },
      { country: "중국", code: "CNY", flagSrc: "/images/flags/china.png", amount: 50 },
      { country: "인도", code: "INR", flagSrc: "/images/flags/india.png", amount: 800 },
      { country: "일본", code: "JPY", flagSrc: "/images/flags/japan.png", amount: 1000 },
      { country: "유럽", code: "EUR", flagSrc: "/images/flags/eu.png", amount: 10 },
    ])
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
              href="/wallet/history?currency=전체통화"
              className="group rounded-full bg-gray-50 p-2 transition-all duration-300 hover:bg-blue-50"
            >
              <ChevronRight className="h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-blue-500" />
            </Link>
          </div>

          {hasWallet ? (
            <div className="mt-4 space-y-3">
              {walletBalances.map((balance, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between border-b border-gray-100 pb-3 transition-all duration-300 hover:translate-x-1"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
                      <Image src={balance.flagSrc || "/placeholder.svg"} alt={balance.country} width={40} height={40} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        {balance.country} {balance.code}
                      </p>
                      <p className="text-lg font-bold text-gray-800">{balance.amount.toLocaleString()}</p>
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
            <button className="group relative flex-1 overflow-hidden rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-4 text-center font-medium text-white shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] transition-all duration-300 hover:shadow-[0_6px_10px_-1px_rgba(77,169,255,0.4),0_2px_6px_-2px_rgba(77,169,255,0.3)] active:translate-y-0.5 active:shadow-[0_2px_4px_-1px_rgba(77,169,255,0.3),0_1px_2px_-1px_rgba(77,169,255,0.2)]">
              <span className="relative z-10">송금하기</span>
              <div className="absolute inset-0 -left-full h-full w-full translate-x-0 bg-white opacity-20 transition-transform duration-300 group-hover:translate-x-full"></div>
            </button>
            <button
              className="group relative flex-1 overflow-hidden rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-4 text-center font-medium text-white shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] transition-all duration-300 hover:shadow-[0_6px_10px_-1px_rgba(77,169,255,0.4),0_2px_6px_-2px_rgba(77,169,255,0.3)] active:translate-y-0.5 active:shadow-[0_2px_4px_-1px_rgba(77,169,255,0.3),0_1px_2px_-1px_rgba(77,169,255,0.2)]"
              onClick={handleCharge}
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
              d="M0,0 C300,30 600,0 900,20 C1000,30 1100,15 1200,0 L1200,30 L0,30 Z"
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
                className="group min-w-[150px] rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="mb-3 flex items-center space-x-2">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
                    <Image src={rate.flagSrc || "/placeholder.svg"} alt={rate.country} width={32} height={32} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{rate.country}</p>
                    <p className="text-xs text-gray-500">{rate.code}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-800">{rate.rate}</p>
                <div
                  className={`mt-1 flex items-center ${
                    rate.isPositive ? "text-green-500" : "text-red-500"
                  } text-xs font-medium`}
                >
                  {rate.isPositive ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {rate.change} ({rate.percentage})
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
              className={`group flex flex-1 flex-col items-center justify-center py-3 ${
                pathname === item.path ? "text-[#0DAEFF]" : "text-gray-500"
              }`}
            >
              {item.name === "더 보기" ? (
                <MoreHorizontal className="h-8 w-8" />
              ) : (
                <div className="relative h-8 w-8">
                  <Image
                    src={item.icon || "/placeholder.svg"}
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
    </div>
  )
}
