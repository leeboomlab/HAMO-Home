export type UserType = "senior" | "caregiver" | "guest";

export type Gender = "male" | "female" | "other";

/** 온보딩에서 복수 선택하는 주요 걱정 항목 */
export interface ConcernFlags {
  fall: boolean;
  strength: boolean;
  balance: boolean;
  walking: boolean;
  exercise: boolean;
  parentStatus: boolean;
}

export const EMPTY_CONCERNS: ConcernFlags = {
  fall: false,
  strength: false,
  balance: false,
  walking: false,
  exercise: false,
  parentStatus: false,
};

export interface ConsentFlags {
  /** 개인정보/건강관리 참고용 동의 (필수) */
  privacyRequired: boolean;
  healthNoticeRequired: boolean;
  /** 알림 수신 동의 (선택) */
  notificationOptional: boolean;
}

/** 게스트/로그인 공통으로 화면에서 사용하는 프로필 형태 */
export interface ProfileInfo {
  id: string;
  displayName: string;
  userType: UserType;
  birthYear: number | null;
  ageRange: string | null;
  gender: Gender | null;
  isGuest: boolean;
  concerns: ConcernFlags;
  onboardingCompleted: boolean;
}

export interface ReminderPreference {
  enabled: boolean;
  /** 'HH:mm' 형식 */
  preferredTime: string | null;
}
