"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import QrScanner from "qr-scanner"
import { QrCode, RefreshCw } from "lucide-react"
import { getValidToken } from "@/lib/auth"
import { mapCurrencyToFlag } from "@/lib/utils"

// 타입 정의
interface Wallet {
  walletId: number;
  currencyCode: string;
  currencyName: string;
  balance: number;
  walletNumber: string;
  userName: string;
}

interface QrCodeInfoResponseDto {
  walletId: number;
  ownerName: string;
  currencyCode: string;
}

// 에러 코드별 메시지 매핑 함수
function getPaymentErrorMessage(errorCode: string, defaultMsg: string) {
  switch (errorCode) {
    case "QR_001":
      return "QR 코드 생성에 실패했습니다.";
    case "QR_002":
      return "잘못된 파라미터입니다.";
    case "QR_003":
      return "QR 코드가 만료되었습니다.";
    default:
      return defaultMsg || "알 수 없는 오류가 발생했습니다.";
  }
}

export default function PaymentQRPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"generate" | "scan">("generate")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [qrError, setQrError] = useState(false)
  const [walletModal, setWalletModal] = useState(false)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [infoModal, setInfoModal] = useState(false)
  const [qrImageId, setQrImageId] = useState<number | null>(null)
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null)
  const [qrBlobLoading, setQrBlobLoading] = useState(false)
  const [qrBlobError, setQrBlobError] = useState<string | null>(null)
  const [isQrLoading, setIsQrLoading] = useState(false)
  const [qrScanResult, setQrScanResult] = useState<string | null>(null)
  const [qrScanInfo, setQrScanInfo] = useState<QrCodeInfoResponseDto | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [isPaying, setIsPaying] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [qrErrorMsg, setQrErrorMsg] = useState<string | null>(null)

  // 실제 API로 지갑 목록 조회
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const token = await getValidToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/all`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        })
        const data = await res.json()
        setWallets(data.result)
        setSelectedWallet(data.result[0] || null)
      } catch {
        setWallets([])
        setSelectedWallet(null)
      }
    }
    fetchWallets()
  }, [])

  // QR 생성
  const handleGenerateQr = async () => {
    if (!selectedWallet) return;
    setIsQrLoading(true);
    setQrImageId(null);
    setQrErrorMsg(null);
    try {
      const token = await getValidToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/${selectedWallet.walletId}/qr-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      })
      const data = await res.json()
      if (data.code && data.code !== "SUCCESS") {
        setQrImageId(null);
        setQrErrorMsg(getPaymentErrorMessage(data.code, data.message));
        setIsQrLoading(false);
        return;
      }
      const qrImageId = data.result.qrImageId
      setQrImageId(qrImageId)
    } catch {
      setQrImageId(null)
      setQrErrorMsg("QR 코드 생성에 실패했습니다.");
    }
    setIsQrLoading(false);
  }

  // QR 생성 탭 진입 시 자동 생성
  useEffect(() => {
    if (tab === "generate" && selectedWallet && !qrImageId && !isQrLoading) {
      handleGenerateQr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedWallet]);

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
              async result => {
                setQrScanResult(result.data)
                // QR 코드 정보 조회
                try {
                  const token = await getValidToken();
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/qr-code/${result.data}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include"
                  })
                  const data = await res.json()
                  setQrScanInfo(data.result)
                } catch {
                  setQrScanInfo(null)
                }
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

  // QR 이미지 Blob fetch (인증 필요시)
  useEffect(() => {
    if (!qrImageId) return;
    let revokeUrl: string | null = null;
    setQrBlobLoading(true);
    setQrBlobError(null);
    setQrBlobUrl(null);
    (async () => {
      try {
        const token = await getValidToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/qr-code-images/${qrImageId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }
        );
        if (!res.ok) {
          setQrBlobError("QR 이미지 로드 실패");
          setQrBlobLoading(false);
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setQrBlobUrl(url);
        revokeUrl = url;
      } catch {
        setQrBlobError("QR 이미지 로드 실패");
      } finally {
        setQrBlobLoading(false);
      }
    })();
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [qrImageId]);

  // 결제 요청
  const handlePay = async () => {
    if (!qrScanInfo || !selectedWallet) return;
    setIsPaying(true);
    setPayError(null);
    try {
      const token = await getValidToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/use/${qrScanResult}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          sellerWalletId: qrScanInfo.walletId,
          currencyCode: qrScanInfo.currencyCode,
          amount: paymentAmount
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        setPayError(getPaymentErrorMessage(errData.code, errData.message))
        setPaySuccess(false)
      } else {
        setPaySuccess(true)
      }
    } catch {
      setPayError("결제 실패")
      setPaySuccess(false)
    }
    setIsPaying(false);
  }

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
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f5f5] text-gray-400 text-base shadow border border-gray-200 hover:bg-gray-200 cursor-pointer transition" onClick={handleGenerateQr}><RefreshCw className="w-5 h-5" /></button>
                </div>
              </div>
              {/* QR 생성 영역 */}
              <div className="flex-1 w-full flex flex-col items-center justify-center pb-8">
                <div className="mx-auto mt-2 mb-2 w-64 h-64 rounded-lg bg-[#ddd] flex items-center justify-center">
                  {isQrLoading ? (
                    <span className="text-gray-700 text-base">로딩 중...</span>
                  ) : qrImageId ? (
                    qrBlobLoading ? (
                      <span className="text-gray-700 text-base">QR 이미지 로딩 중...</span>
                    ) : qrBlobError ? (
                      <span className="text-red-600 text-base">{qrBlobError}</span>
                    ) : qrBlobUrl ? (
                      <img src={qrBlobUrl} alt="QR 코드" className="w-full h-full object-contain" />
                    ) : null
                  ) : (
                    qrErrorMsg && <div className="mt-2 text-red-600 text-sm text-center">{qrErrorMsg}</div>
                  )}
                </div>
              </div>
            </div>
            {/* 결제지갑/금액/지갑변경/충전하기 카드 */}
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-4 flex items-center justify-between shadow-md border border-gray-100 mt-2">
              <div className="flex items-center gap-3">
                {selectedWallet && (
                  <>
                    <Image src={`/images/flags/${mapCurrencyToFlag(selectedWallet.currencyCode)}`} alt={selectedWallet.currencyCode} width={32} height={32} className="rounded-full" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-0.5">결제할 지갑</span>
                      <span className="text-xl font-bold text-gray-900">{selectedWallet.balance.toLocaleString()} {selectedWallet.currencyCode}</span>
                    </div>
                  </>
                )}
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
            {/* QR 스캔 결과 및 결제 UI */}
            {qrScanInfo && (
              <div className="w-full max-w-[420px] rounded-2xl bg-white p-4 flex flex-col items-center shadow-md border border-gray-100 mt-2">
                <div className="mb-2 text-gray-700 font-semibold">판매자: {qrScanInfo.ownerName}</div>
                <div className="mb-2 text-gray-700">통화: {qrScanInfo.currencyCode}</div>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 p-2 mb-2"
                  placeholder="결제 금액 입력"
                  value={paymentAmount}
                  onChange={event => setPaymentAmount(event.target.value)}
                  min={0}
                />
                <button
                  className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-2 text-center font-medium text-white shadow-md disabled:bg-gray-300 cursor-pointer"
                  onClick={handlePay}
                  disabled={isPaying || !paymentAmount}
                >
                  {isPaying ? "결제 중..." : "결제하기"}
                </button>
                {paySuccess && <div className="mt-2 text-green-600">결제 성공!</div>}
                {payError && <div className="mt-2 text-red-600">{payError}</div>}
              </div>
            )}
            <div className="w-full max-w-[420px] rounded-2xl bg-white p-4 flex items-center justify-between shadow-md border border-gray-100 mt-2">
              <div className="flex items-center gap-3">
                {selectedWallet && (
                  <>
                    <Image src={`/images/flags/${mapCurrencyToFlag(selectedWallet.currencyCode)}`} alt={selectedWallet.currencyCode} width={32} height={32} className="rounded-full" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-0.5">결제할 지갑</span>
                      <span className="text-xl font-bold text-gray-900">{selectedWallet.balance.toLocaleString()} {selectedWallet.currencyCode}</span>
                    </div>
                  </>
                )}
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
                  key={w.walletId}
                  className={`flex items-center w-full p-3 rounded-xl border transition-all duration-150 shadow-sm hover:shadow-md active:scale-95 active:shadow-inner cursor-pointer ${selectedWallet && selectedWallet.walletId === w.walletId ? "border-[#2566CF] bg-[#F3F6FA] shadow-lg" : "border-gray-100 bg-white"}`}
                  onClick={() => { setSelectedWallet(w); setWalletModal(false); }}
                >
                  <Image src={`/images/flags/${mapCurrencyToFlag(w.currencyCode)}`} alt={w.currencyCode} width={28} height={28} className="rounded-full mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-800">{w.currencyName}</div>
                    <div className="text-xs text-gray-500">{w.balance.toLocaleString()} {w.currencyCode}</div>
                  </div>
                  {selectedWallet && selectedWallet.walletId === w.walletId && (
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
              <span className="font-semibold text-[#2566CF]">QR 생성</span>{"\n"}
              상대가 나의 QR 코드를 스캔하고, 상대가 금액을 입력하면 내가 선택한 지갑으로 해당 금액만큼 포인트가 입금됩니다.{"\n\n"}
              <span className="font-semibold text-[#2566CF]">QR 스캔</span>{"\n"}
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