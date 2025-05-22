"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, X, ChevronDown, ArrowLeft, Check, Plus, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import ModalPortal from "@/components/modal-portal"

type CurrencyInfo = {
  code: string
  country: string
  flagSrc: string
  chargeUnit: number
}

type BankAccount = {
  bankName: string
  accountNumber: string
  logoSrc: string
  currency: string
}

export default function ChargePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCurrency = searchParams.get("currency")

  // States for multi-step form
  const [step, setStep] = useState<number>(preselectedCurrency ? 1 : 0)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [pin, setPin] = useState<string>("")
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [filteredAccounts, setFilteredAccounts] = useState<BankAccount[]>([])
  const [amountError, setAmountError] = useState<string>("")

  // Available currencies with charge units
  const currencies: CurrencyInfo[] = [
    { code: "VND", country: "베트남", flagSrc: "/images/flags/vietnam.png", chargeUnit: 200000 },
    { code: "JPY", country: "일본", flagSrc: "/images/flags/japan.png", chargeUnit: 1000 },
    { code: "KRW", country: "대한민국", flagSrc: "/images/flags/korea.png", chargeUnit: 10000 },
    { code: "USD", country: "미국", flagSrc: "/images/flags/usa.png", chargeUnit: 10 },
    { code: "CNY", country: "중국", flagSrc: "/images/flags/china.png", chargeUnit: 50 },
    { code: "EUR", country: "유럽", flagSrc: "/images/flags/eu.png", chargeUnit: 10 },
    { code: "INR", country: "인도", flagSrc: "/images/flags/india.png", chargeUnit: 800 },
  ]

  // Load accounts from localStorage on mount
  useEffect(() => {
    const storedAccounts = localStorage.getItem("bankAccounts")
    if (storedAccounts) {
      const parsedAccounts = JSON.parse(storedAccounts)
      setAccounts(parsedAccounts)
    }
  }, [])

  // Set preselected currency if provided in URL
  useEffect(() => {
    if (preselectedCurrency) {
      const currency = currencies.find((c) => c.code === preselectedCurrency)
      if (currency) {
        setSelectedCurrency(currency)
        setStep(1) // Skip to amount input step when currency is preselected
      }
    }
  }, [preselectedCurrency])

  // Filter accounts by selected currency
  useEffect(() => {
    if (selectedCurrency && accounts.length > 0) {
      const filtered = accounts.filter((account) => account.currency === selectedCurrency.code)
      setFilteredAccounts(filtered)

      // If there's only one account for this currency, select it automatically
      if (filtered.length === 1) {
        setSelectedAccount(filtered[0])
      } else {
        setSelectedAccount(null)
      }
    } else {
      setFilteredAccounts([])
      setSelectedAccount(null)
    }
  }, [selectedCurrency, accounts])

  // Validate amount whenever it changes
  useEffect(() => {
    validateAmount()
  }, [amount, selectedCurrency])

  // Filter currencies based on search query
  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      currency.country.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle currency selection
  const handleSelectCurrency = (currency: CurrencyInfo) => {
    setSelectedCurrency(currency)
    setStep(1)
    setAmount("")
    setAmountError("")
  }

  // Validate amount based on currency charge unit
  const validateAmount = () => {
    if (!amount || !selectedCurrency) {
      setAmountError("")
      return true
    }

    const numAmount = Number.parseInt(amount, 10)
    if (isNaN(numAmount)) {
      setAmountError("유효한 금액을 입력해주세요.")
      return false
    }

    if (numAmount % selectedCurrency.chargeUnit !== 0) {
      setAmountError(`충전 단위는 ${selectedCurrency.chargeUnit.toLocaleString()} ${selectedCurrency.code}입니다.`)
      return false
    }

    setAmountError("")
    return true
  }

  // Handle amount input
  const handleAmountInput = (value: string) => {
    if (value === "backspace") {
      setAmount((prev) => prev.slice(0, -1))
      return
    }

    if (value === "00") {
      if (amount === "") return
      setAmount((prev) => prev + "00")
      return
    }

    setAmount((prev) => prev + value)
  }

  // Handle PIN input
  const handlePinInput = (value: string) => {
    if (value === "backspace") {
      setPin((prev) => prev.slice(0, -1))
      return
    }

    if (pin.length < 6) {
      setPin((prev) => prev + value)
    }
  }

  // Handle next step in charge process
  const handleNext = () => {
    if (step === 1 && amount && selectedAccount && validateAmount()) {
      setStep(2)
    } else if (step === 2 && pin.length === 6) {
      // Show success modal
      setShowSuccessModal(true)

      // After 2 seconds, redirect to home
      setTimeout(() => {
        // Update local storage to indicate wallet has been charged
        localStorage.setItem("hasChargedWallet", "true")

        // Add or update the wallet balance
        const walletBalances = JSON.parse(localStorage.getItem("walletBalances") || "[]")
        const existingWalletIndex = walletBalances.findIndex((wallet: any) => wallet.code === selectedCurrency?.code)

        if (existingWalletIndex >= 0) {
          // Update existing wallet
          walletBalances[existingWalletIndex].amount += Number.parseInt(amount)
        } else if (selectedCurrency) {
          // Add new wallet
          walletBalances.push({
            country: selectedCurrency.country,
            code: selectedCurrency.code,
            flagSrc: selectedCurrency.flagSrc,
            amount: Number.parseInt(amount),
          })
        }

        localStorage.setItem("walletBalances", JSON.stringify(walletBalances))

        router.push("/home")
      }, 2000)
    }
  }

  // Handle adding a new account
  const handleAddAccount = () => {
    if (!selectedCurrency) return

    // Navigate to account registration page with currency and amount (if available)
    const amountParam = amount && !amountError ? `&amount=${amount}` : ""
    router.push(
      `/wallet/charge/account-registration?returnUrl=${encodeURIComponent("/wallet/charge")}&currency=${
        selectedCurrency.code
      }${amountParam}`,
    )
  }

  // Handle selecting an account
  const handleSelectAccount = (account: BankAccount) => {
    setSelectedAccount(account)
    setShowAccountModal(false)
  }

  // Format currency for display
  const formatCurrency = (value: string, code: string) => {
    const numValue = Number.parseInt(value, 10)
    if (isNaN(numValue)) return `0 ${code}`
    return `${numValue.toLocaleString()} ${code}`
  }

  // Render currency selection step
  const renderCurrencySelection = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={() => router.back()} className="text-gray-700">
          <ChevronLeft size={24} />
        </button>
      </header>

      <div className="p-4">
        <div className="relative mb-4">
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-400 mr-2"
            >
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="국가명 또는 통화 코드 검색"
              className="bg-transparent w-full outline-none text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredCurrencies.map((currency) => (
            <button
              key={currency.code}
              className="flex items-center w-full py-3"
              onClick={() => handleSelectCurrency(currency)}
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full mr-3">
                <Image
                  src={currency.flagSrc || "/placeholder.svg"}
                  alt={currency.country}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {currency.country} {currency.code}
                </span>
                <span className="text-xs text-gray-500">
                  충전 단위: {currency.chargeUnit.toLocaleString()} {currency.code}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Render amount input step
  const renderAmountInput = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={() => (preselectedCurrency ? router.back() : setStep(0))} className="text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">충전하기</h1>
        <div className="w-6"></div>
      </header>

      <div className="p-4">
        {selectedCurrency && (
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="relative h-8 w-8 overflow-hidden rounded-full mr-3">
                <Image
                  src={selectedCurrency.flagSrc || "/placeholder.svg"}
                  alt={selectedCurrency.country}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <div>
                <span className="font-medium">
                  {selectedCurrency.country} {selectedCurrency.code}
                </span>
                <div className="text-xs text-gray-500">
                  충전 단위: {selectedCurrency.chargeUnit.toLocaleString()} {selectedCurrency.code}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {amount ? formatCurrency(amount, selectedCurrency.code) : `0 ${selectedCurrency.code}`}
              </div>
              {amount && (
                <button onClick={() => setAmount("")} className="text-gray-400">
                  <X size={20} />
                </button>
              )}
            </div>

            {amountError && (
              <div className="mt-2 flex items-center text-red-500 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {amountError}
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-sm text-gray-600 mb-2">출금 계좌 선택</h3>
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center justify-between w-full border border-gray-300 rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            {selectedAccount ? (
              <>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-white">
                    <Image
                      src={selectedAccount.logoSrc || "/placeholder.svg"}
                      alt={selectedAccount.bankName}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="font-medium">{selectedAccount.bankName}</div>
                    <div className="text-gray-500 text-sm">{selectedAccount.accountNumber}</div>
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </>
            ) : (
              <span className="text-gray-500 w-full text-center">
                출금할 수 있는 계좌가 없습니다. 계좌를 추가해주세요.
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="mt-auto">
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">최종 충전액</span>
            <span className="font-bold text-blue-500">
              {amount ? formatCurrency(amount, selectedCurrency?.code || "") : `0 ${selectedCurrency?.code || ""}`}
            </span>
          </div>
        </div>

        {/* Numeric keypad for amount input */}
        <div className="grid grid-cols-3 bg-white">
          {[
            { key: "1", label: "1" },
            { key: "2", label: "2" },
            { key: "3", label: "3" },
            { key: "4", label: "4" },
            { key: "5", label: "5" },
            { key: "6", label: "6" },
            { key: "7", label: "7" },
            { key: "8", label: "8" },
            { key: "9", label: "9" },
            { key: "00", label: "00" },
            { key: "0", label: "0" },
            { key: "backspace", label: "←" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleAmountInput(item.key)}
              className="py-5 text-center text-xl font-medium border-t border-r border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Next button */}
        <div className="p-4 bg-white border-t border-gray-200">
          {selectedAccount ? (
            <button
              onClick={handleNext}
              disabled={!amount || !!amountError}
              className={`w-full py-4 rounded-full text-center text-white font-medium text-lg ${
                amount && !amountError ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              다음
            </button>
          ) : (
            <button
              onClick={handleAddAccount}
              disabled={!amount || !!amountError}
              className={`w-full py-4 rounded-full text-center text-white font-medium text-lg ${
                amount && !amountError ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              계좌 추가하기
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // Render PIN input step
  const renderPinInput = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={() => setStep(1)} className="text-gray-700">
          <ArrowLeft size={24} />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-medium mb-2">모아모아 암호 입력</h2>
        <p className="text-gray-500 mb-6">6자리의 모아모아 암호를 입력해주세요.</p>

        <div className="flex space-x-3 mb-8">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < pin.length ? "bg-blue-500" : "bg-gray-300"}`} />
            ))}
        </div>

        <div className="grid grid-cols-3 gap-8 w-full max-w-xs">
          {["4", "7", "3", "8", "6", "9", "0", "5", "1", "", "2", "backspace"].map((key, index) => (
            <button
              key={index}
              onClick={() => key && handlePinInput(key)}
              className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-medium ${
                key ? "hover:bg-gray-100" : ""
              }`}
              disabled={!key}
            >
              {key === "backspace" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L2 12L12 22M22 12H4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </div>

      {pin.length === 6 && (
        <div className="p-4">
          <button onClick={handleNext} className="w-full py-4 bg-blue-500 text-white font-medium rounded-full text-lg">
            확인
          </button>
        </div>
      )}
    </div>
  )

  // Render success modal
  const renderSuccessModal = () => (
    <ModalPortal>
      <style jsx global>{`
        body {
          overflow: hidden;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div
        className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center"
        style={{
          animation: "fadeIn 0.3s ease-out",
        }}
      >
        <button onClick={() => router.push("/home")} className="absolute top-4 right-4">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-6">
            <Check size={32} className="text-white" />
          </div>

          <h2 className="text-xl font-medium mb-2">충전 완료</h2>
          <p className="text-lg font-bold">{amount ? formatCurrency(amount, selectedCurrency?.code || "") : ""}</p>
        </div>
      </div>
    </ModalPortal>
  )

  // Render account selection modal
  const renderAccountModal = () => (
    <ModalPortal>
      <style jsx global>{`
        body {
          overflow: hidden;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(2px)",
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={() => setShowAccountModal(false)}
      >
        <div
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl bg-white p-6 shadow-xl"
          style={{
            animation: "slideUp 0.3s ease-out",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-6">출금 계좌 선택</h2>

          {filteredAccounts.length > 0 && (
            <div className="space-y-4 mb-6">
              {filteredAccounts.map((account, index) => (
                <button
                  key={index}
                  className="flex items-center w-full p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => handleSelectAccount(account)}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-white">
                    <Image
                      src={account.logoSrc || "/placeholder.svg"}
                      alt={account.bankName}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center">
                      <span className="font-medium">{account.bankName}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded-full">주계좌</span>
                    </div>
                    <div className="text-gray-500">{account.accountNumber}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleAddAccount}
            className="w-full py-4 bg-blue-500 text-white font-medium rounded-full flex items-center justify-center text-lg"
          >
            <Plus size={20} className="mr-2" />
            계좌 추가
          </button>

          <button
            onClick={() => setShowAccountModal(false)}
            className="w-full py-4 mt-3 border border-gray-300 text-gray-700 font-medium rounded-full text-lg"
          >
            취소
          </button>
        </div>
      </div>
    </ModalPortal>
  )

  // Render the current step
  const renderStep = () => {
    switch (step) {
      case 0:
        return renderCurrencySelection()
      case 1:
        return renderAmountInput()
      case 2:
        return renderPinInput()
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {renderStep()}
      {showSuccessModal && renderSuccessModal()}
      {showAccountModal && renderAccountModal()}
    </div>
  )
}
