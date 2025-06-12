"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AccountDropdown from "./AccountDropdown";
import { getValidToken } from "@/lib/auth";

type BankAccountResponseDto = {
  id: number;
  accountNumber: string;
  currency: string;
};

const currencyMeta: Record<string, { name: string; flag: string; symbol: string }> = {
  USD: { name: "미국 달러", flag: "/images/flags/usa.png", symbol: "$" },
  KRW: { name: "대한민국 원", flag: "/images/flags/korea.png", symbol: "₩" },
  JPY: { name: "일본 엔", flag: "/images/flags/japan.png", symbol: "¥" },
  NOK: { name: "노르웨이 크로네", flag: "/images/flags/norway.png", symbol: "Nkr" },
};

export default function HwanbiAccountExchangePage() {
  const [accounts, setAccounts] = useState<BankAccountResponseDto[]>([]);
  const [fromAccount, setFromAccount] = useState<string>("");
  const [toAccount, setToAccount] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [pin, setPin] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newCurrency, setNewCurrency] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [addStep, setAddStep] = useState<0 | 1>(0); // 0: 계좌입력, 1: 인증코드입력
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // 환율 정보 fetch
  useEffect(() => {
    // 외화 계좌가 선택된 경우에만 환율 정보 조회
    const fromAcc = accounts.find(acc => acc.accountNumber === fromAccount);
    const toAcc = accounts.find(acc => acc.accountNumber === toAccount);
    // 외화 계좌: KRW가 아닌 계좌
    const fcyAcc = fromAcc && fromAcc.currency !== "KRW" ? fromAcc : toAcc && toAcc.currency !== "KRW" ? toAcc : null;
    if (!fcyAcc) {
      setExchangeRate(null);
      return;
    }
    const fetchRate = async () => {
      try {
        const token = await getValidToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/exchange/rates?currency=${fcyAcc.currency}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });
        const result = await res.json();
        if (result.result && result.result.data && result.result.data.bankOfKoreaRate) {
          setExchangeRate(Number(result.result.data.bankOfKoreaRate));
        } else {
          setExchangeRate(null);
        }
      } catch {
        setExchangeRate(null);
      }
    };
    fetchRate();
  }, [accounts, fromAccount, toAccount]);

  // 환율 예시 (실제 환율 API 연동 필요)
  const calcToAmount = () => {
    if (!amount || !fromAcc || !toAcc || !exchangeRate) return "";
    const amt = parseFloat(amount);
    if (fromAcc.currency === "KRW" && toAcc.currency !== "KRW") {
      return (amt / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (fromAcc.currency !== "KRW" && toAcc.currency === "KRW") {
      return (amt * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    // 기타 통화쌍은 필요에 따라 추가
    return amt.toLocaleString();
  };

  // 환율 안내 문구
  const getRateText = () => {
    if (!fromAcc || !toAcc || !exchangeRate) return "";
    if (fromAcc.currency === "KRW" && toAcc.currency !== "KRW") {
      return `KRW 1 ≈ ${toAcc.currency} ${(1 / exchangeRate).toFixed(4)}`;
    }
    if (fromAcc.currency !== "KRW" && toAcc.currency === "KRW") {
      return `${fromAcc.currency} 1 ≈ KRW ${exchangeRate.toLocaleString()}`;
    }
    return "";
  };

  // 계좌 불러오기 (실제는 API)
  const fetchAccounts = useCallback(async () => {
    try {
      const token = await getValidToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/bank-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      const result = await res.json();
      if (Array.isArray(result.result)) {
        setAccounts(result.result);
        // 기본값: KRW 계좌를 from, 외화 계좌를 to로 자동 설정
        const krw = result.result.find((acc: BankAccountResponseDto) => acc.currency === "KRW");
        const fcy = result.result.find((acc: BankAccountResponseDto) => acc.currency !== "KRW");
        if (krw) setFromAccount(krw.accountNumber);
        if (fcy) setToAccount(fcy.accountNumber);
      }
    } catch {
      alert("계좌 정보를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // 선택된 계좌 정보
  const fromAcc = accounts.find((acc: BankAccountResponseDto) => acc.accountNumber === fromAccount);
  const toAcc = accounts.find((acc: BankAccountResponseDto) => acc.accountNumber === toAccount);

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
    // 환전 요청 (ExchangeDealRequestDto)
    if (!fromAcc || !toAcc) return alert("계좌를 선택해 주세요.");
    // KRW 계좌/외화 계좌 자동 매핑
    const krwAcc = fromAcc.currency === "KRW" ? fromAcc : toAcc.currency === "KRW" ? toAcc : null;
    const fcyAcc = fromAcc.currency !== "KRW" ? fromAcc : toAcc.currency !== "KRW" ? toAcc : null;
    if (!krwAcc || !fcyAcc) return alert("KRW 계좌와 외화 계좌를 모두 선택해 주세요.");
    try {
      const token = await getValidToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/exchange/deal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          krwAccount: krwAcc.accountNumber,
          fcyAccount: fcyAcc.accountNumber,
          krwAmount: Number(amount),
          currencyCode: fcyAcc.currency,
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

  // 계좌 추가(인증코드 발급)
  const handleRequestVerificationCode = async () => {
    if (!newAccountNumber || !newCurrency) return alert("계좌번호와 통화코드를 입력하세요.");
    try {
      const token = await getValidToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/verification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber: newAccountNumber,
          currencyCode: newCurrency
        })
      });
      if (res.status !== 204) {
        alert("인증 코드 발급에 실패했습니다.");
        return;
      }
      alert("인증 코드가 발급되었습니다. 환비 앱에서 코드를 확인하세요.");
    } catch {
      alert("인증 코드 요청 중 오류가 발생했습니다.");
    }
  };

  // 인증코드 검증 및 계좌 연결
  const handleVerifyAndAddAccount = async () => {
    if (!verificationCode) return alert("인증코드를 입력하세요.");
    try {
      const token = await getValidToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/hwanbee-account`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(verificationCode)
      });
      const result = await res.json();
      if (!res.ok || !result.result) {
        alert("계좌 연결에 실패했습니다.");
        return;
      }
      alert("계좌가 성공적으로 연결되었습니다.");
      setShowAddAccount(false);
      setNewAccountNumber("");
      setNewCurrency("");
      setVerificationCode("");
      fetchAccounts();
    } catch {
      alert("계좌 연결 중 오류가 발생했습니다.");
    }
  };

  const renderAddAccountModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center animate-fadeIn">
        <h2 className="text-2xl font-bold text-blue-600 mb-2">환비 계좌 추가</h2>
        <p className="text-gray-500 mb-6 text-center">
          환비 계좌를 등록하면 환전 및 송금이 가능합니다.<br />
          계좌번호와 통화코드를 입력 후 인증코드를 발급받으세요.
        </p>
        {addStep === 0 && (
          <>
            <input
              type="text"
              value={newAccountNumber}
              onChange={e => setNewAccountNumber(e.target.value)}
              placeholder="계좌번호"
              className="w-full border border-blue-200 rounded-lg p-3 text-lg mb-4 focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              value={newCurrency}
              onChange={e => setNewCurrency(e.target.value)}
              placeholder="통화코드 (예: USD, JPY)"
              className="w-full border border-blue-200 rounded-lg p-3 text-lg mb-4 focus:ring-2 focus:ring-blue-400"
            />
            <button
              className="w-full py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg font-semibold mb-3 shadow hover:from-blue-500 hover:to-blue-700 transition"
              onClick={async () => {
                await handleRequestVerificationCode();
                setAddStep(1);
              }}
            >
              인증코드 발급
            </button>
          </>
        )}
        {addStep === 1 && (
          <>
            <div className="w-full mb-4 p-3 bg-blue-50 rounded text-blue-700 text-center text-sm">
              환비 앱에서 인증코드를 확인 후 입력하세요.
            </div>
            <input
              type="text"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              placeholder="인증코드 입력"
              className="w-full border border-green-200 rounded-lg p-3 text-lg mb-4 focus:ring-2 focus:ring-green-400"
            />
            <button
              className="w-full py-3 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg font-semibold mb-3 shadow hover:from-green-500 hover:to-green-700 transition"
              onClick={async () => {
                await handleVerifyAndAddAccount();
                setAddStep(0);
              }}
            >
              계좌 연결
            </button>
          </>
        )}
        <button
          className="w-full py-2 mt-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
          onClick={() => { setShowAddAccount(false); setAddStep(0); }}
        >
          닫기
        </button>
      </div>
    </div>
  );

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
              {fromAcc && currencyMeta[fromAcc.currency]?.flag && (
                <img src={currencyMeta[fromAcc.currency].flag} alt={fromAcc.currency} className="w-8 h-8 mr-3" />
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
              {toAcc && currencyMeta[toAcc.currency]?.flag && (
                <img src={currencyMeta[toAcc.currency].flag} alt={toAcc.currency} className="w-8 h-8 mr-3" />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center min-w-0">
                  <span className="ml-2 text-gray-500 font-mono truncate">({toAcc?.accountNumber})</span>
                </div>
              </div>
              <div className="relative w-full">
                <AccountDropdown
                  accounts={accounts.filter((acc: BankAccountResponseDto) => acc.currency !== 'KRW').map(acc => ({
                    ...acc,
                    currencyCode: acc.currency // for AccountDropdown compatibility
                  }))}
                  value={toAccount}
                  onChange={setToAccount}
                  currencyMeta={currencyMeta}
                  onlyCode={true}
                  onAddAccount={() => setShowAddAccount(true)}
                />
              </div>
            </div>
          </div>
          {/* 환율 및 금액 입력 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-700">{fromAcc?.currency}</span>
              <span className="text-gray-400">1 {fromAcc ? currencyMeta[fromAcc.currency]?.symbol : ""}</span>
            </div>
            <span className="text-xs text-gray-500">{getRateText()}</span>
          </div>
          {/* 금액 입력 및 키패드 */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">환전 가능 금액</span>
              <span className="text-gray-700 text-lg font-bold">{fromAcc ? currencyMeta[fromAcc.currency]?.symbol : ""} {amount || '0'}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">{toAcc?.currency} 환산</span>
              <span className="text-blue-600 font-semibold text-lg">{toAcc ? currencyMeta[toAcc.currency]?.symbol : ""} {calcToAmount() || '0'}</span>
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
            <div className="mb-2 text-gray-700">환전신청금액: <b>{amount} {fromAcc ? currencyMeta[fromAcc.currency]?.symbol : ""}</b></div>
            <div className="mb-4 text-gray-700">최종 환전금액: <b>{calcToAmount()} {toAcc ? currencyMeta[toAcc.currency]?.symbol : ""}</b></div>
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
            <div className="mb-4 text-2xl font-bold text-blue-600">{calcToAmount()} {toAcc ? currencyMeta[toAcc.currency]?.symbol : ""}</div>
            <button className="w-full bg-[#2196F3] text-white font-semibold py-3 rounded-lg hover:bg-[#0DAEFF] transition" onClick={() => { setShowComplete(false); setAmount(""); setPin(""); }}>확인</button>
          </div>
        </div>
      )}
      {showAddAccount && renderAddAccountModal()}
    </div>
  );
} 