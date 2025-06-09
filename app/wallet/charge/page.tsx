"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, X, ChevronDown, Check, Plus, AlertCircle, Delete } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import ModalPortal from "@/components/modal-portal"
import { getValidToken } from "@/lib/auth"
import { mapCurrencyToFlag } from "@/lib/utils"

type CurrencyInfo = {
  code: string
  country: string
  flagSrc: string
  chargeUnit: number
}

type BankAccountResponseDto = {
  id: number;
  accountNumber: string;
  currency: string;
}

type BankAccount = {
  id: number;
  accountNumber: string;
  bankName: string;
  bankLogo: string;
  currency: string;
}

type FieldError = {
  defaultMessage?: string;
  message?: string;
};

// 통화 포맷팅 유틸리티 함수
const formatCurrency = (value: string | number, code: string): string => {
  const numValue = typeof value === 'string' ? Number.parseInt(value, 10) : value
  if (isNaN(numValue)) return `0 ${code}`
  return `${numValue.toLocaleString()} ${code}`
}

export default function ChargePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCurrency = searchParams.get("currency")

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
  const [isLoading, setIsLoading] = useState(false)
  const [accountStep, setAccountStep] = useState<number>(0); // 0: 계좌번호 입력, 1: 인증코드 입력
  const [newAccountNumber, setNewAccountNumber] = useState<string>("")
  const [newCurrencyCode, setNewCurrencyCode] = useState<string>("")
  const [verificationCode, setVerificationCode] = useState<string>("")
  const [verificationError, setVerificationError] = useState<string>("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)

  // 통화 목록
  const currencies: CurrencyInfo[] = [
    { code: "VND", country: "베트남", flagSrc: "/images/flags/vietnam.png", chargeUnit: 200000 },
    { code: "JPY", country: "일본", flagSrc: "/images/flags/japan.png", chargeUnit: 1000 },
    { code: "KRW", country: "대한민국", flagSrc: "/images/flags/korea.png", chargeUnit: 10000 },
    { code: "USD", country: "미국", flagSrc: "/images/flags/usa.png", chargeUnit: 10 },
    { code: "CNY", country: "중국", flagSrc: "/images/flags/china.png", chargeUnit: 50 },
    { code: "EUR", country: "유럽", flagSrc: "/images/flags/eu.png", chargeUnit: 10 },
    { code: "INR", country: "인도", flagSrc: "/images/flags/india.png", chargeUnit: 800 },
  ]

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/bank-accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bank accounts');
      }

      const result = await response.json();
      if (!Array.isArray(result.result)) {
        throw new Error('Invalid response format');
      }

      const bankAccounts: BankAccount[] = result.result.map((account: BankAccountResponseDto) => ({
        id: account.id,
        accountNumber: account.accountNumber,
        bankName: "환비 은행",
        bankLogo: "/images/hwanbi-bank-logo.png",
        currency: account.currency,
      }));

      setAccounts(bankAccounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      }
    }
  };

  // Initialize bank accounts
  useEffect(() => {
    fetchBankAccounts();
  }, [router]);

  // 사용자가 다른 페이지에서 특정 통화를 선택하고 이 페이지로 이동했을 때,
  // 통화 선택 단계를 건너뛰고 바로 금액 입력 단계로 이동하게 함
  useEffect(() => {
    if (preselectedCurrency) {  // URL에 통화 파라미터가 있는 경우
      const currency = currencies.find((c) => c.code === preselectedCurrency)  // 해당 통화 찾기
      if (currency) {  // 통화를 찾았다면
        setSelectedCurrency(currency)  // 선택된 통화 상태 업데이트
        setStep(1)  // 금액 입력 단계로 바로 이동
      }
    }
  }, [preselectedCurrency])

  // Filter accounts by selected currency
  useEffect(() => {
    if (selectedCurrency && accounts.length > 0) {
      const filtered = accounts.filter(
        (account) => account.currency.toUpperCase() === selectedCurrency.code.toUpperCase()
      );
      setFilteredAccounts(filtered);

      if (filtered.length === 1) {
        setSelectedAccount(filtered[0]);
      } else {
        setSelectedAccount(null);
      }
    } else {
      setFilteredAccounts([]);
      setSelectedAccount(null);
    }
  }, [selectedCurrency, accounts]);

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
  const handleNext = async () => {
    if (isLoading) return;
    if (step === 1 && amount && validateAmount()) {
      if (selectedAccount) {
        setStep(3); // 계좌가 있으면 바로 PIN 입력(충전) 화면으로 이동
      } else {
        setStep(2); // 계좌가 없으면 계좌 등록 화면으로 이동
      }
    } else if ((step === 2 || step === 3) && pin.length === 6 && selectedAccount) {
      // Defensive checks for required fields
      if (!selectedAccount.accountNumber) {
        alert('계좌번호가 없습니다.');
        setIsLoading(false);
        return;
      }
      if (!amount || isNaN(Number(amount))) {
        alert('금액이 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }
      if (!selectedCurrency?.code) {
        alert('통화 코드가 없습니다.');
        setIsLoading(false);
        return;
      }
      if (!pin || pin.length !== 6) {
        alert('암호(PIN)가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const params = {
          currencyCode: selectedCurrency?.code?.toUpperCase(),
          hwanbeeAccountNumber: selectedAccount.accountNumber,
          amount: Number.parseInt(amount),
          password: pin
        };
        console.log('Charge API params (RechargeRequestDto):', params);
        const token = await getValidToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/recharge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          const errorData = await response.json();
          let errorMsg = '충전에 실패했습니다.';
          if (errorData.errorCode) {
            switch (errorData.errorCode) {
              case "RCG_001": errorMsg = "외화는 직접 충전이 불가능합니다."; break;
              case "RCG_002": errorMsg = "환율 정보를 불러오는 데 실패했습니다."; break;
              case "RCG_003": errorMsg = "수수료 계산에 실패했습니다."; break;
              case "RCG_004": errorMsg = "연결된 계좌 정보를 찾을 수 없습니다."; break;
              case "RCG_005": errorMsg = "충전 금액이 유효하지 않습니다."; break;
              case "RCG_006": errorMsg = "충전 금액은 만원 단위여야 합니다."; break;
              default:
                if (errorData.message) errorMsg = errorData.message;
            }
          }
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMsg = errorData.errors.map((err: FieldError) => err.defaultMessage || err.message).join('\n');
          }
          alert(errorMsg);
          setIsLoading(false);
          return;
        }

        // 충전 성공 시 안내
        setShowSuccessModal(true);
        setTimeout(() => {
          router.push("/home");
        }, 2000);
      } catch (error) {
        console.error('Error charging wallet:', error);
        if (error instanceof Error && error.message === "No token found") {
          router.push("/login");
        } else {
          alert(error instanceof Error ? error.message : '충전 중 오류가 발생했습니다.');
        }
        setIsLoading(false);
      }
    }
  }

  // Handle adding a new account
  const handleAddAccount = async () => {
    // 1. 환비 인증 여부 확인 (백엔드 DB 기준)
    try {
      const token = await getValidToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/oauth2/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data.result) {
        // 인증 안 되어 있으면 OAuth 인가 플로우로 이동
        window.location.href = "/oauth/authorize?redirect=https://moamoa-front.vercel.app/login/oauth2/code/hwanbee";
        return;
      }
    } catch {
      alert("환비 인증 상태 확인 중 오류가 발생했습니다.");
      return;
    }
    // 인증 되어 있으면 계좌 등록 step으로 이동
    setStep(2);
    setAccountStep(0);
    setNewAccountNumber("");
    setNewCurrencyCode("");
    setVerificationCode("");
    setVerificationError("");
    setShowAccountModal(false); // 모달 자동 닫기
  };

  // Handle requesting a verification code
  const handleRequestVerificationCode = async () => {
    if (!newAccountNumber) {
      setVerificationError("계좌번호를 입력해주세요.");
      return;
    }
    if (!newCurrencyCode) {
      setVerificationError("통화코드를 선택해주세요.");
      return;
    }
    // OAuth 인증 여부 확인 (예: localStorage 플래그)
    if (typeof window !== "undefined" && !localStorage.getItem("hwanbee_oauth_authenticated")) {
      window.location.href = "/oauth/authorize?redirect=/wallet/charge";
      return;
    }
    setIsVerifying(true);
    setVerificationError("");
    try {
      const token = await getValidToken(); // 모아모아 accessToken
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/verification-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accountNumber: newAccountNumber,
            currencyCode: newCurrencyCode
          })
        }
      );
      if (response.status !== 204) {
        let errorMsg = '인증 코드 요청에 실패했습니다.';
        try {
          const errorData = await response.json();
          if (errorData.message) errorMsg = errorData.message;
        } catch {}
        setVerificationError(errorMsg);
        setIsVerifying(false);
        return;
      }
      // 인증코드 발급 성공, 다음 단계로
      setAccountStep(1);
      setIsVerifying(false);
    } catch {
      setVerificationError('인증 코드 요청 중 오류가 발생했습니다.');
      setIsVerifying(false);
    }
  };

  // Handle verifying and creating a wallet
  const handleVerifyAndCreateWallet = async () => {
    if (!verificationCode || verificationCode.length !== 3) {
      setVerificationError("3자리 인증코드를 입력해주세요.");
      return;
    }
    setIsVerifying(true);
    setVerificationError("");
    try {
      const token = await getValidToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            inputCode: Number(verificationCode)
          })
        }
      );
      const result = await response.json();
      if (!response.ok || result.errorCode) {
        setVerificationError(result.message || '지갑 생성에 실패했습니다.');
        setIsVerifying(false);
        return;
      }
      // 성공: 계좌 목록 새로고침, step 1로 이동
      await fetchBankAccounts();
      setStep(1);
      setAccountStep(0);
      setNewAccountNumber("");
      setNewCurrencyCode("");
      setVerificationCode("");
      setVerificationError("");
      alert('계좌가 성공적으로 등록되었습니다.');
    } catch {
      setVerificationError('지갑 생성 중 오류가 발생했습니다.');
    }
    setIsVerifying(false);
  };

  // Handle selecting an account
  const handleSelectAccount = (account: BankAccount) => {
    setSelectedAccount(account)
    setShowAccountModal(false)
  }

  // Render currency selection step
  const renderCurrencySelection = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={() => router.back()} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">통화 선택</h1>
        <div className="w-6"></div>
      </header>

      <div className="relative p-4">
        <div className="relative z-10">
          <div className="relative mb-6">
            <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 shadow-inner">
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
                className="flex items-center w-full py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200 cursor-pointer"
                onClick={() => handleSelectCurrency(currency)}
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-full mr-4 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
                  <Image
                    src={currency.flagSrc || `/images/flags/${mapCurrencyToFlag(currency.code)}`}
                    alt={currency.country}
                    width={48}
                    height={48}
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-gray-800">
                    {currency.country} {currency.code}
                  </span>
                  <span className="text-sm text-gray-500">
                    충전 단위: {currency.chargeUnit.toLocaleString()} {currency.code}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Render amount input step
  const renderAmountInput = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={() => (preselectedCurrency ? router.back() : setStep(0))} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">충전하기</h1>
        <div className="w-6"></div>
      </header>

      <div className="relative p-4 bg-white">
        <div className="relative z-10">
          {selectedCurrency && (
            <div className="mb-6 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="relative h-10 w-10 overflow-hidden rounded-full mr-3 border border-gray-100 shadow-sm">
                  <Image
                    src={selectedCurrency.flagSrc || `/images/flags/${mapCurrencyToFlag(selectedCurrency.code)}`}
                    alt={selectedCurrency.country}
                    width={40}
                    height={40}
                    className="object-cover"
                    priority
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-800">
                    {selectedCurrency.country} {selectedCurrency.code}
                  </span>
                  <div className="text-xs text-gray-500">
                    충전 단위: {selectedCurrency.chargeUnit.toLocaleString()} {selectedCurrency.code}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-800">
                  {amount ? formatCurrency(amount, selectedCurrency.code) : `0 ${selectedCurrency.code}`}
                </div>
                {amount && (
                  <button onClick={() => setAmount("")} className="text-gray-400 hover:text-gray-600 transition-colors">
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
            <h3 className="text-sm font-medium text-gray-600 mb-2">출금 계좌 선택</h3>
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex items-center justify-between w-full border border-gray-200 rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md cursor-pointer"
            >
              {selectedAccount ? (
                <>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-white border border-gray-100">
                      <Image
                        src="/images/hwanbi-bank-logo.png"
                        alt="환비 은행"
                        width={40}
                        height={40}
                        className="object-contain"
                        priority
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="font-medium text-gray-800">환비 은행</div>
                      <div className="text-gray-500 text-sm">{selectedAccount.accountNumber}</div>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </>
              ) : (
                <span className="text-gray-500 w-full text-center">
                  출금할 수 있는 계좌가 없습니다.
                  계좌를 추가해주세요.
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">최종 충전액</span>
            <span className="font-bold text-blue-500 text-2xl">
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
              className="py-5 text-center text-xl font-medium border-t border-r border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
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
                amount && !amountError
                  ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              다음
            </button>
          ) : (
            <button
              onClick={handleAddAccount}
              disabled={!selectedCurrency}
              className={`w-full py-4 rounded-full text-center text-white font-medium text-lg ${
                selectedCurrency
                  ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              계좌 추가하기
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // Render account registration step
  const renderAccountRegistrationStep = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={() => setStep(1)} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">계좌 등록</h1>
        <div className="w-6"></div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16">
        {accountStep === 0 ? (
          <div className="w-full max-w-md">
            <h2 className="mb-6 text-center text-xl font-medium">환비 계좌번호와 통화코드를 입력해 주세요.</h2>
            <input
              type="text"
              value={newAccountNumber}
              onChange={e => setNewAccountNumber(e.target.value)}
              placeholder="계좌번호"
              className="w-full border rounded-lg p-3 text-lg mb-4"
              maxLength={20}
            />
            <button
              type="button"
              className="w-full border rounded-lg p-3 text-lg mb-4 bg-white flex items-center justify-between"
              onClick={() => setShowCurrencyModal(true)}
            >
              {newCurrencyCode
                ? (
                  <span className="flex items-center">
                    <img
                      src={currencies.find(c => c.code === newCurrencyCode)?.flagSrc}
                      alt={newCurrencyCode}
                      className="w-6 h-6 mr-2"
                    />
                    {currencies.find(c => c.code === newCurrencyCode)?.country} ({newCurrencyCode})
                  </span>
                )
                : <span className="text-gray-400">통화코드 선택</span>
              }
              <span className="text-gray-400 ml-2">▼</span>
            </button>
            {showCurrencyModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCurrencyModal(false)}>
                <div className="bg-white rounded-xl p-6 max-w-xs w-full shadow-lg" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">통화 선택</h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {currencies.map(currency => (
                      <button
                        key={currency.code}
                        type="button"
                        className={`flex items-center w-full px-4 py-3 rounded-lg border transition-all ${newCurrencyCode === currency.code ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => { setNewCurrencyCode(currency.code); setShowCurrencyModal(false); }}
                      >
                        <img src={currency.flagSrc} alt={currency.code} className="w-6 h-6 mr-3" />
                        <span className="font-semibold">{currency.code}</span>
                        <span className="ml-2 text-gray-600">{currency.country}</span>
                        <span className="ml-auto text-xs text-gray-400">단위: {currency.chargeUnit.toLocaleString()} {currency.code}</span>
                      </button>
                    ))}
                  </div>
                  <button className="mt-4 w-full py-2 rounded bg-gray-200 text-gray-700 font-medium" onClick={() => setShowCurrencyModal(false)}>취소</button>
                </div>
              </div>
            )}
            <button
              onClick={handleRequestVerificationCode}
              disabled={isVerifying || !newAccountNumber || !newCurrencyCode}
              className="w-full py-4 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white font-medium rounded-full text-lg shadow cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? '요청 중...' : '인증코드 발급 요청'}
            </button>
            {verificationError && <div className="mt-4 text-red-500 text-center">{verificationError}</div>}
          </div>
        ) : (
          <div className="w-full max-w-md">
            <h2 className="mb-6 text-center text-xl font-medium">환비 앱에서 받은 3자리 인증코드를 입력해 주세요.</h2>
            <input
              type="number"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              placeholder="인증코드 (3자리)"
              className="w-full border rounded-lg p-3 text-lg mb-4"
              maxLength={3}
            />
            <button
              onClick={handleVerifyAndCreateWallet}
              disabled={isVerifying || !verificationCode}
              className="w-full py-4 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white font-medium rounded-full text-lg shadow cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? '확인 중...' : '지갑 생성'}
            </button>
            {verificationError && <div className="mt-4 text-red-500 text-center">{verificationError}</div>}
          </div>
        )}
      </div>
    </div>
  );

  // Render PIN input step - Updated to match login/signup UI
  const renderPinInput = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <button onClick={() => setStep(1)} className="text-gray-700 cursor-pointer">
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

        <div className="mt-8">
          {[
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["", "0", "backspace"],
          ].map((row, rowIndex) => (
            <div key={rowIndex} className="mb-6 flex justify-center space-x-12">
              {row.map((num, colIndex) => {
                if (num === "") {
                  return <div key={colIndex} className="h-12 w-12"></div>
                }
                if (num === "backspace") {
                  return (
                    <button
                      key={colIndex}
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-full text-gray-600"
                      onClick={() => handlePinInput("backspace")}
                    >
                      <Delete size={24} />
                    </button>
                  )
                }
                return (
                  <button
                    key={colIndex}
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-2xl font-medium text-gray-800"
                    onClick={() => handlePinInput(num)}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {pin.length === 6 && (
        <div className="p-4">
          <button
            onClick={handleNext}
            disabled={isLoading}
            className={`h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-center text-lg font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8] ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '처리 중...' : '확인'}
          </button>
        </div>
      )}
    </div>
  )

  // Render success modal
  const renderSuccessModal = () => (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div className="rounded-lg bg-white p-6 shadow-lg w-80 text-center">
          <div
            className="w-16 h-16 rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] flex items-center justify-center mx-auto mb-6 shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3)]"
            style={{ animation: "pulse 1.5s infinite" }}
          >
            <Check size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-medium mb-2">충전 완료</h2>
          <p className="text-lg font-bold text-blue-500">
            {amount ? formatCurrency(amount, selectedCurrency?.code || "") : ""}
          </p>
          <button
            onClick={() => router.push("/home")}
            className="w-full py-4 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white font-medium rounded-full text-lg mt-6 shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)]"
          >
            확인
          </button>
        </div>
      </div>
    </ModalPortal>
  )

  // Render account selection modal
  const renderAccountModal = () => (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => setShowAccountModal(false)}
      >
        <div
          className="rounded-lg bg-white p-6 shadow-lg w-80 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-6">출금 계좌 선택</h2>
          {filteredAccounts.length > 0 && (
            <div className="space-y-4 mb-6">
              {filteredAccounts.map((account, index) => (
                <button
                  key={index}
                  className="flex items-center w-full p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => handleSelectAccount(account)}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-white border border-gray-100 shadow-sm">
                    <Image
                      src="/images/hwanbi-bank-logo.png"
                      alt="환비 은행"
                      width={48}
                      height={48}
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">환비 은행</span>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full">주계좌</span>
                    </div>
                    <div className="text-gray-500">{account.accountNumber}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleAddAccount}
            className="w-full py-4 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white font-medium rounded-full flex items-center justify-center text-lg shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)] cursor-pointer"
          >
            <Plus size={20} className="mr-2" />
            계좌 추가
          </button>
          <button
            onClick={() => setShowAccountModal(false)}
            className="w-full py-4 mt-3 border border-gray-300 text-gray-700 font-medium rounded-full text-lg cursor-pointer"
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
        return renderAccountRegistrationStep()
      case 3:
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
