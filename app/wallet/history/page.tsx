"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronDown, Filter, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import FilterModal from "@/components/filter-modal"
import type { TransactionType, DateRangeType, Transaction, WalletInfo, FilterOptions } from "@/types"

export default function TransactionHistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currencyParam = searchParams.get("currency")

  // State setup
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(currencyParam || "전체통화")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>("전체기간")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [transactionType, setTransactionType] = useState<TransactionType>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const [filteredTransactions, setFilteredTransactions] = useState<Record<string, Transaction[]>>({})
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null)

  const contentRef = useRef<HTMLDivElement>(null)

  // Get currency symbol
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

  // Get country name
  const getCountryName = (currency: string) => {
    const countries: Record<string, string> = {
      KRW: "대한민국",
      USD: "미국",
      EUR: "유럽",
      JPY: "일본",
      CNY: "중국",
      VND: "베트남",
      INR: "인도",
    }
    return countries[currency] || ""
  }

  // Get wallet info
  const getWalletInfo = (currency: string): WalletInfo | null => {
    if (currency === "전체통화") return null

    const walletInfo: Record<string, { country: string; flagSrc: string; amount: number }> = {
      KRW: { country: "대한민국", flagSrc: "/images/flags/korea.png", amount: 10000 },
      USD: { country: "미국", flagSrc: "/images/flags/usa.png", amount: 50 },
      EUR: { country: "유럽", flagSrc: "/images/flags/eu.png", amount: 20 },
      JPY: { country: "일본", flagSrc: "/images/flags/japan.png", amount: 5000 },
      CNY: { country: "중국", flagSrc: "/images/flags/china.png", amount: 200 },
      VND: { country: "베트남", flagSrc: "/images/flags/vietnam.png", amount: 500000 },
      INR: { country: "인도", flagSrc: "/images/flags/india.png", amount: 2000 },
    }

    const selected = walletInfo[currency]
    if (selected) {
      return {
        country: selected.country,
        code: currency,
        flagSrc: selected.flagSrc,
        amount: selected.amount,
      }
    }
    return null
  }

  // Replace the generateTransactions function with this updated version
  const generateTransactions = (specificCurrency?: string): Record<string, Transaction[]> => {
    const transactions: Record<string, Transaction[]> = {}
    const currencies = ["KRW", "USD", "EUR", "JPY", "CNY", "VND", "INR"]
    const flagMap: Record<string, string> = {
      KRW: "/images/flags/korea.png",
      USD: "/images/flags/usa.png",
      EUR: "/images/flags/eu.png",
      JPY: "/images/flags/japan.png",
      CNY: "/images/flags/china.png",
      VND: "/images/flags/vietnam.png",
      INR: "/images/flags/india.png",
    }

    // 2025.04.28 날짜 생성
    const apr28 = new Date(2025, 3, 28)
    const apr28Str = `${apr28.getFullYear()}.${String(apr28.getMonth() + 1).padStart(2, "0")}.${String(
      apr28.getDate(),
    ).padStart(2, "0")}`

    // KRW 거래 내역
    if (!specificCurrency || specificCurrency === "KRW" || specificCurrency === "전체통화") {
      if (!transactions[apr28Str]) {
        transactions[apr28Str] = []
      }
      transactions[apr28Str].push({
        id: `transaction-${apr28Str}-3`,
        date: apr28Str,
        type: "transfer",
        currency: "KRW",
        amount: "- ₩ 1,429",
        isPositive: false,
        description: "이영희에게 송금",
        flagSrc: flagMap["KRW"],
        fromCurrency: "KRW",
        fromAmount: "1,429 KRW",
      })
    }

    // USD 거래 내역
    if (!specificCurrency || specificCurrency === "USD" || specificCurrency === "전체통화") {
      if (!transactions[apr28Str]) {
        transactions[apr28Str] = []
      }
      transactions[apr28Str].push({
        id: `transaction-${apr28Str}-4`,
        date: apr28Str,
        type: "charge",
        currency: "USD",
        amount: "+ $ 1",
        isPositive: true,
        description: "충전",
        flagSrc: flagMap["USD"],
        toCurrency: "USD",
        toAmount: "1 USD",
      })
    }

    // 추가 거래 내역 생성
    for (let i = 0; i < 10; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i - 2) // 최근 날짜는 이미 생성했으므로 그 이전 날짜부터
      const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
        date.getDate(),
      ).padStart(2, "0")}`

      // 각 날짜마다 0~3개의 거래 내역 생성
      const transactionCount = Math.floor(Math.random() * 3)
      if (transactionCount > 0) {
        transactions[dateStr] = transactions[dateStr] || []

        for (let j = 0; j < transactionCount; j++) {
          // 환전 제외, 송금과 충전만 생성
          const transactionTypes: TransactionType[] = ["transfer", "charge"]
          const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]

          // 유효한 통화만 사용
          let currency
          if (specificCurrency && specificCurrency !== "전체통화") {
            currency = specificCurrency
          } else {
            // 유효한 통화 목록에서만 선택
            const validCurrencies = ["KRW", "USD", "EUR", "JPY", "CNY", "VND", "INR"]
            currency = validCurrencies[Math.floor(Math.random() * validCurrencies.length)]
          }

          const amount = Math.floor(Math.random() * 1000) + 50
          const isPositive = type === "charge"
          const symbol = getCurrencySymbol(currency)
          const displayAmount = `${isPositive ? "+ " : "- "}${symbol} ${amount}`

          transactions[dateStr].push({
            id: `transaction-${dateStr}-${j}`,
            date: dateStr,
            type,
            currency,
            amount: displayAmount,
            isPositive,
            description: type === "charge" ? "충전" : "홍길동에게 송금",
            flagSrc: flagMap[currency],
            fromCurrency: isPositive ? "" : currency,
            toCurrency: isPositive ? currency : "",
            fromAmount: isPositive ? "" : `${amount} ${currency}`,
            toAmount: isPositive ? `${amount} ${currency}` : "",
          })
        }

        // Remove empty dates
        if (transactions[dateStr].length === 0) {
          delete transactions[dateStr]
        }
      }
    }

    return transactions
  }

  // Update the getTransactionTypeText function to remove the exchange option
  const getTransactionTypeText = (type: TransactionType) => {
    const typeTexts: Record<TransactionType, string> = {
      transfer: "송금",
      charge: "충전",
      all: "전체",
    }
    return typeTexts[type]
  }

  // Initialize on mount
  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (typeof window !== "undefined" && !isLoggedIn) {
      router.push("/")
      return
    }

    // Set selected currency from URL
    if (currencyParam) {
      setSelectedCurrency(currencyParam)
    }

    // Set selected wallet
    setSelectedWallet(getWalletInfo(currencyParam || "전체통화"))

    // Apply initial filters
    applyFilters()
  }, [])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [selectedCurrency, dateRangeType, startDate, endDate, transactionType])

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
      setTimeout(() => {
        applyFilters() // Refresh data
        setIsRefreshing(false)
      }, 1000)
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
    setSelectedWallet(getWalletInfo(currency))
    setIsDropdownOpen(false)

    // Update URL
    if (currency === "전체통화") {
      router.push("/wallet/history")
    } else {
      router.push(`/wallet/history?currency=${currency}`)
    }
  }

  const toggleFilterModal = () => {
    setShowFilterModal(!showFilterModal)
  }

  // Handle charge button click
  const handleCharge = () => {
    // If a specific currency is selected, pass it to the charge page
    if (selectedCurrency !== "전체통화") {
      router.push(`/wallet/charge?currency=${selectedCurrency}`)
    } else {
      // For "전체통화" view, just go to charge page without currency
      // The charge page will show currency selection
      router.push("/wallet/charge")
    }
  }

  // Handle transfer button click
  const handleTransfer = () => {
    // If a specific currency is selected, pass it to the transfer page
    if (selectedCurrency !== "전체통화") {
      router.push(`/wallet/transfer?currency=${selectedCurrency}`)
    } else {
      // For "전체통화" view, go to transfer page without currency
      router.push("/wallet/transfer")
    }
  }

  // Handle refund button click
  const handleRefund = () => {
    // If a specific currency is selected, pass it to the refund page
    if (selectedCurrency !== "전체통화") {
      router.push(`/wallet/refund?currency=${selectedCurrency}`)
    } else {
      // For "전체통화" view, go to refund page without currency
      // The refund page will show currency selection
      router.push("/wallet/refund")
    }
  }

  // Filter application logic
  const applyFilters = () => {
    // Generate fresh transactions data
    const allTransactions = generateTransactions(selectedCurrency !== "전체통화" ? selectedCurrency : undefined)

    let filtered = { ...allTransactions }

    // Filter by date range
    if (dateRangeType === "지정기간" && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include the end date fully

      const newFiltered: Record<string, Transaction[]> = {}

      Object.entries(filtered).forEach(([date, dateTransactions]) => {
        const transactionDate = new Date(date.replace(/\./g, "-"))
        if (transactionDate >= start && transactionDate <= end) {
          newFiltered[date] = dateTransactions
        }
      })

      filtered = newFiltered
    }

    // Filter by transaction type
    if (transactionType !== "all") {
      const newFiltered: Record<string, Transaction[]> = {}

      Object.entries(filtered).forEach(([date, dateTransactions]) => {
        const filteredTransactions = dateTransactions.filter((transaction) => transaction.type === transactionType)

        if (filteredTransactions.length > 0) {
          newFiltered[date] = filteredTransactions
        }
      })

      filtered = newFiltered
    }

    setFilteredTransactions(filtered)
  }

  // Filter apply handler from modal
  const handleApplyFilters = (filters: FilterOptions) => {
    setDateRangeType(filters.dateRangeType)
    setStartDate(filters.startDate)
    setEndDate(filters.endDate)
    setTransactionType(filters.transactionType)
    setShowFilterModal(false)
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
          <div className="flex items-center space-x-1 font-medium" onClick={toggleDropdown}>
            <span>{selectedWallet ? `${selectedWallet.country} ${selectedWallet.code}` : "전체통화"}</span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Display balance if specific currency is selected */}
        {selectedWallet && (
          <>
            <div className="mt-2 text-3xl font-bold">
              {getCurrencySymbol(selectedWallet.code)} {selectedWallet.amount.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              지갑번호: {Math.floor(Math.random() * 900000) + 100000}-{Math.floor(Math.random() * 900000) + 100000}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex w-full max-w-md justify-around px-4">
          <div className="flex flex-col items-center">
            <button
              onClick={handleCharge}
              className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md"
            >
              <span className="text-2xl font-bold text-white">+</span>
            </button>
            <span className="text-sm font-medium text-gray-700">충전</span>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={handleTransfer}
              className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md"
            >
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
            </button>
            <span className="text-sm font-medium text-gray-700">송금</span>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={handleRefund}
              className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-md"
            >
              <RefreshCw size={20} className="text-white" />
            </button>
            <span className="text-sm font-medium text-gray-700">환불</span>
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
                className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50"
              >
                전체통화
              </button>
            </li>
            {["KRW", "USD", "EUR", "JPY", "CNY", "VND", "INR"].map((currency) => (
              <li key={currency}>
                <button
                  onClick={() => selectCurrency(currency)}
                  className="flex w-full items-center px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="mr-2 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-gray-200">
                    <Image
                      src={`/images/flags/${
                        currency === "KRW"
                          ? "korea"
                          : currency === "USD"
                            ? "usa"
                            : currency === "EUR"
                              ? "eu"
                              : currency === "JPY"
                                ? "japan"
                                : currency === "CNY"
                                  ? "china"
                                  : currency === "VND"
                                    ? "vietnam"
                                    : "india"
                      }.png`}
                      alt={currency}
                      width={24}
                      height={24}
                    />
                  </div>
                  {getCountryName(currency)} {currency}
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
            {getTransactionTypeText(transactionType)}
          </span>
          <ChevronDown size={16} onClick={toggleFilterModal} />
        </div>
        <button onClick={toggleFilterModal}>
          <Filter size={18} className="text-gray-600" />
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
          Object.entries(filteredTransactions)
            .sort(
              ([dateA], [dateB]) =>
                new Date(dateB.replace(/\./g, "-")).getTime() - new Date(dateA.replace(/\./g, "-")).getTime(),
            )
            .map(([date, dateTransactions]) => (
              <div key={date} className="mb-4">
                {/* Date header */}
                <div className="bg-gray-100 px-4 py-2 text-sm text-gray-500">{date}</div>

                {/* Transactions for this date */}
                <div className="bg-white">
                  {dateTransactions.map((transaction) => (
                    <div key={transaction.id} className="border-b border-gray-100 px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-3 flex items-center">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-100">
                              <Image
                                src={transaction.flagSrc || "/placeholder.svg"}
                                alt={transaction.currency || transaction.toCurrency || ""}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              {transaction.currency && getCountryName(transaction.currency)}{" "}
                              {transaction.currency || transaction.toCurrency}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-right font-medium ${
                            transaction.isPositive ? "text-blue-500" : "text-gray-700"
                          }`}
                        >
                          {transaction.amount ||
                            (transaction.isPositive ? `+ ${transaction.toAmount}` : `- ${transaction.fromAmount}`)}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm text-gray-500">{transaction.description}</span>
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
