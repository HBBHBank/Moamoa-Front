"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, User, Phone, Lock, Camera } from "lucide-react"
import { useRouter } from "next/navigation"
import { getValidToken } from "@/lib/auth"

interface UserProfile {
  name: string;
  profileImage: string;
}

// 프로필 이미지 매핑 함수 - 더 보기 페이지와 동일한 방식
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
const ProfileAvatar = ({ profileImage, userName, size = 64 }: { 
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

export default function ProfileEditPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userPhone, setUserPhone] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  
  // 편집 상태
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [isEditingProfileImage, setIsEditingProfileImage] = useState(false)
  
  // 폼 데이터 (백엔드 DTO에 맞춤)
  const [nameForm, setNameForm] = useState({ name: "" })
  const [phoneForm, setPhoneForm] = useState({ phoneNumber: "" })
  const [passwordForm, setPasswordForm] = useState({ 
    oldPassword: "", 
    newPassword: "",
    confirmPassword: "" // 프론트엔드에서만 사용
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 모달 state 추가
  const [modal, setModal] = useState<{ open: boolean, message: string, onClose?: () => void }>({ open: false, message: "" })

  // 에러 메시지 매핑 함수
  const getErrorMessage = (errorData: { errorCode?: string; message?: string } | null): string => {
    if (!errorData) return "알 수 없는 오류가 발생했습니다."
    
    const errorCode = errorData.errorCode || ""
    const message = errorData.message || ""
    
    switch (errorCode) {
      case "USER_001":
        return "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요."
      case "USER_002":
        return "이미 사용 중인 이메일입니다."
      case "USER_003":
        return "유효하지 않은 전화번호 형식입니다."
      case "USER_004":
        return "선택하신 프로필 이미지를 사용할 수 없습니다."
      case "USER_005":
        return "현재 비밀번호가 일치하지 않습니다. 다시 확인해주세요."
      default:
        return message || "요청 처리 중 오류가 발생했습니다."
    }
  }

  // API 에러 처리 공통 함수
  const handleApiError = async (response: Response, defaultMessage: string): Promise<string> => {
    try {
      const errorText = await response.text()
      const errorData = JSON.parse(errorText)
      return getErrorMessage(errorData)
    } catch (parseError) {
      console.error("에러 응답 파싱 실패:", parseError)
      return defaultMessage
    }
  }

  // 프로필 정보 불러오기 - 더 보기 페이지와 동일한 방식
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        const token = await getValidToken()
        
        if (!token) {
          router.push("/")
          return
        }
        
        // 프로필 정보와 전화번호를 병렬로 가져오기
        const [profileResponse, phoneResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include"
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/phone`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include"
          })
        ])
        
        // 프로필 정보 처리 - 더 보기 페이지와 동일한 로직
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          console.log('Profile API response:', profileData)
          
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
            setNameForm({ name: profile.name });
            
            // 프로필 이미지 URL 설정
            if (profile.profileImage) {
              const imageUrl = mapProfileImageToUrl(profile.profileImage);
              setProfileImageUrl(imageUrl);
            }
          } else {
            console.error("Profile API response not successful:", profileData);
            setUserProfile({ name: "사용자", profileImage: "" });
          }
        } else {
          console.error("프로필 로드 실패:", profileResponse.status)
          setUserProfile({ name: "사용자", profileImage: "" })
        }
        
        // 전화번호 정보 처리
        if (phoneResponse.ok) {
          try {
            const phoneData = await phoneResponse.json()
            console.log('=== 전화번호 API 응답 상세 ===')
            console.log('- 전체 응답:', phoneData)
            console.log('- JSON 문자열:', JSON.stringify(phoneData, null, 2))
            console.log('- 응답 타입:', typeof phoneData)
            console.log('- Object.keys:', Object.keys(phoneData))
            console.log('- code:', phoneData?.code)
            console.log('- message:', phoneData?.message)
            console.log('- data:', phoneData?.data)
            console.log('- result:', phoneData?.result)
            console.log('- status:', phoneData?.status)
            console.log('- success:', phoneData?.success)
            console.log('- data 타입:', typeof phoneData?.data)
            console.log('- data 길이:', phoneData?.data?.length)
            
            // BaseResponse<String> 구조에 맞춰 처리 - 다양한 응답 구조 지원
            let phoneNumber = null;
            
            if (phoneData && phoneData.code === "SUCCESS") {
              phoneNumber = phoneData.data;
              console.log('✅ code=SUCCESS 패턴으로 전화번호 추출:', phoneNumber);
            } else if (phoneData && phoneData.message === "SUCCESS") {
              // message가 SUCCESS인 경우의 다양한 패턴 체크
              phoneNumber = phoneData.data || phoneData.result || phoneData.phone || phoneData.phoneNumber;
              console.log('✅ message=SUCCESS 패턴으로 전화번호 추출:', phoneNumber);
            } else if (phoneData && phoneData.status === "SUCCESS") {
              phoneNumber = phoneData.data || phoneData.result;
              console.log('✅ status=SUCCESS 패턴으로 전화번호 추출:', phoneNumber);
            } else if (phoneData && phoneData.success === true) {
              phoneNumber = phoneData.data || phoneData.result;
              console.log('✅ success=true 패턴으로 전화번호 추출:', phoneNumber);
            } else if (phoneData && typeof phoneData === 'string') {
              // 직접 문자열 반환인 경우
              phoneNumber = phoneData;
              console.log('✅ 직접 문자열 패턴으로 전화번호 추출:', phoneNumber);
            } else if (phoneData && phoneData.data) {
              // code나 message 체크 없이 data가 있는 경우
              phoneNumber = phoneData.data;
              console.log('✅ data 존재 패턴으로 전화번호 추출:', phoneNumber);
            } else if (phoneData && phoneData.result) {
              // result 필드가 있는 경우
              phoneNumber = phoneData.result;
              console.log('✅ result 존재 패턴으로 전화번호 추출:', phoneNumber);
            }
            
            // 추출된 전화번호 검증 및 설정
            if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim() !== "") {
              setUserPhone(phoneNumber.trim());
              console.log('🎉 최종 전화번호 설정 완료:', phoneNumber.trim());
            } else {
              console.log('ℹ️ DB에 전화번호가 등록되지 않음 또는 빈 값:', phoneNumber);
              setUserPhone("");
            }
          } catch (phoneError) {
            console.error("❌ 전화번호 데이터 파싱 실패:", phoneError)
            setUserPhone("")
          }
        } else {
          console.error("❌ 전화번호 API 호출 실패:", phoneResponse.status, phoneResponse.statusText)
          
          // 401 에러인 경우 인증 문제
          if (phoneResponse.status === 401) {
            console.error("인증 토큰 문제로 전화번호 조회 실패")
          }
          // 404 에러인 경우 사용자 없음
          else if (phoneResponse.status === 404) {
            console.error("사용자를 찾을 수 없어 전화번호 조회 실패")
          }
          
          setUserPhone("")
        }
        
      } catch (error) {
        console.error("사용자 데이터 로드 실패:", error)
        setUserProfile({ name: "사용자", profileImage: "" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  // 이름 변경 (DTO: { name })
  const handleNameChange = async () => {
    if (!nameForm.name.trim()) {
      setModal({ open: true, message: "이름을 입력해주세요." })
      return
    }
    
    try {
      setIsSubmitting(true)
      const token = await getValidToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/name`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: nameForm.name })
      })
      
      if (response.ok) {
        setUserProfile(prev => prev ? { ...prev, name: nameForm.name } : null)
        setIsEditingName(false)
        setModal({ open: true, message: "이름이 변경되었습니다." })
      } else {
        const errorMessage = await handleApiError(response, "이름 변경에 실패했습니다.")
        console.error("이름 변경 실패:", errorMessage)
        setModal({ open: true, message: errorMessage })
      }
    } catch (error) {
      console.error("이름 변경 에러:", error)
      setModal({ open: true, message: "네트워크 오류가 발생했습니다. 다시 시도해주세요." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 전화번호 변경 (DTO: { phoneNumber })
  const handlePhoneChange = async () => {
    if (!phoneForm.phoneNumber.trim()) {
      setModal({ open: true, message: "전화번호를 입력해주세요." })
      return
    }
    
    // 전화번호 형식 검증 (01X-XXXX-XXXX)
    const phonePattern = /^01([0|1|6|7|8|9])\d{3,4}\d{4}$/
    const cleanPhone = phoneForm.phoneNumber.replace(/-/g, '')
    
    if (!phonePattern.test(cleanPhone)) {
      setModal({ open: true, message: "전화번호 형식이 올바르지 않습니다. (예: 01012345678)" })
      return
    }
    
    try {
      setIsSubmitting(true)
      const token = await getValidToken()
      
      console.log("전화번호 변경 요청 시작:")
      console.log("- API URL:", `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/phone`)
      console.log("- Token exists:", !!token)
      console.log("- Token preview:", token ? token.substring(0, 20) + "..." : "null")
      console.log("- Phone number (원본):", phoneForm.phoneNumber)
      console.log("- Phone number (정리된):", cleanPhone)
      console.log("- Phone pattern test:", phonePattern.test(cleanPhone))
      console.log("- Request body:", JSON.stringify({ phoneNumber: cleanPhone }))
      
      if (!token) {
        setModal({ open: true, message: "인증 토큰이 없습니다. 다시 로그인해주세요." })
        router.push("/")
        return
      }
      
      if (!process.env.NEXT_PUBLIC_API_URL) {
        console.error("NEXT_PUBLIC_API_URL 환경변수가 설정되지 않았습니다.")
        setModal({ open: true, message: "서버 설정 오류입니다. 관리자에게 문의하세요." })
        return
      }
      
      const requestBody = { phoneNumber: cleanPhone }
      const requestHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
      
      console.log("전화번호 변경 요청 헤더:", {
        ...requestHeaders,
        Authorization: `Bearer ${token.substring(0, 20)}...`
      })
      console.log("전화번호 변경 요청 데이터:", requestBody)
      
      // 전화번호 형식 재검증
      if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
        console.error("전화번호 길이 오류:", cleanPhone.length)
        setModal({ open: true, message: "전화번호 길이가 올바르지 않습니다." })
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/phone`, {
        method: "PATCH",
        headers: requestHeaders,
        credentials: "include",
        body: JSON.stringify(requestBody)
      })
      
      console.log("전화번호 변경 응답:")
      console.log("- Status:", response.status)
      console.log("- Status Text:", response.statusText)
      console.log("- OK:", response.ok)
      console.log("- URL:", response.url)
      console.log("- Headers:", Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        // 전화번호 상태 즉시 업데이트
        setUserPhone(cleanPhone)
        setIsEditingPhone(false)
        setPhoneForm({ phoneNumber: "" })
        
        console.log("전화번호 변경 성공:", cleanPhone)
        setModal({ open: true, message: "전화번호가 변경되었습니다." })
        
        // 추가로 최신 데이터를 다시 가져와서 확실하게 동기화
        try {
          const phoneResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/phone`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include"
          })
          
          if (phoneResponse.ok) {
            const phoneData = await phoneResponse.json()
            console.log('=== 전화번호 동기화 응답 ===')
            console.log('- 응답 데이터:', phoneData)
            
            // BaseResponse<String> 구조에 맞춰 처리
            if (phoneData && phoneData.code === "SUCCESS") {
              if (phoneData.data && phoneData.data.trim() !== "") {
                setUserPhone(phoneData.data.trim())
                console.log("✅ 최신 전화번호 동기화 성공:", phoneData.data.trim())
              } else {
                console.log("ℹ️ 동기화: DB에 전화번호가 없음")
                setUserPhone("")
              }
            } else if (phoneData && phoneData.data) {
              if (phoneData.data.trim() !== "") {
                setUserPhone(phoneData.data.trim())
                console.log("✅ 최신 전화번호 동기화 성공 (fallback):", phoneData.data.trim())
              } else {
                console.log("ℹ️ 동기화: 전화번호 데이터가 빈 값")
                setUserPhone("")
              }
            }
          } else {
            console.error("⚠️ 전화번호 동기화 실패:", phoneResponse.status)
          }
        } catch (syncError) {
          console.error("❌ 전화번호 동기화 에러:", syncError)
        }
      } else {
        console.warn("=== 전화번호 변경 실패 디버깅 ===")
        console.warn("- 상태 코드:", response.status)
        console.warn("- 상태 텍스트:", response.statusText)
        console.warn("- 요청 URL:", response.url)
        
        let errorMessage = "전화번호 변경에 실패했습니다."
        let isPhoneDuplicate = false
        
        // HTTP 상태 코드별 처리
        if (response.status === 500) {
          // 500 에러는 대부분 전화번호 중복으로 인한 것
          errorMessage = "이미 사용중인 전화번호입니다. 다른 번호를 입력해주세요."
          isPhoneDuplicate = true
          console.warn("500 에러 - 전화번호 중복으로 추정")
        } else if (response.status === 409) {
          // 409 Conflict - 전화번호 중복
          errorMessage = "이미 사용중인 전화번호입니다. 다른 번호를 입력해주세요."
          isPhoneDuplicate = true
        } else if (response.status === 400) {
          errorMessage = "전화번호 형식이 올바르지 않습니다."
        } else if (response.status === 401) {
          errorMessage = "인증이 만료되었습니다. 다시 로그인해주세요."
        } else if (response.status === 403) {
          errorMessage = "권한이 없습니다."
        }
        
        try {
          const errorText = await response.text()
          console.warn("=== 에러 응답 상세 정보 ===")
          console.warn("- 응답 내용:", errorText)
          console.warn("- 응답 길이:", errorText.length)
          
          if (errorText && errorText.length > 0) {
            try {
              const errorData = JSON.parse(errorText)
              console.warn("- 파싱된 에러 데이터:", errorData)
              
              // BaseResponse 구조의 에러 처리
              if (errorData.code && errorData.message) {
                // 전화번호 중복 관련 메시지 확인
                if (errorData.message.includes("중복") || 
                    errorData.message.includes("이미") || 
                    errorData.message.includes("duplicate") ||
                    errorData.code === "USER_003") {
                  errorMessage = "이미 사용중인 전화번호입니다. 다른 번호를 입력해주세요."
                  isPhoneDuplicate = true
                } else {
                  errorMessage = errorData.message
                }
              } else if (errorData.errorCode) {
                const mappedMessage = getErrorMessage(errorData)
                if (errorData.errorCode === "USER_003" || mappedMessage.includes("전화번호")) {
                  errorMessage = "이미 사용중인 전화번호입니다. 다른 번호를 입력해주세요."
                  isPhoneDuplicate = true
                } else {
                  errorMessage = mappedMessage
                }
              } else if (errorData.message) {
                if (errorData.message.includes("중복") || errorData.message.includes("이미")) {
                  errorMessage = "이미 사용중인 전화번호입니다. 다른 번호를 입력해주세요."
                  isPhoneDuplicate = true
                } else {
                  errorMessage = errorData.message
                }
              }
            } catch (parseError) {
              console.warn("- JSON 파싱 실패:", parseError)
              if (response.status === 500) {
                errorMessage = "이미 사용중인 전화번호일 수 있습니다. 다른 번호를 시도해주세요."
                isPhoneDuplicate = true
              } else {
                errorMessage = `서버 오류가 발생했습니다. (${response.status})`
              }
            }
          } else {
            console.warn("- 빈 응답")
            if (response.status === 500) {
              errorMessage = "이미 사용중인 전화번호일 수 있습니다. 다른 번호를 시도해주세요."
              isPhoneDuplicate = true
            } else {
              errorMessage = `서버 오류가 발생했습니다. (${response.status})`
            }
          }
        } catch (textError) {
          console.warn("- 에러 응답 읽기 실패:", textError)
          if (response.status === 500) {
            errorMessage = "이미 사용중인 전화번호일 수 있습니다. 다른 번호를 시도해주세요."
            isPhoneDuplicate = true
          } else {
            errorMessage = `서버 응답을 읽을 수 없습니다. (${response.status})`
          }
        }
        
        // 로그 레벨 조정
        if (isPhoneDuplicate) {
          console.info("전화번호 중복:", errorMessage)
        } else {
          console.warn("전화번호 변경 실패:", errorMessage)
        }
        
        setModal({ open: true, message: errorMessage })
      }
    } catch (error) {
      console.error("전화번호 변경 네트워크 에러:", error)
      console.error("에러 타입:", error instanceof TypeError ? "TypeError" : typeof error)
      console.error("에러 메시지:", (error as Error).message)
      console.error("에러 스택:", (error as Error).stack)
      
      let userMessage = "네트워크 오류가 발생했습니다."
      
      if (error instanceof TypeError) {
        if ((error as Error).message.includes("fetch")) {
          userMessage = "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
        } else if ((error as Error).message.includes("NetworkError")) {
          userMessage = "네트워크 오류가 발생했습니다. 다시 시도해주세요."
        }
      }
      
      setModal({ open: true, message: userMessage + " 다시 시도해주세요." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 비밀번호 변경 (DTO: { oldPassword, newPassword }) - 6자리 숫자로 수정
  const handlePasswordChange = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setModal({ open: true, message: "모든 비밀번호 필드를 입력해주세요." })
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setModal({ open: true, message: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." })
      return
    }
    
    // 6자리 숫자 검증 (백엔드 API 스펙에 맞춤)
    const passwordPattern = /^\d{6}$/
    if (!passwordPattern.test(passwordForm.oldPassword)) {
      setModal({ open: true, message: "현재 비밀번호는 6자리 숫자여야 합니다." })
      return
    }
    
    if (!passwordPattern.test(passwordForm.newPassword)) {
      setModal({ open: true, message: "새 비밀번호는 6자리 숫자여야 합니다." })
      return
    }
    
    try {
      setIsSubmitting(true)
      const token = await getValidToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      })
      
      if (response.ok) {
        setIsEditingPassword(false)
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
        setModal({ open: true, message: "비밀번호가 변경되었습니다." })
      } else {
        const errorMessage = await handleApiError(response, "비밀번호 변경에 실패했습니다.")
        console.error("비밀번호 변경 실패:", errorMessage)
        setModal({ open: true, message: errorMessage })
      }
    } catch (error) {
      console.error("비밀번호 변경 에러:", error)
      setModal({ open: true, message: "네트워크 오류가 발생했습니다. 다시 시도해주세요." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 프로필 이미지 변경 (DTO: { profileImage })
  const handleProfileImageChange = async (profileImage: string) => {
    try {
      setIsSubmitting(true)
      const token = await getValidToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile-image`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ profileImage })
      })
      
      if (response.ok) {
        setUserProfile(prev => prev ? { ...prev, profileImage } : null)
        const imageUrl = mapProfileImageToUrl(profileImage)
        setProfileImageUrl(imageUrl)
        setIsEditingProfileImage(false)
        setModal({ open: true, message: "프로필 이미지가 변경되었습니다." })
      } else {
        const errorMessage = await handleApiError(response, "프로필 이미지 변경에 실패했습니다.")
        console.error("프로필 이미지 변경 실패:", errorMessage)
        setModal({ open: true, message: errorMessage })
      }
    } catch (error) {
      console.error("프로필 이미지 변경 에러:", error)
      setModal({ open: true, message: "네트워크 오류가 발생했습니다. 다시 시도해주세요." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 프로필 이미지 선택 옵션
  const profileImageOptions = [
    { key: 'img_1', label: '이미지 1', color: 'from-blue-400 to-blue-600', image: '/images/profile/img_1.png' },
    { key: 'img_2', label: '이미지 2', color: 'from-green-400 to-green-600', image: '/images/profile/img_2.png' },
    { key: 'img_3', label: '이미지 3', color: 'from-purple-400 to-purple-600', image: '/images/profile/img_3.png' },
    { key: 'img_4', label: '이미지 4', color: 'from-pink-400 to-pink-600', image: '/images/profile/img_4.png' },
  ]

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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 shadow-sm">
        <Link href="/more" className="p-2">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <span className="text-lg font-medium text-gray-800">내 정보 관리</span>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                {isLoading ? (
                  <div className="w-16 h-16 bg-gray-300 animate-pulse rounded-full"></div>
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
                    size={64} 
                  />
                )}
              </div>
              <button
                onClick={() => setIsEditingProfileImage(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#4DA9FF] rounded-full flex items-center justify-center shadow-lg"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {isLoading ? "로딩 중..." : userProfile?.name || "사용자"}
              </h2>
              <p className="text-gray-500">프로필 정보를 관리하세요</p>
            </div>
          </div>
        </div>

        {/* Profile Image Selection Modal */}
        {isEditingProfileImage && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">프로필 이미지 선택</h3>
              <button
                onClick={() => setIsEditingProfileImage(false)}
                className="text-gray-500 text-sm"
              >
                취소
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {profileImageOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleProfileImageChange(option.key)}
                  disabled={isSubmitting}
                  className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                    userProfile?.profileImage === option.key ? 'border-[#4DA9FF] ring-2 ring-[#4DA9FF] ring-opacity-50' : 'border-transparent'
                  } disabled:opacity-50 transition-all`}
                >
                  <img
                    src={option.image}
                    alt={option.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 이미지 로드 실패 시 CSS 아바타로 fallback
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-16 h-16 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center text-white font-semibold">${option.key.split('_')[1]}</div>`;
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-800">이름</span>
            </div>
            {!isEditingName && (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-[#4DA9FF] text-sm font-medium"
              >
                수정
              </button>
            )}
          </div>
          
          {isEditingName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={nameForm.name}
                onChange={(e) => setNameForm({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA9FF]"
                placeholder="이름"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleNameChange}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#4DA9FF] text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "변경 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false)
                    setNameForm({ name: userProfile?.name || "" })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">{userProfile?.name || "이름 없음"}</p>
          )}
        </div>

        {/* Phone Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-800">전화번호</span>
            </div>
            {!isEditingPhone && (
              <button
                onClick={() => {
                  setIsEditingPhone(true)
                  // 현재 전화번호를 클린한 형태로 입력 필드에 설정
                  const cleanCurrentPhone = userPhone ? userPhone.replace(/-/g, '') : ""
                  setPhoneForm({ phoneNumber: cleanCurrentPhone })
                }}
                className="text-[#4DA9FF] text-sm font-medium"
              >
                수정
              </button>
            )}
          </div>
          
          {isEditingPhone ? (
            <div className="space-y-3">
              <input
                type="tel"
                value={phoneForm.phoneNumber}
                onChange={(e) => setPhoneForm({ phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA9FF]"
                placeholder="전화번호 (예: 01012345678)"
              />
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  현재 전화번호: {isLoading ? (
                    <span className="inline-block h-3 w-20 bg-gray-200 animate-pulse rounded"></span>
                  ) : userPhone ? (
                    <span className="font-medium">{formatPhoneNumber(userPhone)}</span>
                  ) : (
                    <span className="text-gray-400">등록된 전화번호 없음</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">010, 011, 016, 017, 018, 019로 시작하는 번호만 가능합니다.</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePhoneChange}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#4DA9FF] text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "변경 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setIsEditingPhone(false)
                    setPhoneForm({ phoneNumber: "" })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">
                {isLoading ? (
                  <span className="inline-block h-4 w-32 bg-gray-200 animate-pulse rounded"></span>
                ) : userPhone ? (
                  formatPhoneNumber(userPhone)
                ) : (
                  <span className="text-gray-400">전화번호가 등록되지 않았습니다</span>
                )}
              </p>
              {!isLoading && !userPhone && (
                <p className="text-xs text-gray-400 mt-1">수정 버튼을 눌러 전화번호를 등록해주세요</p>
              )}
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-800">비밀번호</span>
            </div>
            {!isEditingPassword && (
              <button
                onClick={() => setIsEditingPassword(true)}
                className="text-[#4DA9FF] text-sm font-medium"
              >
                변경
              </button>
            )}
          </div>
          
          {isEditingPassword ? (
            <div className="space-y-3">
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA9FF]"
                placeholder="현재 비밀번호 (6자리 숫자)"
                maxLength={6}
              />
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA9FF]"
                placeholder="새 비밀번호 (6자리 숫자)"
                maxLength={6}
              />
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DA9FF]"
                placeholder="새 비밀번호 확인 (6자리 숫자)"
                maxLength={6}
              />
              <p className="text-xs text-gray-500">비밀번호는 6자리 숫자여야 합니다.</p>
              <div className="flex space-x-2">
                <button
                  onClick={handlePasswordChange}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#4DA9FF] text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "변경 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setIsEditingPassword(false)
                    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">••••••</p>
          )}
        </div>
      </div>

      {/* 모달 렌더링 */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-xs w-full text-center">
            <p className="mb-6 text-gray-800 text-base whitespace-pre-line">{modal.message}</p>
            <button
              onClick={() => {
                setModal({ open: false, message: "" })
                modal.onClose?.()
              }}
              className="w-full py-3 rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white font-medium"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 