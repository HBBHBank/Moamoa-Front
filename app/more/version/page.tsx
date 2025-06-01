"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Shield, Users, ExternalLink, Star, Download, CheckCircle } from "lucide-react"

interface UpdateHistory {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
}

const updateHistory: UpdateHistory[] = [
  {
    version: "1.0.0",
    date: "2025.06.09",
    features: [
      "모아모아 앱 첫 출시",
      "QR 코드 스캔 결제 기능",
      "환전 및 정산 서비스",
      "계좌/충전 관리 기능",
      "실시간 환율 정보 제공",
      "사용자 프로필 관리",
      "보안 인증 시스템"
    ],
    fixes: []
  }
]

export default function VersionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 shadow-sm">
        <Link href="/more" className="p-2">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <span className="text-lg font-medium text-gray-800">버전 정보</span>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* App Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 overflow-hidden bg-white shadow-lg">
            <Image
              src="/images/moamoa-logo.png"
              alt="모아모아 로고"
              width={80}
              height={80}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">모아모아</h1>
          <div className="bg-gradient-to-r from-[#4DA9FF] to-[#0DAEFF] rounded-full p-3 mb-4 max-w-fit mx-auto">
            <div className="flex items-center justify-center space-x-2 text-white">
              <span className="font-bold text-lg">Version 1.0.0</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">최신 버전입니다</p>
            <p className="text-sm text-gray-500">출시일: 2025년 6월 9일</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <Download className="w-6 h-6 text-[#4DA9FF] mx-auto mb-2" />
            <p className="text-sm text-gray-500">다운로드</p>
            <p className="font-semibold text-gray-800">1K+</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <Shield className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">보안 등급</p>
            <p className="font-semibold text-gray-800">A+</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">평점</p>
            <p className="font-semibold text-gray-800">5.0</p>
          </div>
        </div>

        {/* Update History */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">업데이트 내역</h2>
          </div>
          <div className="space-y-0">
            {updateHistory.map((update) => (
              <div key={update.version} className="p-5 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-800">v{update.version}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      최신
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{update.date}</span>
                </div>
                
                {update.features.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Star className="w-4 h-4 text-blue-500 mr-1" />
                      새로운 기능
                    </h4>
                    <ul className="space-y-1">
                      {update.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {update.fixes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      개선 사항
                    </h4>
                    <ul className="space-y-1">
                      {update.fixes.map((fix, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Development Team */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">개발팀 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">회사명</span>
              <span className="font-medium text-gray-800">모아모아</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">개발팀</span>
              <span className="font-medium text-gray-800">환비 개발팀</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">연락처</span>
              <span className="font-medium text-gray-800">yezanee@gmail.com</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">웹사이트</span>
              <a href="#" className="flex items-center text-[#4DA9FF] font-medium">
                www.moamoa.co.kr
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">시스템 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">플랫폼</span>
              <span className="font-medium text-gray-800">웹 앱</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">지원 브라우저</span>
              <span className="font-medium text-gray-800">Chrome, Safari, Firefox</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">최소 화면 크기</span>
              <span className="font-medium text-gray-800">360px × 640px</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">언어</span>
              <span className="font-medium text-gray-800">한국어</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            © 2025 모아모아. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
} 