"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ChevronLeft, X, AlertCircle, Delete } from "lucide-react"
import ModalPortal from "@/components/modal-portal"
import { getValidToken } from "@/lib/auth"
import { mapCurrencyToFlag } from "@/lib/utils"

// 타입 정의
interface CurrencyInfo {
  code: string
  country: string
  flagSrc: string
  amount: number
  walletNumber: string
}

interface RecipientInfo {
  name: string
  walletNumber: string
  currencyCode: string
}

export default function QrPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCurrency = searchParams.get("currency")
  const walletNumberParam = searchParams.get("walletNumber")
  const recipientNameParam = searchParams.get("recipientName")

  // 상태
  const [step, setStep] = useState<number>(0)
  const [amount, setAmount] = useState<string>("")
  const [pin, setPin] = useState<string>("")
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [amountError, setAmountError] = useState<string>("")
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo | null>(null)
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null)

  // 지갑 정보 불러오기
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const token = await getValidToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/all`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        const result = await response.json();
        if (!result.result) return;
        const walletInfos: CurrencyInfo[] = result.result.map((wallet: Record<string, unknown>) => ({
          country: String(wallet.currencyName || wallet.currencyCode),
          code: String(wallet.currencyCode),
          flagSrc: `/images/flags/${mapCurrencyToFlag(String(wallet.currencyCode))}`,
          amount: Number(wallet.balance),
          walletNumber: String(wallet.walletNumber)
        }));
        if (preselectedCurrency && walletInfos.length > 0) {
          const currency = walletInfos.find((c) => c.code === preselectedCurrency);
          if (currency) setSelectedCurrency(currency);
        }
        if (walletNumberParam && recipientNameParam && preselectedCurrency) {
          setRecipientInfo({
            name: recipientNameParam,
            walletNumber: walletNumberParam,
            currencyCode: preselectedCurrency,
          });
        }
      } catch {}
    }
    fetchWallets();
  }, [preselectedCurrency, walletNumberParam, recipientNameParam])

  // 금액 유효성 검사
  useEffect(() => { validateAmount() }, [amount, selectedCurrency])
  const validateAmount = () => {
    if (!amount || !selectedCurrency) { setAmountError(""); return true; }
    const numAmount = Number.parseInt(amount, 10)
    if (isNaN(numAmount)) { setAmountError("유효한 금액을 입력해주세요."); return false; }
    if (numAmount <= 0) { setAmountError("결제 금액은 0보다 커야 합니다."); return false; }
    if (numAmount > selectedCurrency.amount) { setAmountError(`결제 가능한 금액은 ${selectedCurrency.amount.toLocaleString()} ${selectedCurrency.code}입니다.`); return false; }
    setAmountError(""); return true;
  }

  // 금액 입력
  const handleAmountInput = (value: string) => {
    if (value === "backspace") { setAmount((prev) => prev.slice(0, -1)); return; }
    if (value === "00") { if (amount === "") return; setAmount((prev) => prev + "00"); return; }
    setAmount((prev) => prev + value);
  }

  // PIN 입력
  const handlePinInput = (value: string) => {
    if (value === "backspace") { setPin((prev) => prev.slice(0, -1)); return; }
    if (pin.length < 6) { setPin((prev) => prev + value); }
  }

  // 결제 진행 (실제 API는 더미)
  const handleNext = async () => {
    if (step === 0 && amount && validateAmount()) {
      setStep(1);
    } else if (step === 1 && pin.length === 6) {
      // 실제 결제 API 호출 대신 성공 처리
      setShowSuccessModal(true);
      setTimeout(() => { router.push("/home"); }, 2000);
    }
  }

  // 금액 포맷
  const formatCurrency = (value: string, code: string) => {
    const numValue = Number.parseInt(value, 10)
    if (isNaN(numValue)) return `0 ${code}`
    return `${numValue.toLocaleString()} ${code}`
  }

  // 결제 입력 화면
  const renderAmountInput = () => (
    <>
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={() => router.back()} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">QR 결제</h1>
        <div className="w-6"></div>
      </header>
      <div className="p-4 bg-white flex-1">
        {recipientInfo && selectedCurrency && (
          <>
            <h2 className="text-xl font-medium mb-4">{recipientInfo.name} 님에게 결제</h2>
            <div className="flex items-center mb-4">
              <div className="relative h-6 w-6 overflow-hidden rounded-full mr-2">
                <Image src={selectedCurrency.flagSrc || "/images/flags/korea.png"} alt={selectedCurrency.country} width={24} height={24} className="object-cover" />
              </div>
              <span className="text-sm text-gray-600">{selectedCurrency.country} {selectedCurrency.code}</span>
            </div>
            <div className="text-sm text-gray-600 mb-6">결제 가능 금액: {selectedCurrency.amount.toLocaleString()} {selectedCurrency.code}</div>
            <div className="flex items-center justify-between mb-6">
              <div className="text-3xl font-bold">{amount ? formatCurrency(amount, selectedCurrency.code) : `0 ${selectedCurrency.code}`}</div>
              {amount && (
                <button onClick={() => setAmount("")} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              )}
            </div>
            {amountError && (
              <div className="mb-4 flex items-center text-red-500 text-sm"><AlertCircle size={16} className="mr-1" />{amountError}</div>
            )}
          </>
        )}
      </div>
      <div className="mt-auto">
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
              className="py-5 text-center text-xl font-medium border-t border-r border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleNext}
            disabled={!amount || !!amountError}
            className={`w-full py-4 rounded-full text-center text-white font-medium text-lg ${amount && !amountError ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] cursor-pointer" : "bg-gray-300 cursor-not-allowed"}`}
          >
            다음
          </button>
        </div>
      </div>
    </>
  )

  // PIN 입력 화면
  const renderPinInput = () => (
    <>
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={() => setStep(0)} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">암호 입력</h1>
        <div className="w-6"></div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-center text-xl font-medium">모아모아 암호를 입력해 주세요.</h2>
          <div className="flex justify-center space-x-3 py-4">
            {Array(6).fill(0).map((_, index) => (
              <div key={index} className={`h-4 w-4 rounded-full ${index < pin.length ? "bg-[#0DAEFF]" : "bg-gray-200"}`}></div>
            ))}
          </div>
        </div>
        <div className="mt-8 w-full">
          <div className="grid grid-cols-3 gap-4">
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
              { key: "", label: "" },
              { key: "0", label: "0" },
              { key: "backspace", label: "←" },
            ].map((item, index) => {
              if (item.key === "") return <div key={index} className="h-14"></div>
              if (item.key === "backspace") {
                return (
                  <button key={index} type="button" className="flex h-14 w-full items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer" onClick={() => handlePinInput("backspace")}> <Delete size={24} /> </button>
                )
              }
              return (
                <button key={index} type="button" className="flex h-14 w-full items-center justify-center rounded-full text-2xl font-medium text-gray-800 hover:bg-gray-100" onClick={() => handlePinInput(item.key)}>{item.label}</button>
              )
            })}
          </div>
        </div>
      </div>
      {pin.length === 6 && (
        <div className="p-4">
          <button onClick={handleNext} className="h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-center text-lg font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8] cursor-pointer">확인</button>
        </div>
      )}
    </>
  )

  // 결제 완료 모달
  const renderSuccessModal = () => (
    <ModalPortal>
      <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(2px)" }}>
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-xl">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-400 flex items-center justify-center mx-auto mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">{amount && selectedCurrency ? `${Number.parseInt(amount, 10).toLocaleString()} ${selectedCurrency.code}` : ""}</h2>
              <p className="text-gray-600 mb-8">결제 완료</p>
              <div className="flex justify-between items-center text-left mb-3 px-2">
                <span className="text-gray-500 mr-4">결제 지갑 번호</span>
                <span className="font-medium text-right">{recipientInfo?.walletNumber || ""}</span>
              </div>
              <div className="flex justify-between items-center text-left mb-8 px-2">
                <span className="text-gray-500 mr-4">날짜</span>
                <span className="font-medium text-right">{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <button onClick={() => router.push("/home")} className="w-full py-4 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white font-medium rounded-full text-lg cursor-pointer">확인</button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {step === 0 && renderAmountInput()}
      {step === 1 && renderPinInput()}
      {showSuccessModal && renderSuccessModal()}
    </div>
  )
}
