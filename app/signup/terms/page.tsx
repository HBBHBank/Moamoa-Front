"use client"

import { useState } from "react"
import { ChevronLeft, X, ChevronRight, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TermsPage() {
  const router = useRouter()

  // Updated to match the backend DTO structure
  const [agreements, setAgreements] = useState({
    all: false,
    serviceTermsAgreed: false, // 서비스 이용 약관 (필수)
    privacyPolicyAgreed: false, // 개인정보 처리방침 (필수)
    marketingAgreed: false, // 마케팅 수신 동의 (선택)
  })

  const handleAllChange = () => {
    const newValue = !agreements.all
    setAgreements({
      all: newValue,
      serviceTermsAgreed: newValue,
      privacyPolicyAgreed: newValue,
      marketingAgreed: newValue,
    })
  }

  const handleSingleChange = (term: keyof typeof agreements) => {
    if (term === "all") return handleAllChange()

    const newAgreements = {
      ...agreements,
      [term]: !agreements[term],
    }

    // Check if all individual terms are checked
    const allChecked =
      newAgreements.serviceTermsAgreed && newAgreements.privacyPolicyAgreed

    setAgreements({
      ...newAgreements,
      all: allChecked,
    })
  }

  // Check if all required terms are agreed to
  const isAllRequiredChecked = agreements.serviceTermsAgreed && agreements.privacyPolicyAgreed

  const handleConfirm = () => {
    if (!isAllRequiredChecked) {
      alert("필수 약관에 모두 동의해야 합니다.")
      return
    }

    // Store agreement data to be used in the signup process
    localStorage.setItem(
      "termsAgreement",
      JSON.stringify({
        serviceTermsAgreed: agreements.serviceTermsAgreed,
        privacyPolicyAgreed: agreements.privacyPolicyAgreed,
        marketingAgreed: agreements.marketingAgreed,
      }),
    )

    // Navigate to the next step in the signup process
    router.push("/signup/form")
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 p-4">
        <Link href="/" className="text-gray-700">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">약관동의</h1>
        <Link href="/" className="text-gray-700">
          <X size={24} />
        </Link>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {/* More options button */}
        <div className="mb-4 flex justify-center">
          <button className="text-gray-500 cursor-pointer">
            <span className="text-2xl">...</span>
          </button>
        </div>

        {/* Agree to all */}
        <div className="mb-6 rounded-lg border border-gray-200 p-4">
          <label className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                agreements.all ? "bg-[#4DA9FF]" : "bg-gray-200"
              } cursor-pointer`}
              onClick={handleAllChange}
            >
              <Check className="h-5 w-5 text-white cursor-pointer" />
            </div>
            <span className="text-base font-medium">약관 전체 동의</span>
          </label>
        </div>

        {/* Divider */}
        <div className="my-6 h-px w-full bg-gray-200"></div>

        {/* Individual agreements - Updated to match backend structure */}
        <div className="space-y-5">
          {/* Service Terms - Required */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  agreements.serviceTermsAgreed ? "bg-[#4DA9FF]" : "bg-gray-200"
                } cursor-pointer`}
                onClick={() => handleSingleChange("serviceTermsAgreed")}
              >
                <Check className="h-5 w-5 text-white cursor-pointer" />
              </div>
              <span className="text-base">[필수] 서비스 이용 약관 동의</span>
            </label>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>

          {/* Privacy Policy - Required */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  agreements.privacyPolicyAgreed ? "bg-[#4DA9FF]" : "bg-gray-200"
                } cursor-pointer`}
                onClick={() => handleSingleChange("privacyPolicyAgreed")}
              >
                <Check className="h-5 w-5 text-white cursor-pointer" />
              </div>
              <span className="text-base">[필수] 개인정보 처리방침 동의</span>
            </label>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>

          {/* Marketing - Optional */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  agreements.marketingAgreed ? "bg-[#4DA9FF]" : "bg-gray-200"
                } cursor-pointer`}
                onClick={() => handleSingleChange("marketingAgreed")}
              >
                <Check className="h-5 w-5 text-white cursor-pointer" />
              </div>
              <span className="text-base">[선택] 마케팅 정보 수신 동의</span>
            </label>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="p-4">
        <button
          className={`h-[60px] w-full rounded-[30px] text-center text-lg font-medium text-white ${
            isAllRequiredChecked ? "bg-[#0DAEFF]" : "bg-gray-300"
          } cursor-pointer`}
          disabled={!isAllRequiredChecked}
          onClick={handleConfirm}
        >
          확인
        </button>
      </div>
    </div>
  )
}
