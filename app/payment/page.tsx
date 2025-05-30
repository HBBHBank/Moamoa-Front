"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

const wallets = [
  { code: "KRW", name: "대한민국 원화", balance: 1379, flag: "/images/flags/korea.png" },
  { code: "USD", name: "미국 달러", balance: 100, flag: "/images/flags/usa.png" },
  { code: "JPY", name: "일본 엔화", balance: 5000, flag: "/images/flags/japan.png" },
]

export default function PaymentMainPage() {
  const router = useRouter()
  const [walletModal, setWalletModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(wallets[0])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 홈화면과 동일한 헤더, 중앙에 타이틀 */}
      <header className="relative flex items-center justify-center bg-white p-4 shadow-sm">
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
          onClick={() => router.back()}
        >
          <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="text-base font-medium text-gray-800">간편 결제</span>
      </header>

      {/* 사용 가능 금액 및 버튼 - 카드 스타일 */}
      <div className="px-4 pt-6">
        <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 mb-1">사용 가능 금액</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-gray-800 tracking-tight">{selectedWallet.balance.toLocaleString()}</span>
              <span className="ml-1 text-xl font-bold text-gray-500">{selectedWallet.code}</span>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              className="rounded-full border border-[#2566CF] text-[#2566CF] text-sm px-5 py-2 font-semibold shadow-sm transition-all duration-150 hover:bg-[#f5faff] active:scale-95 active:shadow-inner cursor-pointer"
              onClick={() => setWalletModal(true)}
            >
              통화선택
            </button>
            <button
              className="rounded-full border border-[#2566CF] text-[#2566CF] text-sm px-5 py-2 font-semibold shadow-sm transition-all duration-150 hover:bg-[#f5faff] active:scale-95 active:shadow-inner cursor-pointer"
              onClick={() => router.push("/wallet/charge")}
            >
              충전하기
            </button>
          </div>
        </div>
      </div>

      {/* QR 현장 결제하기 카드 */}
      <div className="px-4 mt-8">
        <button
          className="w-full rounded-2xl bg-[#2566CF] flex flex-row items-center p-8 shadow-xl transition-all duration-200 hover:shadow-2xl active:scale-95 active:shadow-inner relative min-h-[140px] cursor-pointer"
          onClick={() => router.push("/payment/qr")}
        >
          {/* 왼쪽: 텍스트 + QR 이미지 */}
          <div className="flex-1 flex flex-col items-start justify-center h-full">
            <div className="text-white text-2xl font-bold mb-2 drop-shadow">QR 현장 결제하기</div>
            <div className="text-white text-base opacity-80 mb-6 drop-shadow">모아모아 지갑에서 간단하게 결제할 수 있어요</div>
            <div className="mt-auto">
              {/* Lucide ScanLine 스타일 QR+프레임 아이콘 SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" className="opacity-40 drop-shadow">
                <rect x="7" y="7" width="3" height="3" rx="1"/>
                <rect x="14" y="7" width="3" height="3" rx="1"/>
                <rect x="7" y="14" width="3" height="3" rx="1"/>
                <rect x="14" y="14" width="3" height="3" rx="1"/>
                <path d="M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          {/* 오른쪽: MOAMOA 로고 */}
          <div className="flex items-center h-full ml-6">
            <Image src="/images/moamoa-logo.png" alt="MOAMOA" width={120} height={90} className="drop-shadow-lg" />
          </div>
        </button>
      </div>

      {/* 지갑 선택 모달 */}
      {walletModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setWalletModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-80 max-w-full p-7 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setWalletModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
            </button>
            <div className="font-semibold text-gray-800 mb-6 text-lg text-center">지갑 선택</div>
            <div className="space-y-2">
              {wallets.map(w => (
                <button
                  key={w.code}
                  className={`flex items-center w-full p-3 rounded-xl border transition-all duration-150 shadow-sm hover:shadow-md active:scale-95 active:shadow-inner cursor-pointer ${selectedWallet.code === w.code ? "border-[#2566CF] bg-[#F3F6FA] shadow-lg" : "border-gray-100 bg-white"}`}
                  onClick={() => { setSelectedWallet(w); setWalletModal(false); }}
                >
                  <Image src={w.flag} alt={w.code} width={28} height={28} className="rounded-full mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-800">{w.name}</div>
                    <div className="text-xs text-gray-500">{w.balance.toLocaleString()} {w.code}</div>
                  </div>
                  {selectedWallet.code === w.code && (
                    <svg width="20" height="20" fill="none" stroke="#2566CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 11 9 15 15 7"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
