"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, MoreHorizontal, BarChart3, HelpCircle, Info, FileText, CheckCircle } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { getValidToken } from "@/lib/auth"

// 타입 정의
interface UserProfile {
  name: string;
  profileImage: string;
}

// 프로필 이미지 매핑 함수 - 프론트엔드 정적 리소스 사용
const mapProfileImageToUrl = (profileImageValue: string): string | null => {
  if (!profileImageValue) return null;
  
  // 이미 완전한 URL인 경우 (http:// 또는 https://로 시작)
  if (profileImageValue.startsWith('http://') || profileImageValue.startsWith('https://')) {
    return profileImageValue;
  }
  
  // 프론트엔드 정적 리소스 매핑 (/public/images/profile/)
  const imageMap: Record<string, string> = {
    'img_1': '/images/profile/img_1.png',
    'img_2': '/images/profile/img_2.png', 
    'img_3': '/images/profile/img_3.png',
    'img_4': '/images/profile/img_4.png',
  };
  
  // enum 값을 정적 이미지 경로로 변환
  const mappedUrl = imageMap[profileImageValue];
  if (mappedUrl) {
    return mappedUrl;
  }
  
  // 매핑되지 않은 경우 null 반환 (기본 아바타 사용)
  return null;
};

// CSS 기반 프로필 아바타 컴포넌트 (fallback용)
const ProfileAvatar = ({ profileImage, userName, size = 48 }: { 
  profileImage?: string | null; 
  userName: string; 
  size?: number;
}) => {
  const avatarColors = {
    'img_1': 'bg-gradient-to-br from-blue-400 to-blue-600',
    'img_2': 'bg-gradient-to-br from-green-400 to-green-600',
    'img_3': 'bg-gradient-to-br from-purple-400 to-purple-600',
    'img_4': 'bg-gradient-to-br from-pink-400 to-pink-600',
  };
  
  const defaultColor = 'bg-gradient-to-br from-gray-400 to-gray-600';
  const colorClass = profileImage && avatarColors[profileImage as keyof typeof avatarColors] 
    ? avatarColors[profileImage as keyof typeof avatarColors] 
    : defaultColor;
  
  // 사용자 이름의 첫 글자를 표시
  const initial = userName.charAt(0).toUpperCase();
  
  return (
    <div 
      className={`rounded-full ${colorClass} flex items-center justify-center text-white font-semibold`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.4 }}>
        {initial}
      </span>
    </div>
  );
};

