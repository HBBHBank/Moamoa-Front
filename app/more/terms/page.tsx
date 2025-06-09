"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 shadow-sm">
        <Link href="/more" className="p-2">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <span className="text-lg font-medium text-gray-800">이용약관</span>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="space-y-6">
            {/* 약관 제목 */}
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-xl font-bold text-gray-800 mb-2">모아모아 서비스 이용약관</h1>
              <p className="text-sm text-gray-500">시행일자: 2025년 1월 1일</p>
            </div>

            {/* 제 1 조 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">제 1 조 (목적)</h2>
              <p className="text-gray-700 leading-relaxed">
                이 약관은 모아모아(이하 &ldquo;회사&rdquo;)가 제공하는 환전 및 금융 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </div>

            {/* 제 2 조 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">제 2 조 (정의)</h2>
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">1. &ldquo;서비스&rdquo;란 회사가 제공하는 환전, 결제, 정산 관련 모든 서비스를 의미합니다.</p>
                <p className="text-gray-700 leading-relaxed">2. &ldquo;이용자&rdquo;란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
                <p className="text-gray-700 leading-relaxed">3. &ldquo;회원&rdquo;이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</p>
              </div>
            </div>

            {/* 제 3 조 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">제 3 조 (약관의 게시와 개정)</h2>
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">1. 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
                <p className="text-gray-700 leading-relaxed">2. 회사는 필요하다고 인정되는 경우 이 약관을 개정할 수 있습니다.</p>
                <p className="text-gray-700 leading-relaxed">3. 개정된 약관은 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</p>
              </div>
            </div>

            {/* 제 4 조 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">제 4 조 (서비스의 제공 및 변경)</h2>
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">1. 회사는 다음과 같은 업무를 수행합니다:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                  <li>환전 서비스 제공</li>
                  <li>결제 및 정산 서비스 제공</li>
                  <li>환율 정보 제공</li>
                  <li>기타 회사가 정하는 업무</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">2. 회사는 서비스의 내용을 변경할 경우에는 변경사유 및 변경내용을 명시하여 사전에 통지합니다.</p>
              </div>
            </div>

            {/* 제 5 조 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">제 5 조 (서비스의 중단)</h2>
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
                <p className="text-gray-700 leading-relaxed">2. 회사는 국가비상사태, 정전, 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 정상적인 서비스 이용에 지장이 있는 때에는 서비스의 전부 또는 일부를 제한하거나 정지할 수 있습니다.</p>
              </div>
            </div>

            {/* 제 6 조 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">제 6 조 (회원가입)</h2>
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</p>
                <p className="text-gray-700 leading-relaxed">2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각호에 해당하지 않는 한 회원으로 등록합니다:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                  <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </div>
            </div>

            {/* 제 7 조 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">제 7 조 (개인정보보호)</h2>
              <p className="text-gray-700 leading-relaxed">
                회사는 관계법령이 정하는 바에 따라 이용자 등록정보를 포함한 이용자의 개인정보를 보호하기 위해 노력합니다. 이용자의 개인정보보호에 관해서는 관련법령 및 회사의 개인정보취급방침에 정한 바에 의합니다.
              </p>
            </div>

            {/* 제 8 조 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">제 8 조 (회사의 의무)</h2>
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">1. 회사는 관련법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.</p>
                <p className="text-gray-700 leading-relaxed">2. 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함) 보호를 위한 보안 시스템을 구축하여야 합니다.</p>
              </div>
            </div>

            {/* 연락처 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">문의사항</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600">회사명: 모아모아</p>
                <p className="text-sm text-gray-600">고객센터: 1588-1234</p>
                <p className="text-sm text-gray-600">이메일: yezanee@gmail.com</p>
                <p className="text-sm text-gray-600">운영시간: 평일 09:00-18:00, 토요일 09:00-13:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 