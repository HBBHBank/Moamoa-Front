"use client"

import type React from "react"

import { useState } from "react"
import { ChevronLeft, Check } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import ModalPortal from "@/components/modal-portal"
import { getValidToken } from "@/lib/auth"

type VerificationCodeRequestDto = {
  externalBankAccountNumber: string;
}

type VerificationCodeResponseDto = {
  status: number;
  message: string;
  data: {
    transactionId: string;
    status: string;
    message: string;
  };
}

type VerificationCheckRequestDto = {
  transactionId: string;
  inputCode: number;
}

type CreateWalletRequestDto = {
  inputCode: number;
}

type CreateWalletResponseDto = {
  id: number;
  userName: string;
  walletNumber: string;
  currencyCode: string;
  currencyName: string;
  balance: number;
  externalAccountNumber: string;
}

type FieldError = {
  defaultMessage?: string;
  message?: string;
};

export default function AccountRegistrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currency = searchParams.get("currency") || "KRW"
  const chargeAmount = searchParams.get("amount") || "0"
  const authorizationCode = searchParams.get("code") || ""

  const [step, setStep] = useState<number>(0)
  const [accountNumber, setAccountNumber] = useState<string>("")
  const [depositorName, setDepositorName] = useState<string>("")
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false)

  // Get currency charge unit
  const getCurrencyChargeUnit = (currencyCode: string): number => {
    const chargeUnits: Record<string, number> = {
      KRW: 10000,
      USD: 10,
      EUR: 10,
      JPY: 1000,
      CNY: 50,
      VND: 200000,
      INR: 800,
    }
    return chargeUnits[currencyCode] || 0
  }

  // Format account number with dashes
  const formatAccountNumber = (value: string) => {
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, "")

    // Format as 15002-123-456789
    if (digitsOnly.length <= 5) {
      return digitsOnly
    } else if (digitsOnly.length <= 8) {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`
    } else {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}-${digitsOnly.slice(8, 14)}`
    }
  }

  // Handle account number input
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "")
    setAccountNumber(formatAccountNumber(rawValue))
  }

  // Add a function to check if the account number is complete
  const isAccountNumberComplete = (accNumber: string): boolean => {
    // Check if the account number has the format xxxxx-xxx-xxxxxx
    // This means it should have at least 14 digits (5+3+6)
    const digitsOnly = accNumber.replace(/\D/g, "")
    return digitsOnly.length >= 14
  }

  // Handle next step
  const handleNext = () => {
    if (step === 0) {
      if (!accountNumber || !isAccountNumberComplete(accountNumber)) {
        alert('올바른 계좌번호를 입력해 주세요.');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (depositorName.length !== 3) {
        alert('입금자명(숫자 3자리)을 입력해 주세요.');
        return;
      }
      setShowVerificationModal(true);
    }
  }

  // Handle verification confirmation
  const handleVerificationConfirm = async () => {
    try {
      const token = await getValidToken();
      
      // 1. 인증 코드 요청
      const verificationRequest: VerificationCodeRequestDto = {
        externalBankAccountNumber: accountNumber
      };
      console.log('Account Registration API params:', verificationRequest);

      const verificationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/verification-code?authorizationCode=${authorizationCode}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(verificationRequest)
        }
      );

      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.json();
        let errorMsg = '인증 코드 요청에 실패했습니다.';
        
        if (errorData.errorCode) {
          switch (errorData.errorCode) {
            case "HWANBEE_001": errorMsg = "인증 코드 요청에 실패했습니다."; break;
            case "HWANBEE_002": errorMsg = "인증 코드 검증에 실패했습니다."; break;
            case "HWANBEE_003": errorMsg = "계좌 정보가 올바르지 않거나 소유자가 일치하지 않습니다."; break;
            case "HWANBEE_004": errorMsg = "계좌 인증에 실패했습니다."; break;
            case "HWANBEE_005": errorMsg = "계좌 연결 중 오류가 발생했습니다."; break;
            case "HWANBEE_006": errorMsg = "환비 토큰 발급에 실패했습니다."; break;
            case "HWANBEE_007": errorMsg = "환비 송금 API 요청에 실패했습니다."; break;
            case "HWANBEE_008": errorMsg = "환전 정보 조회에 실패했습니다."; break;
            case "HWANBEE_009": errorMsg = "환전 진행에 실패했습니다."; break;
            case "RCG_001": errorMsg = "외화는 직접 충전이 불가능합니다."; break;
            case "RCG_002": errorMsg = "환율 정보를 불러오는 데 실패했습니다."; break;
            case "RCG_003": errorMsg = "수수료 계산에 실패했습니다."; break;
            case "RCG_004": errorMsg = "연결된 계좌 정보를 찾을 수 없습니다."; break;
            case "RCG_005": errorMsg = "충전 금액이 유효하지 않습니다."; break;
            case "RCG_006": errorMsg = "충전 금액은 만원 단위여야 합니다."; break;
            default:
              if (errorData.message) errorMsg = errorData.message;
          }
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMsg = errorData.errors.map((err: FieldError) => err.defaultMessage || err.message).join('\n');
        }
        
        alert(errorMsg);
        setShowVerificationModal(false);
        return;
      }

      const verificationResult = await verificationResponse.json() as VerificationCodeResponseDto;
      if (!verificationResult.data) {
        throw new Error('Invalid response format');
      }

      // 2. 환비 API에 인증 코드 검증 요청
      const verificationCheckRequest: VerificationCheckRequestDto = {
        transactionId: verificationResult.data.transactionId,
        inputCode: Number.parseInt(depositorName)
      };

      const verificationCheckResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/verification-check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(verificationCheckRequest)
        }
      );

      if (!verificationCheckResponse.ok) {
        const errorData = await verificationCheckResponse.json();
        let errorMsg = '인증 코드 검증에 실패했습니다.';
        
        if (errorData.errorCode) {
          switch (errorData.errorCode) {
            case "HWANBEE_001": errorMsg = "인증 코드 요청에 실패했습니다."; break;
            case "HWANBEE_002": errorMsg = "인증 코드 검증에 실패했습니다."; break;
            case "HWANBEE_003": errorMsg = "계좌 정보가 올바르지 않거나 소유자가 일치하지 않습니다."; break;
            case "HWANBEE_004": errorMsg = "계좌 인증에 실패했습니다."; break;
            case "HWANBEE_005": errorMsg = "계좌 연결 중 오류가 발생했습니다."; break;
            case "HWANBEE_006": errorMsg = "환비 토큰 발급에 실패했습니다."; break;
            case "HWANBEE_007": errorMsg = "환비 송금 API 요청에 실패했습니다."; break;
            case "HWANBEE_008": errorMsg = "환전 정보 조회에 실패했습니다."; break;
            case "HWANBEE_009": errorMsg = "환전 진행에 실패했습니다."; break;
            case "RCG_001": errorMsg = "외화는 직접 충전이 불가능합니다."; break;
            case "RCG_002": errorMsg = "환율 정보를 불러오는 데 실패했습니다."; break;
            case "RCG_003": errorMsg = "수수료 계산에 실패했습니다."; break;
            case "RCG_004": errorMsg = "연결된 계좌 정보를 찾을 수 없습니다."; break;
            case "RCG_005": errorMsg = "충전 금액이 유효하지 않습니다."; break;
            case "RCG_006": errorMsg = "충전 금액은 만원 단위여야 합니다."; break;
            default:
              if (errorData.message) errorMsg = errorData.message;
          }
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMsg = errorData.errors.map((err: FieldError) => err.defaultMessage || err.message).join('\n');
        }
        
        alert(errorMsg);
        setShowVerificationModal(false);
        return;
      }

      // 3. 지갑 생성
      const createWalletRequest: CreateWalletRequestDto = {
        inputCode: Number.parseInt(depositorName)
      };

      const createWalletResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(createWalletRequest)
      });

      if (!createWalletResponse.ok) {
        const errorData = await createWalletResponse.json();
        let errorMsg = '계좌 인증에 실패했습니다.';
        
        if (errorData.errorCode) {
          switch (errorData.errorCode) {
            case "HWANBEE_001": errorMsg = "인증 코드 요청에 실패했습니다."; break;
            case "HWANBEE_002": errorMsg = "인증 코드 검증에 실패했습니다."; break;
            case "HWANBEE_003": errorMsg = "계좌 정보가 올바르지 않거나 소유자가 일치하지 않습니다."; break;
            case "HWANBEE_004": errorMsg = "계좌 인증에 실패했습니다."; break;
            case "HWANBEE_005": errorMsg = "계좌 연결 중 오류가 발생했습니다."; break;
            case "HWANBEE_006": errorMsg = "환비 토큰 발급에 실패했습니다."; break;
            case "HWANBEE_007": errorMsg = "환비 송금 API 요청에 실패했습니다."; break;
            case "HWANBEE_008": errorMsg = "환전 정보 조회에 실패했습니다."; break;
            case "HWANBEE_009": errorMsg = "환전 진행에 실패했습니다."; break;
            case "RCG_001": errorMsg = "외화는 직접 충전이 불가능합니다."; break;
            case "RCG_002": errorMsg = "환율 정보를 불러오는 데 실패했습니다."; break;
            case "RCG_003": errorMsg = "수수료 계산에 실패했습니다."; break;
            case "RCG_004": errorMsg = "연결된 계좌 정보를 찾을 수 없습니다."; break;
            case "RCG_005": errorMsg = "충전 금액이 유효하지 않습니다."; break;
            case "RCG_006": errorMsg = "충전 금액은 만원 단위여야 합니다."; break;
            default:
              if (errorData.message) errorMsg = errorData.message;
          }
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMsg = errorData.errors.map((err: FieldError) => err.defaultMessage || err.message).join('\n');
        }
        
        alert(errorMsg);
        setShowVerificationModal(false);
        return;
      }

      const result = await createWalletResponse.json();
      if (!result.data) {
        throw new Error('Invalid response format');
      }

      const walletData = result.data as CreateWalletResponseDto;
      
      // 성공 메시지 표시
      alert(`지갑이 성공적으로 생성되었습니다.\n지갑번호: ${walletData.walletNumber}`);

      router.push(`/wallet/charge?currency=${currency}`);
    } catch (error) {
      console.error('Error registering account:', error);
      if (error instanceof Error && error.message === "No token found") {
        router.push("/login");
      } else {
        alert(error instanceof Error ? error.message : '계좌 등록 중 오류가 발생했습니다.');
      }
      setShowVerificationModal(false);
    }
  };

  // Format currency for display
  const formatCurrency = (value: string, code: string) => {
    const numValue = Number.parseInt(value, 10)
    if (isNaN(numValue)) return `0 ${code}`
    return `${numValue.toLocaleString()} ${code}`
  }

  // Render account number input step
  const renderAccountNumberInput = () => (
    <div className="p-4 flex-1">
      <div className="mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 mr-3 overflow-hidden">
            <Image
              src="/images/hwanbi-bank-logo.png"
              alt="환비은행"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <h2 className="text-xl font-medium text-gray-800">환비은행</h2>
        </div>
        <p className="text-lg font-medium text-blue-500 mt-2">계좌 번호를 입력해 주세요.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-2">계좌 번호</label>
        <input
          type="text"
          value={accountNumber}
          onChange={handleAccountNumberChange}
          placeholder="계좌 번호를 입력해 주세요."
          className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-lg"
        />
      </div>

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
            <span className="text-white text-sm font-bold">i</span>
          </div>
          <span className="font-medium">충전 정보</span>
        </div>
        <div className="pl-10">
          <p className="text-gray-600 mb-1">통화: {currency}</p>
          <p className="text-gray-600 mb-1">충전 금액: {formatCurrency(chargeAmount, currency)}</p>
          <p className="text-gray-600">
            충전 단위: {getCurrencyChargeUnit(currency).toLocaleString()} {currency}
          </p>
        </div>
      </div>
    </div>
  )

  // Render verification step
  const renderVerificationStep = () => (
    <div className="p-4 flex-1">
      <div className="mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 mr-3 overflow-hidden">
            <Image
              src="/images/hwanbi-bank-logo.png"
              alt="환비은행"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <h2 className="text-xl font-medium text-gray-800">환비은행 계좌로</h2>
        </div>
        <p className="text-lg font-medium text-blue-500 mt-2">입금된 내역을 확인해 주세요.</p>
        <p className="text-gray-500 text-sm mt-2">계좌를 개설한 은행앱, 웹뱅킹, ATM을 통해 확인해 주세요.</p>
      </div>

      <div className="bg-gray-100 rounded-lg p-5 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-xl font-bold">₩</span>
          </div>
          <span className="text-gray-800 font-medium text-lg">{accountNumber}</span>
        </div>

        <div className="flex justify-between mb-3">
          <span className="text-gray-600 font-medium">입금자명</span>
          <span className="text-gray-600 font-medium">입금</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl font-bold mr-2">HB</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 bg-white border border-gray-300 rounded-md text-center text-xl font-bold"
                  value={depositorName[index] || ""}
                  onChange={(e) => {
                    const newValue = e.target.value
                    if (/^[0-9]$/.test(newValue) || newValue === "") {
                      const newDepositorName = depositorName.split("")
                      newDepositorName[index] = newValue
                      setDepositorName(newDepositorName.join(""))

                      // Auto-focus next input if a digit was entered
                      if (newValue !== "" && index < 2) {
                        const nextInput = e.target.parentElement?.nextElementSibling?.querySelector("input")
                        if (nextInput) nextInput.focus()
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle backspace to go to previous input
                    if (e.key === "Backspace" && !depositorName[index] && index > 0) {
                      const prevInput = e.currentTarget.parentElement?.previousElementSibling?.querySelector("input")
                      if (prevInput) prevInput.focus()
                    }
                  }}
                />
              ))}
            </div>
          </div>
          <span className="font-bold text-xl">1원</span>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={depositorName.length < 3}
        className={`w-full py-4 rounded-full text-white font-medium text-lg ${
          depositorName.length === 3 ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        {depositorName.length === 3 ? `HB 뒤 3자리 조회` : "입금자명을 입력해주세요"}
      </button>
    </div>
  )

  // Render verification modal
  const renderVerificationModal = () => (
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
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={() => setShowVerificationModal(false)}
      >
        <div className="fixed inset-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div
            className="bg-white w-full max-w-xs rounded-2xl overflow-hidden"
            style={{
              animation: "scaleIn 0.3s ease-out",
            }}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-white" />
              </div>
              <p className="text-xl font-medium mb-6">인증이 완료되었습니다.</p>
              <button
                onClick={handleVerificationConfirm}
                className="w-full py-4 bg-blue-500 text-white font-medium rounded-full text-lg cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <button onClick={() => router.back()} className="text-gray-700 cursor-pointer">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">계좌등록</h1>
        <div className="w-6"></div>
      </header>

      {step === 0 ? renderAccountNumberInput() : step === 1 ? renderVerificationStep() : renderVerificationModal()}

      {step === 0 && (
        <div className="p-4 mt-auto">
          <button
            onClick={handleNext}
            disabled={!accountNumber || !isAccountNumberComplete(accountNumber)}
            className={`w-full py-4 text-center text-white font-medium rounded-full text-lg ${
              accountNumber && isAccountNumberComplete(accountNumber) ? "bg-blue-500 cursor-pointer" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            다음
          </button>
        </div>
      )}

      {showVerificationModal && renderVerificationModal()}
    </div>
  )
}