export default function MorePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userPhone, setUserPhone] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return ""
    
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true)
        
        // 환경변수 확인
        console.log('Environment check:');
        console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
        console.log('NODE_ENV:', process.env.NODE_ENV);
        
        // API URL 유효성 검사
        if (!process.env.NEXT_PUBLIC_API_URL) {
          console.error('NEXT_PUBLIC_API_URL 환경변수가 설정되지 않았습니다.');
          setUserProfile({ name: "사용자", profileImage: "" });
          return;
        }
        
        // 토큰 디버깅
        console.log('All cookies:', document.cookie);
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1];
        console.log('Cookie token:', cookieToken ? cookieToken.substring(0, 20) + '...' : 'Not found');
        
        // localStorage에서도 토큰 확인
        const localStorageToken = localStorage.getItem('accessToken');
        console.log('LocalStorage token:', localStorageToken ? localStorageToken.substring(0, 20) + '...' : 'Not found');
        
        const token = await getValidToken();
        
        // 토큰 유효성 확인
        if (!token) {
          console.error("토큰이 없습니다.");
          router.push("/")
          return
        }
        
        // Authorization 헤더 형식 검증
        if (!token.match(/^[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*$/)) {
          console.error("토큰 형식이 올바르지 않습니다:", token.substring(0, 20) + '...');
        }
        
        // 프로필 정보와 전화번호를 병렬로 가져오기
        const [profileResponse, phoneResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include"
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/phone`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include"
          })
        ]);
        
        console.log('Profile API Response status:', profileResponse.status);
        console.log('Phone API Response status:', phoneResponse.status);
        
        // 프로필 정보 처리
        if (profileResponse.status === 401) {
          console.error("인증 실패 - 로그인 페이지로 리다이렉트");
          router.push("/")
          return
        }
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Profile API response:', profileData);
          
          // 다양한 응답 구조 패턴 체크
          let isSuccess = false;
          let resultData = null;
          
          if (profileData) {
            if (profileData.code === "SUCCESS" || profileData.message === "SUCCESS") {
              isSuccess = true;
              resultData = profileData.result;
            } else if (profileData.status === "success" || profileData.status === "SUCCESS") {
              isSuccess = true;
              resultData = profileData.data || profileData.result;
            } else if (profileData.success === true) {
              isSuccess = true;
              resultData = profileData.data || profileData.result;
            } else if (profileData.name || profileData.profileImage) {
              isSuccess = true;
              resultData = profileData;
            } else if (Object.keys(profileData).length > 0) {
              console.log('Unknown response structure, treating as success');
              isSuccess = true;
              resultData = profileData;
            }
          }
          
          if (isSuccess && resultData && typeof resultData === 'object') {
            const profile = {
              name: resultData.name || "사용자",
              profileImage: resultData.profileImage || ""
            };
            setUserProfile(profile);
            setProfileImageUrl(mapProfileImageToUrl(profile.profileImage));
          } else {
            console.error("Profile API response not successful:", profileData);
            setUserProfile({ name: "사용자", profileImage: "" });
          }
        } else {
          console.error("Profile API failed:", profileResponse.status);
          setUserProfile({ name: "사용자", profileImage: "" });
        }
        
        // 전화번호 정보 처리
        if (phoneResponse.ok) {
          try {
            const phoneData = await phoneResponse.json();
            console.log('Phone API response:', phoneData);
            
            if (phoneData && phoneData.data) {
              setUserPhone(phoneData.data);
            } else if (phoneData && typeof phoneData === 'string') {
              setUserPhone(phoneData);
            }
          } catch (phoneError) {
            console.error("전화번호 데이터 파싱 실패:", phoneError);
          }
        } else {
          console.error("Phone API failed:", phoneResponse.status);
        }
        
      } catch (error) {
        console.error("사용자 정보 로드 실패:", error)
        console.error("Error name:", (error as Error).name);
        console.error("Error message:", (error as Error).message);
        
        // 에러 발생 시에도 기본값 설정
        setUserProfile({ name: "사용자", profileImage: "" });
        setProfileImageUrl(null);
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [router])

  const handleSettlement = () => {
    router.push("/settlement")
  }

  const handlePayment = () => {
    router.push("/payment")
  }

  // Navigation items with custom icons
  const navItems = [
    { name: "홈", path: "/home", icon: "/images/icons/home-icon.png", onClick: undefined },
    { name: "정산", path: "/settlement", icon: "/images/icons/settlement-icon.png", onClick: handleSettlement },
    { name: "환전", path: "/exchange", icon: "/images/icons/exchange-icon.png", onClick: undefined },
    { name: "결제", path: "/payment", icon: "/images/icons/payment-icon.png", onClick: handlePayment },
    { name: "더 보기", path: "/more", icon: "", onClick: undefined },
  ]

  const menuItems = [
    {
      icon: <BarChart3 className="w-6 h-6 text-gray-600" />,
      title: "환율정보",
      path: "/more/exchange"
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-gray-600" />,
      title: "자주 묻는 질문, FAQ",
      path: "/more/faq"
    },
    {
      icon: <Info className="w-6 h-6 text-gray-600" />,
      title: "버전정보",
      path: "/more/version",
      rightContent: (<span className="text-[#4DA9FF] text-sm font-medium">1.0.0</span>)
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-gray-600" />,
      title: "서비스 이용 동의",
      path: "/more/service-agreement"
    },
    {
      icon: <FileText className="w-6 h-6 text-gray-600" />,
      title: "이용약관",
      path: "/more/terms"
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-center bg-white p-4 shadow-sm">
        <span className="text-lg font-medium text-gray-800">더 보기</span>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        {/* User Profile Section */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-gray-300 animate-pulse"></div>
              ) : profileImageUrl ? (
                // 실제 프로필 이미지 파일 사용
                <img
                  src={profileImageUrl}
                  alt="프로필"
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.log('Profile image load failed, using CSS avatar');
                    // 이미지 로드 실패 시 CSS 아바타로 교체
                    setProfileImageUrl(null);
                  }}
                />
              ) : (
                // CSS 기반 프로필 아바타 사용 (fallback)
                <ProfileAvatar 
                  profileImage={userProfile?.profileImage} 
                  userName={userProfile?.name || "사용자"} 
                  size={48} 
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium text-gray-800">
                {isLoading ? (
                  <span className="inline-block h-6 w-24 bg-gray-300 animate-pulse rounded"></span>
                ) : (
                  userProfile?.name || "사용자"
                )}
              </p>
              {/* 전화번호 표시 */}
              <p className="text-sm text-gray-500 mt-1">
                {isLoading ? (
                  <span className="inline-block h-4 w-32 bg-gray-200 animate-pulse rounded"></span>
                ) : userPhone ? (
                  formatPhoneNumber(userPhone)
                ) : (
                  ""
                )}
              </p>
            </div>
          </div>
        </div>

        {/* My Info Management Button */}
        <div className="mb-6">
          <Link href="/more/edit" className="w-full block">
            <button className="w-full rounded-xl border border-[#4DA9FF] bg-white py-4 text-center text-[#4DA9FF] font-medium shadow-sm hover:bg-blue-50 transition-colors">
              내 정보 관리
            </button>
          </Link>
        </div>

        {/* Menu Items */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-4">
                {item.icon}
                <span className="text-gray-800 font-medium">{item.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                {item.rightContent}
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto border-t border-gray-200 bg-white shadow-md">
        <div className="flex">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              onClick={item.onClick}
              className={`group flex flex-1 flex-col items-center justify-center py-3 ${
                pathname === item.path ? "text-[#0DAEFF]" : "text-gray-500"
              } cursor-pointer`}
            >
              {item.name === "더 보기" ? (
                <MoreHorizontal className="h-8 w-8" />
              ) : (
                <div className="relative h-8 w-8">
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={32}
                    height={32}
                    className={`transition-all duration-300 ${
                      pathname === item.path ? "drop-shadow-sm opacity-100" : "opacity-70 group-hover:opacity-90"
                    }`}
                  />
                  {pathname === item.path && (
                    <div className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-[#0DAEFF]"></div>
                  )}
                </div>
              )}
              <span
                className={`mt-1 text-xs font-medium transition-all duration-300 ${
                  pathname === item.path ? "font-semibold" : "group-hover:text-gray-700"
                }`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 