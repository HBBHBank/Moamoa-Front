"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { getValidToken } from "@/lib/auth";

type ExchangeRateDataDto = {
  currency: string;
  registrationTime: string;
  bankOfKoreaRate: string;
};

const currencyMeta: Record<string, { country: string; flag: string }> = {
  USD: { country: "미국 USD", flag: "/images/flags/usa.png" },
  JPY: { country: "일본 JPY", flag: "/images/flags/japan.png" },
  EUR: { country: "유럽 EUR", flag: "/images/flags/eu.png" },
  CNY: { country: "중국 CNY", flag: "/images/flags/china.png" },
  INR: { country: "인도 INR", flag: "/images/flags/india.png" },
  VND: { country: "베트남 VND", flag: "/images/flags/vietnam.png" },
};

type RateDisplay = {
  country: string;
  flag: string;
  rate: string;
  registrationTime: string;
};

// 통화별 기준 단위 매핑
const currencyUnit: Record<string, string> = {
  USD: '1달러',
  JPY: '100엔',
  EUR: '1유로',
  CNY: '1위안',
  INR: '1루피',
};

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<RateDisplay[]>([]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        console.log('[환율] API URL:', process.env.NEXT_PUBLIC_API_URL);
        const token = await getValidToken();
        console.log('[환율] Token:', token ? token.substring(0, 20) + '...' : '없음');
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/exchange/rates`;
        console.log('[환율] Fetching:', apiUrl);
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        });
        console.log('[환율] Response status:', res.status);
        const result = await res.json();
        console.log('[환율] 최종 응답 구조 확인:', JSON.stringify(result, null, 2));
        const data: ExchangeRateDataDto[] = Array.isArray(result.result?.data) ? result.result.data : [];
        if (!data.length) {
          console.warn('[환율] result.result.data가 비어있거나 배열이 아님:', result.result?.data);
        } else {
          console.log('[환율] 사용된 경로: result.result.data');
        }
        const mapped = data.map((item) => {
          const meta = currencyMeta[item.currency] || { country: item.currency, flag: "" };
          return {
            country: meta.country,
            flag: meta.flag,
            rate: item.bankOfKoreaRate,
            registrationTime: item.registrationTime,
          };
        });
        setRates(mapped);
      } catch (err) {
        console.error('[환율] API 호출 실패:', err);
        // 실패 시 아무것도 하지 않음 (rates는 빈 배열 유지)
      }
    };
    fetchRates();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 shadow-sm">
        <Link href="/more" className="p-2">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <span className="text-lg font-medium text-gray-800">환율정보</span>
        <div className="w-10" />
      </header>
      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="space-y-4">
          {rates.map((rate, idx) => {
            const code = rate.country.split(' ').pop() || '';
            const unit = currencyUnit[code as keyof typeof currencyUnit] || '';
            return (
              <div
                key={rate.country}
                className="flex items-center rounded-2xl bg-white shadow-lg p-5 group relative overflow-hidden min-h-[80px] animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Animated background accent */}
                <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="w-12 h-12 mr-4 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 shadow-sm">
                  <Image
                    src={rate.flag}
                    alt={rate.country}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
                  <span className="text-base font-semibold text-gray-900 tracking-tight">{rate.country}</span>
                </div>
                <div className="flex flex-col items-end ml-4">
                  <span className="text-xs text-gray-500 mb-0.5">{unit}</span>
                  <span className="text-xl font-extrabold text-blue-700 drop-shadow-sm">{rate.rate}원</span>
                  <span className="text-xs text-gray-400 mt-1">{rate.registrationTime} 기준</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Animation keyframes */}
        <style jsx>{`
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(24px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
        `}</style>
      </div>
    </div>
  );
} 