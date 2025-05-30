"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, X, AlertCircle, Delete, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import ModalPortal from "@/components/modal-portal"
import { getValidToken } from "@/lib/auth"
import { mapCurrencyToFlag } from "@/lib/utils"

type CurrencyInfo = {
  code: string
  country: string
  flagSrc: string
  amount: number
  walletNumber: string
}

type RecipientInfo = {
  name: string
  walletNumber: string
  currencyCode: string
}

type PointTransferRequestDto = {
  fromWalletNumber: string;
  toWalletNumber: string;
  amount: number;
}

type WalletResponse = {
  currencyCode: string;
  currencyName: string;
  balance: number;
  walletNumber: string;
}

const getCountryName = (code: string): string => {
  const countryMap: Record<string, string> = {
    KRW: "대한민국",
    USD: "미국",
    EUR: "유럽",
    JPY: "일본",
    CNY: "중국",
    INR: "인도",
    VND: "베트남",
  };
  return countryMap[code] || "알수없음";
};

export default function TransferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCurrency = searchParams.get("currency")
  const walletNumberParam = searchParams.get("walletNumber")
  const recipientNameParam = searchParams.get("recipientName")
  const skipFirstStep = searchParams.get("skipFirstStep") === "true"

  // States for multi-step form
  const [step, setStep] = useState<number>(skipFirstStep ? 1 : 0)
  const [walletNumber, setWalletNumber] = useState<string>(walletNumberParam || "")
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [pin, setPin] = useState<string>("")
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const [amountError, setAmountError] = useState<string>("")
  const [walletBalances, setWalletBalances] = useState<CurrencyInfo[]>([])
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [walletError, setWalletError] = useState<string>("")
  const [showCurrencyModal, setShowCurrencyModal] = useState<boolean>(false)

  // Load wallet balances and set initial data
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

        if (!response.ok) {
          throw new Error('Failed to fetch wallets');
        }

        const result = await response.json();
        if (!result.result) {
          throw new Error('Invalid response format');
        }

        const walletInfos: CurrencyInfo[] = result.result.map((wallet: WalletResponse) => ({
          country: getCountryName(wallet.currencyCode),
          code: wallet.currencyCode,
          flagSrc: `/images/flags/${mapCurrencyToFlag(wallet.currencyCode)}`,
          amount: Number(wallet.balance),
          walletNumber: wallet.walletNumber // 실제 지갑번호로 수정
        }));

        setWalletBalances(walletInfos);

        // If currency is preselected, set it
        if (preselectedCurrency && walletInfos.length > 0) {
          const currency = walletInfos.find((c) => c.code === preselectedCurrency);
          if (currency) {
            setSelectedCurrency(currency);
          }
        }

        // If recipient info is provided via URL params, set it
        if (skipFirstStep && walletNumberParam && recipientNameParam && preselectedCurrency) {
          setRecipientInfo({
            name: recipientNameParam,
            walletNumber: walletNumberParam,
            currencyCode: preselectedCurrency,
          });
        }
      } catch (error) {
        console.error('Error fetching wallets:', error);
        if (error instanceof Error && error.message === "No token found") {
          router.push("/login");
        }
      }
    };

    fetchWallets();
  }, [preselectedCurrency, walletNumberParam, recipientNameParam, skipFirstStep]);

  // Validate amount whenever it changes
  useEffect(() => {
    validateAmount()
  }, [amount, selectedCurrency])

  // Validate amount based on available balance
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

    if (numAmount <= 0) {
      setAmountError("송금 금액은 0보다 커야 합니다.")
      return false
    }

    if (numAmount > selectedCurrency.amount) {
      setAmountError(`송금 가능한 금액은 ${selectedCurrency.amount.toLocaleString()} ${selectedCurrency.code}입니다.`)
      return false
    }

    setAmountError("")
    return true
  }

  // Handle wallet number input
  const handleWalletNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 최대 19자리(하이픈 포함)로 제한
    if (value.replace(/\D/g, "").length > 16) return

    // Format as XXXX-XXXX-XXXX-XXXX
    const formatted = value
      .replace(/\D/g, "")
      .replace(/(\d{4})(\d{1,4})/, "$1-$2")
      .replace(/(\d{4})-(\d{4})(\d{1,4})/, "$1-$2-$3")
      .replace(/(\d{4})-(\d{4})-(\d{4})(\d{1,4})/, "$1-$2-$3-$4")
    setWalletNumber(formatted)
    setWalletError("")
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

  // Mock API call to get recipient info
  const fetchRecipientInfo = async () => {
    setIsLoading(true);
    setWalletError("");

    try {
      const token = await getValidToken();
      // GET 방식, 쿼리스트링에 walletNumber, currencyCode 전달
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/search?walletNumber=${encodeURIComponent(walletNumber)}&currencyCode=${encodeURIComponent(selectedCurrency?.code ?? "")}`,
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
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setWalletError("존재하지 않는 지갑 번호입니다.");
          setIsLoading(false);
          return false;
        }
        if (response.status === 401 || response.status === 403) {
          setWalletError("로그인이 필요합니다. 다시 로그인 해주세요.");
          setIsLoading(false);
          router.push("/login");
          return false;
        }
        setWalletError(errorData.message || '수신자 정보 조회 중 오류가 발생했습니다.');
        setIsLoading(false);
        return false;
      }

      const result = await response.json();
      if (!result.result) {
        throw new Error('Invalid response format');
      }

      setRecipientInfo({
        name: result.result.userName,
        walletNumber: walletNumber,
        currencyCode: result.result.currencyCode,
      });

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error fetching recipient info:", error);
      setWalletError("지갑 정보를 조회하는 중 오류가 발생했습니다.");
      setIsLoading(false);
      return false;
    }
  };

  // Handle next step in transfer process
  const handleNext = async () => {
    if (step === 0) {
      // Validate wallet number and fetch recipient info
      const isValid = await fetchRecipientInfo();
      if (isValid) {
        setStep(1);
      }
    } else if (step === 1 && amount && validateAmount()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3); // 확인 화면에서 PIN 입력 화면으로 이동
    } else if (step === 3 && pin.length === 6) {
      try {
        const token = await getValidToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/transfers/points`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            fromWalletNumber: selectedCurrency?.walletNumber,
            toWalletNumber: recipientInfo?.walletNumber,
            amount: Number(amount),
          } as PointTransferRequestDto),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "송금 처리 중 오류가 발생했습니다.");
        }

        const result = await response.json();
        if (!result.result) {
          throw new Error("Invalid response format");
        }

        // Show success modal
        setShowSuccessModal(true);

        // After 2 seconds, redirect to home
        setTimeout(() => {
          router.push("/home");
        }, 2000);

        console.log('Transfer API params:', { fromWalletNumber: selectedCurrency?.walletNumber, toWalletNumber: recipientInfo?.walletNumber, amount: Number(amount) });
      } catch (error) {
        console.error("Error processing transfer:", error);
        if (error instanceof Error && error.message === "No token found") {
          router.push("/login");
        } else {
          // Show error message to user
          alert(error instanceof Error ? error.message : "송금 처리 중 오류가 발생했습니다.");
        }
      }
    }
  };

  // Format currency for display
  const formatCurrency = (value: string, code: string) => {
    const numValue = Number.parseInt(value, 10)
    if (isNaN(numValue)) return `0 ${code}`
    return `${numValue.toLocaleString()} ${code}`
  }

  // Get currency symbol
  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      KRW: "₩",
      USD: "$",
      EUR: "€",
      JPY: "¥",
      CNY: "¥",
      VND: "₫",
      INR: "₹",
    }
    return symbols[code] || ""
  }

  // Render recipient input step
  const renderRecipientInput = () => (
    <>
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={() => router.back()} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">송금하기</h1>
        <div className="w-6"></div>
      </header>

      <div className="p-4 flex-1">
        <h2 className="text-xl font-medium mb-6">누구에게 보낼까요?</h2>

        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-1">지갑 번호</div>
          <input
            type="text"
            value={walletNumber}
            onChange={handleWalletNumberChange}
            placeholder="지갑 번호 입력"
            className={`w-full p-3 border-b ${
              walletError ? "border-red-500" : "border-gray-300"
            } focus:border-blue-500 focus:outline-none`}
          />
          {walletError && (
            <div className="mt-2 text-red-500 text-sm flex items-center">
              <AlertCircle size={16} className="mr-1" />
              {walletError}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-gray-600">통화 선택</div>
            {selectedCurrency && (
              <div className="text-sm text-gray-600">
                잔액: {selectedCurrency.amount.toLocaleString()} {selectedCurrency.code}
              </div>
            )}
          </div>
          <div
            className="flex items-center justify-between p-3 border-b border-gray-300 cursor-pointer"
            onClick={() => setShowCurrencyModal(true)}
          >
            {selectedCurrency ? (
              <div className="flex items-center">
                <div className="relative h-6 w-6 overflow-hidden rounded-full mr-2">
                  <Image
                    src={selectedCurrency.flagSrc || "/images/flags/korea.png"}
                    alt={selectedCurrency.country}
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                </div>
                <span>
                  {selectedCurrency.country} {selectedCurrency.code}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">통화를 선택해주세요</span>
            )}
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>

        <div className="mt-2 bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex items-start">
          <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>
            <strong>주의:</strong> 송금은 동일한 통화끼리만 가능합니다. 선택한 통화와 받는 사람의 지갑 통화가 일치해야
            합니다.
          </span>
        </div>

        <div className="text-xs text-gray-500 mt-6">
          입력한 정보 모아모아 정책에 따라 고객확인제도 목적으로 제공됩니다.
        </div>
      </div>

      <div className="p-4 mt-auto">
        <button
          onClick={handleNext}
          disabled={!walletNumber || !selectedCurrency || isLoading}
          className={`w-full py-4 rounded-full text-center text-white font-medium text-lg ${
            walletNumber && selectedCurrency && !isLoading
              ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isLoading ? "조회 중..." : "다음"}
        </button>
      </div>
    </>
  )

  // Render amount input step
  const renderAmountInput = () => (
    <>
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => {
            if (skipFirstStep) {
              router.back()
            } else {
              setStep(0)
            }
          }}
          className="text-gray-700 cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">송금하기</h1>
        <div className="w-6"></div>
      </header>

      <div className="p-4 bg-white flex-1">
        {recipientInfo && selectedCurrency && (
          <>
            <h2 className="text-xl font-medium mb-4">{recipientInfo.name} 님에게</h2>
            <div className="flex items-center mb-4">
              <div className="relative h-6 w-6 overflow-hidden rounded-full mr-2">
                <Image
                  src={selectedCurrency.flagSrc || "/images/flags/korea.png"}
                  alt={selectedCurrency.country}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </div>
              <span className="text-sm text-gray-600">
                {selectedCurrency.country} {selectedCurrency.code}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-6">
              송금 가능 금액: {selectedCurrency.amount.toLocaleString()} {selectedCurrency.code}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="text-3xl font-bold">
                {amount ? formatCurrency(amount, selectedCurrency.code) : `0 ${selectedCurrency.code}`}
              </div>
              {amount && (
                <button onClick={() => setAmount("")} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            {amountError && (
              <div className="mb-4 flex items-center text-red-500 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {amountError}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-auto">
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
              className="py-5 text-center text-xl font-medium border-t border-r border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Next button */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleNext}
            disabled={!amount || !!amountError}
            className={`w-full py-4 rounded-full text-center text-white font-medium text-lg ${
              amount && !amountError
                ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] cursor-pointer"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            다음
          </button>
        </div>
      </div>
    </>
  )

  // Render confirmation step
  const renderConfirmation = () => (
    <>
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={() => setStep(1)} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">송금하기</h1>
        <div className="w-6"></div>
      </header>

      <div className="p-4 flex-1">
        <h2 className="text-xl font-medium mb-6">보내는 금액</h2>

        {recipientInfo && selectedCurrency && (
          <>
            <div className="text-3xl font-bold mb-4">
              {getCurrencySymbol(selectedCurrency.code)} {Number.parseInt(amount, 10).toLocaleString()}
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">보낸 후 잔액</span>
              <span className="font-medium">
                {getCurrencySymbol(selectedCurrency.code)}{" "}
                {(selectedCurrency.amount - Number.parseInt(amount, 10)).toLocaleString()}
              </span>
            </div>

            <div className="py-6">
              <h3 className="text-lg font-medium mb-4">받는 사람</h3>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">이름</span>
                <span className="font-medium">{recipientInfo.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">지갑번호</span>
                <span className="font-medium">{recipientInfo.walletNumber}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">안내사항</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 본 서비스는 금융실명거래및비밀보장에 따라 지정된 적신금융서비스입니다.</li>
                <li>• 모아모아에 가입한 사용자끼리 간편하게 송금할 수 있습니다.</li>
                <li>• 송금건당송금은 보내는사람, 받는사람 모두 대한민국 거주자만이 종종하여야 사용할 수 있습니다.</li>
                <li className="text-blue-600 font-medium">
                  • 송금은 동일한 통화끼리만 가능합니다. 선택한 통화와 받는 사람의 지갑 통화가 일치해야 합니다.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="p-4 mt-auto">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-full text-center text-white font-medium text-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] cursor-pointer"
        >
          보내기
        </button>
      </div>
    </>
  )

  // Render PIN input step - Matching login/signup UI
  const renderPinInput = () => (
    <>
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <button onClick={() => setStep(2)} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">암호 입력</h1>
        <div className="w-6"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-center text-xl font-medium">모아모아 암호를 입력해 주세요.</h2>
          <div className="flex justify-center space-x-3 py-4">
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className={`h-4 w-4 rounded-full ${index < pin.length ? "bg-[#0DAEFF]" : "bg-gray-200"}`}
                ></div>
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
              if (item.key === "") {
                return <div key={index} className="h-14"></div>
              }
              if (item.key === "backspace") {
                return (
                  <button
                    key={index}
                    type="button"
                    className="flex h-14 w-full items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handlePinInput("backspace")}
                  >
                    <Delete size={24} />
                  </button>
                )
              }
              return (
                <button
                  key={index}
                  type="button"
                  className="flex h-14 w-full items-center justify-center rounded-full text-2xl font-medium text-gray-800 hover:bg-gray-100"
                  onClick={() => handlePinInput(item.key)}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {pin.length === 6 && (
        <div className="p-4">
          <button
            onClick={handleNext}
            className="h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-center text-lg font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8] cursor-pointer"
          >
            확인
          </button>
        </div>
      )}
    </>
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
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(2px)",
          animation: "fadeIn 0.3s ease-out",
        }}
      >
        <div className="fixed inset-0 flex items-center justify-center">
          <div
            className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-xl"
            style={{
              animation: "scaleIn 0.3s ease-out",
            }}
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center mx-auto mb-6">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold mb-2">
                {amount && selectedCurrency
                  ? `${Number.parseInt(amount, 10).toLocaleString()}${getCurrencySymbol(selectedCurrency.code)}`
                  : ""}
              </h2>
              <p className="text-gray-600 mb-8">송금 완료</p>

              <div className="flex justify-between items-center text-left mb-3 px-2">
                <span className="text-gray-500 mr-4">송금 지갑 번호</span>
                <span className="font-medium text-right">{recipientInfo?.walletNumber || ""}</span>
              </div>
              <div className="flex justify-between items-center text-left mb-8 px-2">
                <span className="text-gray-500 mr-4">날짜</span>
                <span className="font-medium text-right">
                  {new Date().toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <button
                onClick={() => router.push("/home")}
                className="w-full py-4 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white font-medium rounded-full text-lg cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  )

  // 통화 선택 모달 렌더링 함수
  const renderCurrencyModal = () => (
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
        onClick={() => setShowCurrencyModal(false)}
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
          <h2 className="text-xl font-bold mb-6">통화 선택</h2>

          {walletBalances.length > 0 ? (
            <div className="space-y-4 mb-6">
              {walletBalances.map((currency, index) => (
                <button
                  key={index}
                  className="flex items-center w-full p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => {
                    setSelectedCurrency(currency)
                    setShowCurrencyModal(false)
                  }}
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-full mr-3 border border-gray-100">
                    <Image
                      src={currency.flagSrc || "/images/flags/korea.png"}
                      alt={currency.country}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-800">
                      {currency.country} {currency.code}
                    </span>
                    <span className="text-sm text-gray-500">
                      잔액: {currency.amount.toLocaleString()} {currency.code}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">사용 가능한 통화가 없습니다.</div>
          )}

          <button
            onClick={() => setShowCurrencyModal(false)}
            className="w-full py-4 mt-3 border border-gray-300 text-gray-700 font-medium rounded-full text-lg"
          >
            취소
          </button>
        </div>
      </div>
    </ModalPortal>
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {step === 0 && renderRecipientInput()}
      {step === 1 && renderAmountInput()}
      {step === 2 && renderConfirmation()}
      {step === 3 && renderPinInput()}
      {showCurrencyModal && renderCurrencyModal()}
      {showSuccessModal && renderSuccessModal()}
    </div>
  )
}
