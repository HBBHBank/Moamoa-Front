"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AccountDropdown from "./AccountDropdown";

// Dto 기반 계좌 타입
type VerificationAccountDataDto = {
  verified: boolean;
  accountNumber: string;
  accountStatus?: string;
  currencyCode: string;
  productCode?: string;
  openDate?: string;
  maturityDate?: string;
  accountType?: string;
  message?: string;
};

const currencyMeta: Record<string, { name: string; flag: string; symbol: string }> = {
  USD: { name: "미국 달러", flag: "/images/flags/usa.png", symbol: "$" },
  KRW: { name: "대한민국 원", flag: "/images/flags/korea.png", symbol: "₩" },
  JPY: { name: "일본 엔", flag: "/images/flags/japan.png", symbol: "¥" },
  NOK: { name: "노르웨이 크로네", flag: "/images/flags/norway.png", symbol: "Nkr" },
};

// 예시: 실제로는 API에서 받아와야 함
const mockAccounts: VerificationAccountDataDto[] = [
  { verified: true, accountNumber: "110-123-456789", currencyCode: "KRW" },
  { verified: true, accountNumber: "1002-987-654321", currencyCode: "USD" },
  { verified: true, accountNumber: "3333-12-3456789", currencyCode: "JPY" },
];

// 환비 토큰 가져오기 함수
async function fetchHwanbeeToken(): Promise<string | null> {
  try {
    const res = await fetch("/get-hwanbee-token", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result?.accessToken || null;
  } catch {
    return null;
  }
}

export default function HwanbiAccountExchangePage() {
  const [accounts, setAccounts] = useState<VerificationAccountDataDto[]>([]);
  const [fromAccount, setFromAccount] = useState<string>("");
  const [toAccount, setToAccount] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [pin, setPin] = useState("");

  // 환율 예시 (실제 환율 API 연동 필요)
  const rate = 1429.0; // 1 USD = 1,429 KRW
  const calcToAmount = () => {
    if (!amount || !fromAcc || !toAcc) return "";
    const amt = parseFloat(amount);
    if (fromAcc.currencyCode === "KRW" && toAcc.currencyCode === "USD") {
      return (amt / rate).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (fromAcc.currencyCode === "USD" && toAcc.currencyCode === "KRW") {
      return (amt * rate).toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    // 기타 통화쌍은 필요에 따라 추가
    return amt.toLocaleString();
  };

  // 환율 안내 문구
  const getRateText = () => {
    if (!fromAcc || !toAcc) return "";
    if (fromAcc.currencyCode === "KRW" && toAcc.currencyCode === "USD") {
      return `KRW 1 ≈ USD ${(1 / rate).toFixed(4)}`;
    }
    if (fromAcc.currencyCode === "USD" && toAcc.currencyCode === "KRW") {
      return `USD 1 ≈ KRW ${rate.toLocaleString()}`;
    }
    return "";
  };

  // 계좌 불러오기 (실제는 API)
  useEffect(() => {
    // TODO: fetch from API
    setAccounts(mockAccounts.filter(acc => acc.verified));
    if (mockAccounts.length > 0) {
      setFromAccount(mockAccounts[0].accountNumber);
      setToAccount(mockAccounts.length > 1 ? mockAccounts[1].accountNumber : "");
    }
  }, []);

  // 선택된 계좌 정보
  const fromAcc = accounts.find(acc => acc.accountNumber === fromAccount);
  const toAcc = accounts.find(acc => acc.accountNumber === toAccount);

  // 키패드 입력
  const handleKeypad = (val: string) => {
    if (val === "del") {
      setAmount((prev) => prev.slice(0, -1));
    } else {
      setAmount((prev) => (prev === "0" ? val : prev + val));
    }
  };

  // 환전 버튼 클릭
  const handleExchange = () => {
    setShowConfirm(true);
  };

  // 확인 모달에서 환전 진행
  const handleConfirm = async () => {
    setShowConfirm(false);
    // 1. 환비 accessToken 가져오기
    const hwanbeeToken = await fetchHwanbeeToken();
    if (!hwanbeeToken) {
      alert("환비 인증 토큰을 가져올 수 없습니다. 다시 로그인해 주세요.");
      return;
    }
    // 2. verification/confirm API 호출 (예시)
    try {
      const res = await fetch("http://34.121.151.95:8080/api/accounts/v1/verification/confirm", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hwanbeeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAccount,
          toAccount,
          amount,
        }),
      });
      if (!res.ok) {
        alert("환전 요청에 실패했습니다.");
        return;
      }
      // 성공 시 PIN 입력 단계로 진행
      setShowPin(true);
    } catch {
      alert("환전 요청 중 오류가 발생했습니다.");
    }
  };

  // 핀 입력 완료
  const handlePin = (num: string) => {
    if (num.length === 6) {
      setShowPin(false);
      setShowComplete(true);
    } else {
      setPin(num);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center bg-white p-4 shadow-sm">
        <Link href="/home" className="p-2">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <span className="text-lg font-medium text-gray-800 mx-auto">환비 실 계좌 환전</span>
        <div className="w-10" />
      </header>
      <div className="flex-1 flex flex-col items-center justify-start px-2 py-8 overflow-auto">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm font-medium max-w-lg w-full">
          ※ 이 페이지는 <b>모아모아 지갑이 아닌, 환비의 실 계좌끼리 환전</b>을 위한 서비스입니다.<br />
          (실제 은행 계좌 간 환전/이체)
        </div>
        {/* 환전 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 max-w-lg w-full border border-gray-100">
          {/* 계좌 선택 - 한 줄, 카드형, 가운데 →, 드롭다운은 아이콘만 */}
          <div className="flex flex-col items-center space-y-4 min-w-0 pb-2">
            {/* From 계좌 - 국기+계좌번호만(하이픈 없이) */}
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 bg-white shadow-sm w-full max-w-full">
              {fromAcc && currencyMeta[fromAcc.currencyCode]?.flag && (
                <img src={currencyMeta[fromAcc.currencyCode].flag} alt={fromAcc.currencyCode} className="w-8 h-8 mr-3" />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center min-w-0">
                  <span className="text-gray-700 font-mono text-lg">{fromAcc?.accountNumber?.replace(/-/g, "")}</span>
                </div>
              </div>
            </div>
            {/* Arrow */}
            <span className="my-2 text-3xl font-bold text-gray-500">↓</span>
            {/* To 계좌 - 국기+계좌번호만, 통화 코드 없이 */}
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 bg-white shadow-sm w-full max-w-full">
              {toAcc && currencyMeta[toAcc.currencyCode]?.flag && (
                <img src={currencyMeta[toAcc.currencyCode].flag} alt={toAcc.currencyCode} className="w-8 h-8 mr-3" />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center min-w-0">
                  <span className="ml-2 text-gray-500 font-mono truncate">({toAcc?.accountNumber})</span>
                </div>
              </div>
              <div className="relative w-full">
                <AccountDropdown
                  accounts={accounts.filter(acc => acc.currencyCode !== 'KRW')}
                  value={toAccount}
                  onChange={setToAccount}
                  currencyMeta={currencyMeta}
                  onlyCode={true}
                />
              </div>
            </div>
          </div>
          {/* 환율 및 금액 입력 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-700">{fromAcc?.currencyCode}</span>
              <span className="text-gray-400">1 {fromAcc ? currencyMeta[fromAcc.currencyCode]?.symbol : ""}</span>
            </div>
            <span className="text-xs text-gray-500">{getRateText()}</span>
          </div>
          {/* 금액 입력 및 키패드 */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">환전 가능 금액</span>
              <span className="text-gray-700 text-lg font-bold">{fromAcc ? currencyMeta[fromAcc.currencyCode]?.symbol : ""} {amount || '0'}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">{toAcc?.currencyCode} 환산</span>
              <span className="text-blue-600 font-semibold text-lg">{toAcc ? currencyMeta[toAcc.currencyCode]?.symbol : ""} {calcToAmount() || '0'}</span>
            </div>
            {/* 키패드 */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[...'1234567890'].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="bg-gray-100 rounded-xl py-6 text-2xl font-semibold hover:bg-blue-50 transition"
                  onClick={() => handleKeypad(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="bg-gray-100 rounded-xl py-6 text-2xl font-semibold hover:bg-blue-50 transition col-span-2"
                onClick={() => handleKeypad("del")}
              >
                삭제
              </button>
            </div>
          </div>
          <button
            type="button"
            className="w-full bg-[#2196F3] text-white font-semibold py-3 rounded-lg hover:bg-[#0DAEFF] transition mt-6"
            onClick={handleExchange}
            disabled={!amount || !fromAccount || !toAccount || fromAccount === toAccount}
          >
            환전하기
          </button>
        </div>
      </div>
      {/* 환전 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-xs w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">최종 환전금액 확인</h3>
            <div className="mb-2 text-gray-700">환전신청금액: <b>{amount} {fromAcc ? currencyMeta[fromAcc.currencyCode]?.symbol : ""}</b></div>
            <div className="mb-4 text-gray-700">최종 환전금액: <b>{calcToAmount()} {toAcc ? currencyMeta[toAcc.currencyCode]?.symbol : ""}</b></div>
            <div className="flex space-x-2">
              <button className="flex-1 py-2 rounded bg-gray-200 text-gray-700 font-medium" onClick={() => setShowConfirm(false)}>취소</button>
              <button className="flex-1 py-2 rounded bg-[#2196F3] text-white font-medium" onClick={handleConfirm}>확인</button>
            </div>
          </div>
        </div>
      )}
      {/* 핀 입력 모달 */}
      {showPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-xs w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">암호 입력</h3>
            <p className="mb-4 text-gray-500">트랜잭션 암호를 입력하세요.</p>
            <div className="flex justify-center mb-4 space-x-2">
              {[0,1,2,3,4,5].map((_, idx) => (
                <div key={idx} className={`w-6 h-6 border-b-2 ${pin.length > idx ? 'border-blue-500' : 'border-gray-300'}`}></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...'1234567890'].map(num => (
                <button
                  key={num}
                  type="button"
                  className="bg-gray-100 rounded-lg py-3 text-xl font-semibold hover:bg-blue-100 transition"
                  onClick={() => handlePin(pin + num)}
                  disabled={pin.length >= 6}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="bg-gray-100 rounded-lg py-3 text-xl font-semibold hover:bg-blue-100 transition col-span-2"
                onClick={() => setPin(pin.slice(0, -1))}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 환전 완료 모달 */}
      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-xs w-full shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-4">환전완료</h3>
            <div className="mb-4 text-2xl font-bold text-blue-600">{calcToAmount()} {toAcc ? currencyMeta[toAcc.currencyCode]?.symbol : ""}</div>
            <button className="w-full bg-[#2196F3] text-white font-semibold py-3 rounded-lg hover:bg-[#0DAEFF] transition" onClick={() => { setShowComplete(false); setAmount(""); setPin(""); }}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
} 