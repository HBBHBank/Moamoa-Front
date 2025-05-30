"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import QrScanner from "qr-scanner"
import { QrCode, RefreshCw } from "lucide-react"

const wallets = [
  { code: "KRW", name: "대한민국 원화", balance: 1379, flag: "/images/flags/korea.png" },
  { code: "USD", name: "미국 달러", balance: 100, flag: "/images/flags/usa.png" },
  { code: "JPY", name: "일본 엔화", balance: 5000, flag: "/images/flags/japan.png" },
]

export default function PaymentQRPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"generate" | "scan">("generate")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [qrError, setQrError] = useState(false)
  const [walletModal, setWalletModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(wallets[0])
  const [infoModal, setInfoModal] = useState(false)

  // QR 스캔 탭에서만 카메라 활성화
  useEffect(() => {
    let qrScanner: QrScanner | null = null
    if (tab === "scan") {
      QrScanner.hasCamera().then(hasCamera => {
        if (!hasCamera) {
          setQrError(true)
        } else {
          setQrError(false)
          if (videoRef.current) {
            qrScanner = new QrScanner(
              videoRef.current,
              result => {
                // 실제 서비스에서는 result.data 활용
                alert(`QR 인식: ${result.data}`)
              },
              {
                preferredCamera: "environment",
                maxScansPerSecond: 5,
                highlightScanRegion: true,
              }
            )
            qrScanner.start().catch(() => setQrError(true))
          }
        }
      })
    }
    return () => {
      if (qrScanner) qrScanner.destroy()
    }
  }, [tab])

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* 헤더 - payment/page.tsx와 동일하게 */}
      <header className="relative flex items-center justify-center bg-white p-4 shadow-sm">
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 p-1 cursor-pointer hover:bg-gray-100 rounded-full transition"
          onClick={() => router.back()}
        >
          <svg width="24" height="24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="text-base font-medium text-gray-800">QR 결제</span>
      </header>

      {/* 탭 - 첨부 이미지 스타일 */}
      <div className="flex justify-center px-4 pt-4">
        <div className="relative flex w-full max-w-[420px] bg-transparent rounded-2xl">
          {/* 배경 박스 */}
          <div className="absolute inset-0 bg-[#f3f4f6] rounded-2xl" />
          {/* 이동하는 하얀색 박스 */}
          <div
            className={`absolute top-0 left-0 w-1/2 h-full transition-transform duration-200 z-10 rounded-2xl shadow ${tab === "generate" ? "translate-x-0" : "translate-x-full"} bg-white`}
            style={{boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)'}}
          />
          <div className="relative flex w-full z-20">
            <button
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-base font-semibold rounded-2xl transition-all duration-200 ${tab === "generate" ? "text-gray-900" : "text-gray-500"} hover:bg-gray-100 cursor-pointer`}
              style={{zIndex: 30}}
              onClick={() => setTab("generate")}
            >
              <QrCode className="w-5 h-5" />
              QR 생성
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-base font-semibold rounded-2xl transition-all duration-200 ${tab === "scan" ? "text-gray-900" : "text-gray-500"} hover:bg-gray-100 cursor-pointer`}
              style={{zIndex: 30}}
              onClick={() => setTab("scan")}
            >
              QR 스캔
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 flex flex-col items-center px-4 pt-6">
        {tab === "generate" ? (
          <div className="w-full flex flex-col items-center">
            {/* QR 생성 카드 - 이전 디자인 */}
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-0 shadow-lg flex flex-col items-center relative mb-6" style={{minHeight: 420}}>
              {/* 상단: 로고 이미지 + 아이콘 */}
              <div className="w-full flex items-center justify-between px-6 pt-5 pb-2">
                <Image src="/images/moamoa-header-logo.png" alt="MOAMOA" width={90} height={32} className="object-contain" />
                <div className="flex gap-2">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f5f5] text-gray-400 text-base shadow border border-gray-200 hover:bg-gray-200 cursor-pointer transition" onClick={() => setInfoModal(true)}><span className="text-lg font-bold">?</span></button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f5f5] text-gray-400 text-base shadow border border-gray-200 hover:bg-gray-200 cursor-pointer transition"><RefreshCw className="w-5 h-5" /></button>
                </div>
              </div>
              {/* QR 생성 영역 */}
              <div className="flex-1 w-full flex flex-col items-center justify-center pb-8">
                <div className="mx-auto mt-2 mb-2 w-64 h-64 rounded-lg bg-[#ddd] flex items-center justify-center">
                  <span className="text-gray-700 text-base">QR 생성</span>
                </div>
              </div>
            </div>
            {/* 결제지갑/금액/지갑변경/충전하기 카드 */}
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-4 flex items-center justify-between shadow-md border border-gray-100 mt-2">
              <div className="flex items-center gap-3">
                <Image src={selectedWallet.flag} alt={selectedWallet.code} width={32} height={32} className="rounded-full" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">결제할 지갑</span>
                  <span className="text-xl font-bold text-gray-900">{selectedWallet.balance.toLocaleString()} {selectedWallet.code}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full bg-[#f5f5f5] text-gray-400 text-sm px-4 py-2 font-semibold hover:bg-[#e6eaf0] transition cursor-pointer" onClick={() => setWalletModal(true)}>지갑변경</button>
                <button className="rounded-full bg-[#f5f5f5] text-gray-400 text-sm px-4 py-2 font-semibold hover:bg-[#e6eaf0] transition cursor-pointer" onClick={() => router.push("/wallet/charge")}>충전하기</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* QR 스캔 카드: 상단바 없이 전체가 카메라 */}
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-0 shadow-lg flex flex-col items-center relative mb-6 overflow-hidden" style={{minHeight: 420}}>
              <div className="flex-1 w-full flex flex-col items-center justify-center h-full">
                {!qrError && (
                  <video
                    ref={videoRef}
                    className="w-full h-[420px] object-cover rounded-2xl border-none bg-black"
                    autoPlay
                    muted
                  />
                )}
                {qrError && (
                  <div className="w-full h-[420px] flex flex-col items-center justify-center text-gray-400 text-base bg-[#f5f5f5] rounded-2xl border-none">
                    실행할 수 없음<br />카메라가 작동하지 않는다면 휴대기기의 카메라(QR리더기)를 직접 작동시켜 주세요.
                  </div>
                )}
              </div>
            </div>
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-4 flex items-center justify-between shadow-md border border-gray-100 mt-2">
              <div className="flex items-center gap-3">
                <Image src={selectedWallet.flag} alt={selectedWallet.code} width={32} height={32} className="rounded-full" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 mb-0.5">결제할 지갑</span>
                  <span className="text-xl font-bold text-gray-900">{selectedWallet.balance.toLocaleString()} {selectedWallet.code}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full bg-[#f5f5f5] text-gray-400 text-sm px-4 py-2 font-semibold hover:bg-[#e6eaf0] transition cursor-pointer" onClick={() => setWalletModal(true)}>지갑변경</button>
                <button className="rounded-full bg-[#f5f5f5] text-gray-400 text-sm px-4 py-2 font-semibold hover:bg-[#e6eaf0] transition cursor-pointer" onClick={() => router.push("/wallet/charge")}>충전하기</button>
              </div>
            </div>
          </div>
        )}
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

      {/* 안내 모달 */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoModal(false)}>
          <div className="bg-white rounded-3xl w-[90vw] max-w-md p-7 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setInfoModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
            </button>
            <div className="font-bold text-lg text-gray-800 mb-4">QR 결제 안내</div>
            <div className="text-gray-700 text-base mb-4 whitespace-pre-line">
              <span className="font-semibold text-[#2566CF]">QR 생성</span>\n
              상대가 나의 QR 코드를 스캔하고, 상대가 금액을 입력하면 내가 선택한 지갑으로 해당 금액만큼 포인트가 입금됩니다.\n\n
              <span className="font-semibold text-[#2566CF]">QR 스캔</span>\n
              내가 결제할 상대의 QR 코드를 스캔해주세요! 결제할 금액을 입력하면, 해당 금액만큼의 돈이 상대에게 입금됩니다.
            </div>
            <div className="font-semibold text-[#2566CF] mb-2">명심하세요!</div>
            <ul className="text-gray-600 text-sm list-disc pl-5 space-y-1">
              <li>QR 결제는 모아모아 서비스 이용자끼리만 가능합니다.</li>
              <li>QR 결제는 같은 통화끼리만 이용이 가능합니다.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
} 