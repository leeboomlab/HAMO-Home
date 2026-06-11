import {
  GuestProfile,
  getGuestProfile,
  getOrCreateGuestId,
  saveGuestProfile,
} from "@/lib/storage/guestStorage";
import { EMPTY_CONCERNS, ProfileInfo } from "@/types/profile";

/** 게스트 모드 시작: 프로필이 없으면 빈 게스트 프로필 생성 */
export function createGuestProfile(): GuestProfile {
  const existing = getGuestProfile();
  if (existing) return existing;

  const profile: GuestProfile = {
    id: getOrCreateGuestId(),
    displayName: "",
    userType: "guest",
    birthYear: null,
    ageRange: null,
    gender: null,
    concerns: { ...EMPTY_CONCERNS },
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
  };
  saveGuestProfile(profile);
  return profile;
}

export function guestProfileToInfo(p: GuestProfile): ProfileInfo {
  return {
    id: p.id,
    displayName: p.displayName,
    userType: p.userType,
    birthYear: p.birthYear,
    ageRange: p.ageRange,
    gender: p.gender,
    isGuest: true,
    concerns: p.concerns,
    onboardingCompleted: p.onboardingCompleted,
  };
}
