import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4">
            <Image src="/images/moamoa-logo.png" alt="MOAMOA Logo" width={180} height={180} className="h-auto w-44" />
          </div>

          <div className="mt-6 w-full space-y-6">
            <Link href="/signup/terms" className="block">
              <button className="flex h-[60px] w-full items-center justify-center rounded-[30px] bg-[#0DAEFF] text-center font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8]">
                <span className="text-lg">가입하기</span>
              </button>
            </Link>
            <Link href="/login" className="block">
              <button className="flex h-[60px] w-full items-center justify-center rounded-[30px] bg-[#0DAEFF] text-center font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8]">
                <span className="text-lg">로그인</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
