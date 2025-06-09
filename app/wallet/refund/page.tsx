"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, X, ChevronDown, Check, AlertCircle, Delete } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import ModalPortal from "@/components/modal-portal"
import { getValidToken } from "@/lib/auth"
import { getCurrencySymbol, getCountryName, mapCurrencyToFlag } from "@/lib/utils"

type CurrencyInfo = {
  code: string
  country: string
  flagSrc: string
  amount: number
}

type BankAccount = {
  id: number;
  accountNumber: string;
  bankName: string;
  bankLogo: string;
  currency: string;
}

type PointWithdrawRequestDto = {
  bankAccount: string;
  amount: number;
  password: string;
}

type PointWithdrawResponseDto = {
  transactionId: number;
  fromWalletNumber: string;
  toBankAccount: string;
  amount: number;
  currency: string;
}

type WalletResponse = {
  currencyCode: string;
  balance: number;
}

export default function RefundPage() {
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
  const [filteredAccounts, setFilteredAccounts] = useState<BankAccount[]>([])
  const [amountError, setAmountError] = useState<string>("")
  const [walletBalances, setWalletBalances] = useState<CurrencyInfo[]>([])
  const [transactionId, setTransactionId] = useState<number | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)

  // Load wallet balances and accounts from localStorage on mount
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
        // result.result 또는 result.data 중 실제 배열을 사용
        const walletArr = Array.isArray(result.result)
          ? result.result
          : Array.isArray(result.data)
            ? result.data
            : [];
        if (!Array.isArray(walletArr)) {
          throw new Error('Invalid response format');
        }

        const walletInfos: CurrencyInfo[] = walletArr.map((wallet: WalletResponse) => ({
          country: getCountryName(wallet.currencyCode),
          code: wallet.currencyCode,
          flagSrc: `/images/flags/${mapCurrencyToFlag(wallet.currencyCode)}`,
          amount: wallet.balance,
        }));

        setWalletBalances(walletInfos);
      } catch (error) {
        console.error('Error fetching wallets:', error);
        if (error instanceof Error && error.message === "No token found") {
          router.push("/login");
        }
      }
    };

    fetchWallets();
  }, []);

  // Set preselected currency if provided in URL
  useEffect(() => {
    if (preselectedCurrency && walletBalances.length > 0) {
      const currency = walletBalances.find((c) => c.code === preselectedCurrency)
      if (currency) {
        setSelectedCurrency(currency)
        setStep(1) // Skip to amount input step when currency is preselected
      }
    }
  }, [preselectedCurrency, walletBalances])

  // Filter accounts by selected currency
  useEffect(() => {
    const fetchBankAccounts = async (currencyCode: string) => {
      try {
        const token = await getValidToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/bank-accounts?currencyCode=${currencyCode}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );
        if (!response.ok) {
          setFilteredAccounts([]);
          setSelectedAccount(null);
          return;
        }
        const result = await response.json();
        const bankAccounts: BankAccount[] = Array.isArray(result.result)
          ? result.result.map((account: { id: number; accountNumber: string; currency: string }) => ({
              id: account.id,
              accountNumber: account.accountNumber,
              bankName: "환비 은행",
              bankLogo: "/images/hwanbi-bank-logo.png",
              currency: account.currency,
            }))
          : [];
        setFilteredAccounts(bankAccounts);
        if (bankAccounts.length === 1) {
          setSelectedAccount(bankAccounts[0]);
        } else {
          setSelectedAccount(null);
        }
      } catch {
        setFilteredAccounts([]);
        setSelectedAccount(null);
      }
    };
    if (selectedCurrency) {
      fetchBankAccounts(selectedCurrency.code);
    } else {
      setFilteredAccounts([]);
      setSelectedAccount(null);
    }
  }, [selectedCurrency]);

  // Validate amount whenever it changes
  useEffect(() => {
    validateAmount()
  }, [amount, selectedCurrency])

  // Filter currencies based on search query
  const filteredCurrencies = walletBalances.filter(
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
      setAmountError("환불 금액은 0보다 커야 합니다.")
      return false
    }

    if (numAmount > selectedCurrency.amount) {
      setAmountError(`환불 가능한 금액은 ${selectedCurrency.amount.toLocaleString()} ${selectedCurrency.code}입니다.`)
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

  // Handle next step in refund process
  const handleNext = async () => {
    if (step === 1 && amount && selectedAccount && validateAmount()) {
      setStep(2)
    } else if (step === 2 && pin.length === 6 && selectedAccount) {
      try {
        const token = await getValidToken();
        console.log('Refund API params:', { bankAccount: selectedAccount.accountNumber, amount: Number(amount), password: pin });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/withdraw`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            bankAccount: selectedAccount.accountNumber,
            amount: Number(amount),
            password: pin,
          } as PointWithdrawRequestDto),
        });

        if (!response.ok) {
          const errorData = await response.json();
          switch (errorData.errorCode) {
            case "WDR_001":
              alert("출금할 지갑 정보를 찾을 수 없습니다.");
              break;
            case "WDR_002":
              alert("출금할 지갑에 잔액이 부족합니다.");
              break;
            case "WDR_003":
              alert("연결된 외부 계좌 정보를 찾을 수 없습니다.");
              break;
            case "WDR_004":
              alert("출금 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
              break;
            case "WDR_005":
              alert("출금 금액이 유효하지 않습니다.");
              break;
            case "HWANBEE_001":
              alert("인증 코드 요청에 실패했습니다.");
              break;
            case "HWANBEE_002":
              alert("인증 코드 검증에 실패했습니다.");
              break;
            case "HWANBEE_003":
              alert("계좌 정보가 올바르지 않거나 소유자가 일치하지 않습니다.");
              break;
            case "HWANBEE_004":
              alert("계좌 인증에 실패했습니다.");
              break;
            case "HWANBEE_005":
              alert("계좌 연결 중 오류가 발생했습니다.");
              break;
            case "HWANBEE_006":
              alert("환비 토큰 발급에 실패했습니다.");
              break;
            case "HWANBEE_007":
              alert("환비 송금 API 요청에 실패했습니다.");
              break;
            case "HWANBEE_008":
              alert("환전 정보 조회에 실패했습니다.");
              break;
            case "HWANBEE_009":
              alert("환전 진행에 실패했습니다.");
              break;
            default:
              alert(errorData.message || "환불 처리 중 알 수 없는 오류가 발생했습니다.");
          }
          return;
        }

        const result = await response.json();
        if (!result.result) {
          throw new Error("Invalid response format");
        }

        const responseData = result.result as PointWithdrawResponseDto;
        setTransactionId(responseData.transactionId);

        // Show success modal
        setShowSuccessModal(true);

        // After 2 seconds, redirect to home
        setTimeout(() => {
          router.push("/home");
        }, 2000);
      } catch (error) {
        console.error("Error processing refund:", error);
        if (error instanceof Error && error.message === "No token found") {
          router.push("/login");
        } else {
          // Show error message to user
          alert(error instanceof Error ? error.message : "환불 처리 중 오류가 발생했습니다.");
        }
      }
    }
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

          {filteredCurrencies.length > 0 ? (
            <div className="space-y-4">
              {filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  className="flex items-center w-full py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200"
                  onClick={() => handleSelectCurrency(currency)}
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-full mr-4 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
                    <Image
                      src={currency.flagSrc || `/images/flags/${mapCurrencyToFlag(currency.code)}`}
                      alt={currency.country}
                      width={48}
                      height={48}
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
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-400"
                >
                  <path
                    d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-500">환불 가능한 통화가 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">먼저 충전을 통해 지갑을 생성해주세요.</p>
            </div>
          )}
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
        <h1 className="text-lg font-medium">환불하기</h1>
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
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-800">
                    {selectedCurrency.country} {selectedCurrency.code}
                  </span>
                  <div className="text-xs text-gray-500">
                    환불 가능한 금액: {selectedCurrency.amount.toLocaleString()} {selectedCurrency.code}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-800">
                  {amount ? formatCurrency(amount, selectedCurrency.code) : `0 ${selectedCurrency.code}`}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAmount(selectedCurrency.amount.toString())}
                    className="px-2 py-1 text-xs font-medium text-blue-500 border border-blue-500 rounded-md hover:bg-blue-50"
                  >
                    전액 입력
                  </button>
                  {amount && (
                    <button
                      onClick={() => setAmount("")}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
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
            <h3 className="text-sm font-medium text-gray-600 mb-2">환불계좌</h3>
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex items-center justify-between w-full border border-gray-200 rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
            >
              {selectedAccount ? (
                <>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-white border border-gray-100">
                      <Image
                        src={selectedAccount.bankLogo || `/images/flags/${mapCurrencyToFlag(selectedAccount.currency)}`}
                        alt={selectedAccount.bankName}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="font-medium text-gray-800">{selectedAccount.bankName}</div>
                      <div className="text-gray-500 text-sm">{selectedAccount.accountNumber}</div>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </>
              ) : (
                <span className="text-gray-500 w-full text-center">환불 계좌를 선택해주세요.</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">최종 환불액</span>
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
              className="py-5 text-center text-xl font-medium border-t border-r border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Next button */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleNext}
            disabled={!amount || !!amountError || !selectedAccount}
            className={`w-full py-4 rounded-full text-center text-white font-medium text-lg ${
              amount && !amountError && selectedAccount
                ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)]"
                : "bg-gray-300"
            }`}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )

  // Render PIN input step - Matching login/signup UI
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
            className="h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-center text-lg font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8]"
          >
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
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
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
            className="bg-white w-full max-w-xs rounded-2xl overflow-hidden shadow-xl"
            style={{
              animation: "scaleIn 0.3s ease-out",
            }}
          >
            <div className="p-6 text-center">
              <div
                className="w-16 h-16 rounded-full bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] flex items-center justify-center mx-auto mb-6 shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3)]"
                style={{ animation: "pulse 1.5s infinite" }}
              >
                <Check size={32} className="text-white" />
              </div>

              <h2 className="text-xl font-medium mb-2">환불 완료</h2>
              <p className="text-lg font-bold text-blue-500">
                {amount && selectedCurrency
                  ? `${getCurrencySymbol(selectedCurrency.code)}${Number.parseInt(amount, 10).toLocaleString()}`
                  : ""}
              </p>
              {transactionId && (
                <p className="text-sm text-gray-500 mt-2">
                  거래번호: {transactionId}
                </p>
              )}

              <button
                onClick={() => router.push("/home")}
                className="w-full py-4 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white font-medium rounded-full text-lg mt-6 shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)]"
              >
                확인
              </button>
            </div>
          </div>
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
          <h2 className="text-xl font-bold mb-6">환불 계좌 선택</h2>

          {filteredAccounts.length > 0 ? (
            <div className="space-y-4 mb-6">
              {filteredAccounts.map((account, index) => (
                <button
                  key={index}
                  className="flex items-center w-full p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => handleSelectAccount(account)}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-white border border-gray-100 shadow-sm">
                    <Image
                      src={account.bankLogo || `/images/flags/${mapCurrencyToFlag(account.currency)}`}
                      alt={account.bankName}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{account.bankName}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full">주계좌</span>
                    </div>
                    <div className="text-gray-500">{account.accountNumber}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">등록된 계좌가 없습니다.</div>
          )}

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
