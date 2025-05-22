"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronDown, ArrowRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import FilterModal from "@/components/filter-modal"

type TransactionType = "exchange" | "transfer" | "charge" | "all"
type DateRangeType = "전체기간" | "지정기간"

interface Transaction {
  id: string
  date: string
  type: TransactionType
  fromCurrency: string
  toCurrency: string
  fromAmount: string
  toAmount: string
  isPositive: boolean
  description: string
  flagSrc?: string
}

interface WalletInfo {
  country: string
  code: string
  flagSrc: string
  amount: number
}

export default function TransactionHistoryPage() {
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState("KRW")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const [allTransactions, setAllTransactions] = useState<Record<string, Transaction[]>>({})
  const [filteredTransactions, setFilteredTransactions] = useState<Record<string, Transaction[]>>({})
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>("전체기간")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [transactionType, setTransactionType] = useState<TransactionType>("all")
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo>({
    country: "대한민국",
    code: "KRW",
    flagSrc: "/images/flags/korea.png",
    amount: 1429,
  })
  const contentRef = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (!isLoggedIn) {
      router.push("/")
      return
    }

    // Check for currency query parameter
    const searchParams = new URLSearchParams(window.location.search)
    const currencyParam = searchParams.get("currency")
    if (currencyParam) {
      setSelectedCurrency(currencyParam)
      updateSelectedWallet(currencyParam)
    }

    // Initialize with empty transaction data
    setAllTransactions({})
    setFilteredTransactions({})
  }, [router])

  useEffect(() => {
    applyFilters()
  }, [selectedCurrency, allTransactions])

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY
    const diff = currentY - startY

    if (diff > 50 && contentRef.current && contentRef.current.scrollTop === 0) {
      setIsRefreshing(true)
    }
  }

  const handleTouchEnd = () => {
    if (isRefreshing) {
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // 지갑 정보 업데이트 함수
  const updateSelectedWallet = (currency: string) => {
    if (currency === "전체통화") {
      setSelectedWallet({
        country: "",
        code: "전체 통화",
        flagSrc: "/images/moamoa-logo.png",
        amount: 0,
      })
      return
    }

    const walletInfo: Record<string, { country: string; flagSrc: string; amount: number }> = {
      KRW: { country: "대한민국", flagSrc: "/images/flags/korea.png", amount: 1429 },
      USD: { country: "미국", flagSrc: "/images/flags/usa.png", amount: 50 },
      EUR: { country: "유럽", flagSrc: "/images/flags/eu.png", amount: 20 },
      JPY: { country: "일본", flagSrc: "/images/flags/japan.png", amount: 5000 },
      CNY: { country: "중국", flagSrc: "/images/flags/china.png", amount: 200 },
      VND: { country: "베트남", flagSrc: "/images/flags/vietnam.png", amount: 500000 },
      INR: { country: "인도", flagSrc: "/images/flags/india.png", amount: 2000 },
    }

    const selected = walletInfo[currency]
    if (selected) {
      setSelectedWallet({
        country: selected.country,
        code: currency,
        flagSrc: selected.flagSrc,
        amount: selected.amount,
      })
    }
  }

  const selectCurrency = (currency: string) => {
    setSelectedCurrency(currency)
    setIsDropdownOpen(false)
    updateSelectedWallet(currency)
  }

  const toggleFilterModal = () => {
    setShowFilterModal(!showFilterModal)
  }

  // 필터 적용 함수
  const applyFilters = () => {
    let filtered = { ...allTransactions }

    // Filter by currency
    if (selectedCurrency !== "전체통화") {
      const newFiltered: Record<string, Transaction[]> = {}

      Object.entries(filtered).forEach(([date, transactions]) => {
        const filteredTransactions = transactions.filter(
          (transaction) => transaction.fromCurrency === selectedCurrency || transaction.toCurrency === selectedCurrency,
        )

        if (filteredTransactions.length > 0) {
          newFiltered[date] = filteredTransactions
        }
      })

      filtered = newFiltered
    }

    // Filter by date range
    if (dateRangeType === "지정기간" && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include the end date fully

      const newFiltered: Record<string, Transaction[]> = {}

      Object.entries(filtered).forEach(([date, transactions]) => {
        const transactionDate = new Date(date.replace(/\./g, "-"))
        if (transactionDate >= start && transactionDate <= end) {
          newFiltered[date] = transactions
        }
      })

      filtered = newFiltered
    }

    // Filter by transaction type
    if (transactionType !== "all") {
      const newFiltered: Record<string, Transaction[]> = {}

      Object.entries(filtered).forEach(([date, transactions]) => {
        const filteredTransactions = transactions.filter((transaction) => transaction.type === transactionType)

        if (filteredTransactions.length > 0) {
          newFiltered[date] = filteredTransactions
        }
      })

      filtered = newFiltered
    }

    setFilteredTransactions(filtered)
    setShowFilterModal(false)
  }

  // 필터 적용 핸들러
  const handleApplyFilters = (filters: {
    dateRangeType: DateRangeType
    startDate: string
    endDate: string
    transactionType: TransactionType
  }) => {
    setDateRangeType(filters.dateRangeType)
    setStartDate(filters.startDate)
    setEndDate(filters.endDate)
    setTransactionType(filters.transactionType)

    // 필터 적용 후 필터링 실행
    setTimeout(() => {
      applyFilters()
    }, 0)
  }

  // 통화 기호 가져오기 함수
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      KRW: "₩",
      USD: "$",
      EUR: "€",
      JPY: "¥",
      CNY: "¥",
      VND: "₫",
      INR: "₹",
    }
    return symbols[currency] || ""
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <Link href="/home" className="text-gray-700">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">이용내역</h1>
        <Link href="/wallet/guide" className="text-blue-500">
          안내
        </Link>
      </header>

      {/* Selected Currency Display */}
      <div className="flex flex-col items-center border-b border-gray-200 bg-white py-6">
        <div className="flex items-center space-x-2">
          <div className="relative h-6 w-6 overflow-hidden rounded-full">
            <Image
              src={selectedWallet.flagSrc || "/placeholder.svg"}
              alt={selectedWallet.country}
              width={24}
              height={24}
              className="object-cover"
            />
          </div>
          <div className="flex items-center space-x-1 font-medium" onClick={toggleDropdown}>
            <span>
              {selectedWallet.country} {selectedWallet.code}
            </span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
        {selectedCurrency !== "전체통화" && (
          <div className="mt-2 text-3xl font-bold">
            {getCurrencySymbol(selectedWallet.code)} {selectedWallet.amount.toLocaleString()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex w-full max-w-md justify-around px-4">
          <div className="flex flex-col items-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md">
              <span className="text-2xl font-bold text-white">+</span>
            </div>
            <span className="text-sm font-medium text-gray-700">충전</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M5 12H19M19 12L13 6M19 12L13 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">송금</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md">
              <RefreshCw size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">환불</span>
          </div>
        </div>

        {/* Currency Dropdown */}
        {isDropdownOpen && (
          <div className="absolute left-4 right-4 top-32 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
            <ul>
              <li key="전체통화">
                <button
                  onClick={() => selectCurrency("전체통화")}
                  className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50"
                >
                  전체 통화
                </button>
              </li>
              {["KRW", "USD", "EUR", "JPY", "CNY", "VND", "INR"].map((currency) => (
                <li key={currency}>
                  <button
                    onClick={() => selectCurrency(currency)}
                    className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50"
                  >
                    {currency === "KRW"
                      ? "대한민국 KRW"
                      : currency === "USD"
                        ? "미국 USD"
                        : currency === "EUR"
                          ? "유럽 EUR"
                          : currency === "JPY"
                            ? "일본 JPY"
                            : currency === "CNY"
                              ? "중국 CNY"
                              : currency === "VND"
                                ? "베트남 VND"
                                : currency === "INR"
                                  ? "인도 INR"
                                  : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Filter section */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <span>
            {dateRangeType === "전체기간" ? "전체기간" : `${startDate} ~ ${endDate}`}・
            {transactionType === "all"
              ? "전체"
              : transactionType === "exchange"
                ? "환전"
                : transactionType === "transfer"
                  ? "송금"
                  : "충전"}
          </span>
          <ChevronDown size={16} onClick={toggleFilterModal} />
        </div>
        <button onClick={toggleFilterModal}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 10H15M2.5 5H17.5M7.5 15H12.5"
              stroke="#6B7280"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
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
        {Object.keys(filteredTransactions).length > 0 ? (
          Object.entries(filteredTransactions).map(([date, dateTransactions]) => (
            <div key={date} className="mb-4">
              {/* Date header */}
              <div className="bg-gray-100 px-4 py-2 text-sm text-gray-500">{date}</div>

              {/* Transactions for this date */}
              <div className="bg-white">
                {dateTransactions.map((transaction) => (
                  <div key={transaction.id} className="border-b border-gray-100 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {transaction.type === "transfer" || transaction.type === "charge" ? (
                          <div className="mr-3 flex items-center">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100">
                              <Image
                                src={transaction.flagSrc || "/placeholder.svg"}
                                alt={transaction.toCurrency}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            </div>
                            <span className="ml-2 font-medium">
                              {transaction.toCurrency === "INR"
                                ? "인도 INR"
                                : transaction.toCurrency === "VND"
                                  ? "베트남 VND"
                                  : transaction.toCurrency === "CNY"
                                    ? "중국 CNY"
                                    : transaction.toCurrency === "JPY"
                                      ? "일본 JPY"
                                      : transaction.toCurrency === "EUR"
                                        ? "유럽 EUR"
                                        : transaction.toCurrency === "USD"
                                          ? "미국 USD"
                                          : transaction.toCurrency === "KRW"
                                            ? "한국 KRW"
                                            : transaction.toCurrency}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{transaction.fromCurrency}</span>
                            <ArrowRight size={16} className="text-gray-400" />
                            <span className="font-medium">{transaction.toCurrency}</span>
                            <span className="ml-1 font-medium">환전</span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-right ${
                          transaction.isPositive ? "text-blue-500" : transaction.fromAmount ? "text-gray-700" : ""
                        }`}
                      >
                        {transaction.isPositive ? "+ " : "- "}
                        {transaction.isPositive ? transaction.toAmount : transaction.fromAmount}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-gray-500">{transaction.description}</span>
                      <span className="text-sm text-gray-500">
                        {!transaction.isPositive && transaction.toAmount ? transaction.toAmount : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
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
        )}
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
