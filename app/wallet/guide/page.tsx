"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function WalletGuidePage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <button onClick={() => router.back()} className="text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">안내</h1>
        <div className="w-6"></div>
      </header>

      <div className="flex-1 p-4">
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="mb-2 font-medium">환불하기</h2>
            <ol className="ml-5 list-decimal space-y-2 text-sm text-gray-700">
              <li>포인트로 충전한 금액은 환불할 수 있습니다.</li>
              <li>환불 시 팝업 환불이 적용됩니다.</li>
            </ol>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="mb-2 font-medium">송금하기</h2>
            <p className="text-sm text-gray-700">
              충전한 금액이 ₩50 이상인 경우 송금할 수 있습니다. 모아모아 회원끼리만 지갑끼리의 송금이 가능합니다.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h2 className="mb-2 font-medium">충전하기</h2>
            <p className="text-sm text-gray-700">같은 통화의 계좌에서만 충전이 가능합니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
