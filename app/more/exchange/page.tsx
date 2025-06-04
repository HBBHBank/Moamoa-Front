"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const rates = [
  {
    country: "미국 USD",
    flag: "/images/flags/usa.png",
    baseRate: 1391.0,
    buy: 1391.0,
    sell: 1377.09,
    change: 0.9,
    changePercent: 0.06,
    up: true,
  },
  {
    country: "일본 JPY",
    flag: "/images/flags/japan.png",
    baseRate: 960.6,
    buy: 960.6,
    sell: 950.99,
    change: 1.58,
    changePercent: 0.16,
    up: true,
  },
  {
    country: "유럽 EUR",
    flag: "/images/flags/eu.png",
    baseRate: 1564.18,
    buy: 1564.18,
    sell: 1548.54,
    change: 2.19,
    changePercent: 0.14,
    up: true,
  },
  {
    country: "중국 CNY",
    flag: "/images/flags/china.png",
    baseRate: 192.75,
    buy: 194.29,
    sell: 190.82,
    change: 0.05,
    changePercent: 0.03,
    up: true,
  },
  {
    country: "인도 INR",
    flag: "/images/flags/india.png",
    baseRate: 16.50,
    buy: 16.70,
    sell: 16.30,
    change: 0.10,
    changePercent: 0.61,
    up: true,
  },
  {
    country: "베트남 VND",
    flag: "/images/flags/vietnam.png",
    baseRate: 5.36,
    buy: 5.4,
    sell: 5.31,
    change: -0.02,
    changePercent: -0.37,
    up: false,
  },
];

export default function ExchangeRatesPage() {
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
        <div className="rounded-xl bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
          {rates.map((rate) => (
            <div key={rate.country} className="flex items-center py-4 px-2">
              <div className="w-8 h-8 mr-3 flex-shrink-0">
                <Image
                  src={rate.flag}
                  alt={rate.country}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center text-base font-medium text-gray-900">
                  {rate.country}
                  <span className="ml-2 text-xs text-gray-400 font-normal">매매기준율 : {rate.baseRate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  사실때 {rate.buy.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} | 파실때 {rate.sell.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
              <div className="flex flex-col items-end ml-2 min-w-[80px]">
                <span className={`text-sm font-semibold ${rate.up ? "text-red-500" : "text-blue-500"}`}>
                  {rate.up ? "▲" : "▼"} {Math.abs(rate.change).toFixed(2)}
                  <span className="ml-1 text-xs font-normal">({rate.changePercent > 0 ? "+" : ""}{rate.changePercent.toFixed(2)}%)</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 