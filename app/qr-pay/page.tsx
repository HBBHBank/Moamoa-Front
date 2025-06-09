"use client";

import { useState, useEffect, useRef } from "react";
import ModalPortal from "@/components/modal-portal";

// wallet/transfer/page.tsx 스타일의 리치 모달
function RichModal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <ModalPortal>
      <style jsx global>{`
        body { overflow: hidden; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", animation: "fadeIn 0.2s" }}
      >
        <div
          ref={ref}
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-2 animate-fadeIn"
          style={{ animation: "scaleIn 0.2s" }}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

export default function QrPayPage() {
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 금액 입력 핸들러
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
  };

  // 다음 버튼 클릭
  const handleNext = () => {
    if (amount) setShowConfirm(true);
  };

  // 확인 버튼 클릭
  const handleConfirm = () => {
    setShowConfirm(false);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xs flex flex-col items-center">
        <h1 className="text-xl font-bold mb-6">QR 결제</h1>
        <label className="w-full mb-4">
          <span className="block text-gray-700 mb-2">보낼 금액</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount}
            onChange={handleAmountChange}
            placeholder="금액을 입력하세요"
            className="w-full border border-gray-300 rounded px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <button
          onClick={handleNext}
          disabled={!amount}
          className={`w-full py-3 rounded bg-blue-500 text-white font-semibold text-lg mt-2 ${!amount ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
        >
          다음
        </button>
      </div>

      {/* 확인 모달 */}
      {showConfirm && (
        <RichModal onClose={() => setShowConfirm(false)}>
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#3B82F6"/></svg>
            </div>
            <div className="text-lg font-semibold mb-2">김피사님에게 {Number(amount).toLocaleString()}원을 보내는 게 맞습니까?</div>
            <div className="text-gray-500 text-sm mb-6">확인 후 결제가 진행됩니다.</div>
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </RichModal>
      )}

      {/* 결제 완료 모달 */}
      {showSuccess && (
        <RichModal onClose={() => setShowSuccess(false)}>
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg>
            </div>
            <div className="text-2xl font-bold mb-2">결제 완료!</div>
            <div className="text-lg mb-4">김피사님에게 {Number(amount).toLocaleString()}원이 성공적으로 송금되었습니다.</div>
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-4 px-8 py-3 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
            >
              닫기
            </button>
          </div>
        </RichModal>
      )}
    </div>
  );
}
