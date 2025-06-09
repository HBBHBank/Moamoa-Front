"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ServiceAgreementPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 shadow-sm">
        <Link href="/more" className="p-2">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <span className="text-lg font-medium text-gray-800">서비스 이용 동의</span>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="space-y-6">
            {/* 동의서 제목 */}
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-xl font-bold text-gray-800 mb-2">모아모아 서비스 이용 동의서</h1>
              <p className="text-sm text-gray-500">시행일자: 2025년 1월 1일</p>
            </div>

            {/* 서비스 이용 동의 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">서비스 이용 동의</h2>
              <p className="text-gray-700 leading-relaxed">
                모아모아가 제공하는 환전, 결제, 정산 서비스를 이용하기 위해서는 다음 사항에 동의하셔야 합니다.
              </p>
            </div>

            {/* 1. 서비스 이용 동의 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">1. 서비스 이용 동의</h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700 leading-relaxed">
                  ✓ 본인은 모아모아가 제공하는 환전 서비스를 이용하는 것에 동의합니다.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  ✓ 서비스 이용 과정에서 발생하는 수수료 및 환율에 대해 이해하고 동의합니다.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  ✓ 본인이 제공한 정보가 정확하며, 허위 정보 제공 시 발생하는 책임을 집니다.
                </p>
              </div>
            </div>

            {/* 2. 개인정보 수집 및 이용 동의 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">2. 개인정보 수집 및 이용 동의</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">수집하는 개인정보 항목</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>필수항목: 이름, 휴대폰번호, 이메일주소</li>
                    <li>선택항목: 프로필 이미지</li>
                    <li>자동수집: 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">개인정보 수집 및 이용목적</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                    <li>서비스 제공 및 운영</li>
                    <li>회원 관리 및 본인확인</li>
                    <li>고객상담 및 불만처리</li>
                    <li>서비스 개선 및 신규 서비스 개발</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">개인정보 보유 및 이용기간</h4>
                  <p className="text-gray-700 text-sm">
                    회원탈퇴시까지 또는 관련 법령에 따른 보존기간까지 보관합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. 마케팅 활용 동의 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">3. 마케팅 활용 동의 (선택)</h3>
              <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700 leading-relaxed text-sm">
                  ✓ 신규 서비스 및 이벤트 정보 제공을 위한 개인정보 활용에 동의합니다.
                </p>
                <p className="text-gray-700 leading-relaxed text-sm">
                  ✓ SMS, 이메일을 통한 마케팅 정보 수신에 동의합니다.
                </p>
                <p className="text-gray-700 leading-relaxed text-sm text-amber-600">
                  ※ 마케팅 동의는 선택사항이며, 동의하지 않아도 서비스 이용이 가능합니다.
                </p>
              </div>
            </div>

            {/* 4. 금융서비스 이용 동의 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">4. 금융서비스 이용 동의</h3>
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700 leading-relaxed text-sm">
                  ✓ 본인은 만 19세 이상으로 금융거래를 할 수 있는 능력이 있습니다.
                </p>
                <p className="text-gray-700 leading-relaxed text-sm">
                  ✓ 환전 서비스 이용 시 관련 법령 및 규정을 준수합니다.
                </p>
                <p className="text-gray-700 leading-relaxed text-sm">
                  ✓ 자금세탁방지법 등 관련 법령에 따른 거래내역 보고에 동의합니다.
                </p>
              </div>
            </div>

            {/* 5. 제3자 정보제공 동의 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">5. 제3자 정보제공 동의</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-left">제공받는 자</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">제공목적</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">제공항목</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">금융기관</td>
                        <td className="border border-gray-300 px-2 py-1">환전 및 결제 처리</td>
                        <td className="border border-gray-300 px-2 py-1">성명, 연락처, 거래내역</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">정부기관</td>
                        <td className="border border-gray-300 px-2 py-1">법령상 의무 이행</td>
                        <td className="border border-gray-300 px-2 py-1">거래내역, 개인식별정보</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 유의사항 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">유의사항</h3>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>위 동의를 거부할 권리가 있으나, 동의 거부 시 서비스 이용이 제한될 수 있습니다.</li>
                  <li>동의한 내용은 마이페이지에서 언제든지 철회할 수 있습니다.</li>
                  <li>개인정보 처리에 대한 자세한 내용은 개인정보처리방침을 참고하시기 바랍니다.</li>
                </ul>
              </div>
            </div>

            {/* 연락처 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">문의사항</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600">회사명: 모아모아</p>
                <p className="text-sm text-gray-600">개인정보보호책임자: 개발팀장</p>
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