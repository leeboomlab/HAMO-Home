"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import Header from "@/components/layout/Header";
import ConcernSelector from "@/components/onboarding/ConcernSelector";
import ConsentForm from "@/components/onboarding/ConsentForm";
import { ensureAnonymousSession } from "@/lib/auth/anonymous";
import { migrateLocalAssessmentsToSupabase } from "@/lib/auth/migrateGuest";
import { createGuestProfile } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createProfileForGuest,
  createProfileForUser,
} from "@/lib/supabase/queries";
import { hardNavigate, isRemoteDevAccess } from "@/lib/utils/navigate";
import TouchButton from "@/components/ui/TouchButton";
import {
  saveGuestConsents,
  saveGuestProfile,
} from "@/lib/storage/guestStorage";
import {
  ConcernFlags,
  ConsentFlags,
  EMPTY_CONCERNS,
  Gender,
  UserType,
} from "@/types/profile";

const AGE_RANGES = ["50대 이하", "60대", "70대", "80대 이상"];

export default function OnboardingPage() {
  const router = useRouter();

  // 게스트 프로필·익명 Auth 세션은 진입 시 보장 (JS 지연 대비)
  useEffect(() => {
    createGuestProfile();
    void ensureAnonymousSession();
  }, []);

  const [userType, setUserType] = useState<UserType | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [concerns, setConcerns] = useState<ConcernFlags>({
    ...EMPTY_CONCERNS,
  });
  const [consents, setConsents] = useState<ConsentFlags>({
    privacyRequired: false,
    healthNoticeRequired: false,
    notificationOptional: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    userType !== null &&
    displayName.trim().length > 0 &&
    consents.privacyRequired &&
    consents.healthNoticeRequired &&
    !saving;

  const handleSubmit = async () => {
    if (!canSubmit || !userType) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const guest = createGuestProfile();
      const onboardingInput = {
        displayName: displayName.trim(),
        userType,
        birthYear: null as number | null,
        ageRange,
        gender,
        concerns,
        consents,
      };

      saveGuestProfile({
        ...guest,
        displayName: onboardingInput.displayName,
        userType,
        ageRange,
        gender,
        concerns,
        onboardingCompleted: true,
      });
      saveGuestConsents(consents);

      if (supabase) {
        const user = (await ensureAnonymousSession()) ?? null;
        if (user?.is_anonymous) {
          const profileId = await createProfileForGuest(
            supabase,
            user.id,
            guest.id,
            onboardingInput,
          );
          if (!profileId) {
            setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
            setSaving(false);
            return;
          }
          await migrateLocalAssessmentsToSupabase(supabase, profileId);
        } else if (user) {
          const profileId = await createProfileForUser(
            supabase,
            user.id,
            onboardingInput,
          );
          if (!profileId) {
            setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
            setSaving(false);
            return;
          }
        }
      }

      if (isRemoteDevAccess()) {
        hardNavigate("/");
      } else {
        router.replace("/");
      }
    } catch {
      setError("저장 중 문제가 발생했어요. 다시 시도해 주세요.");
      setSaving(false);
    }
  };

  return (
    <MobileShell className="px-5 pb-10">
      <Header logoHref="/start" />
      <h1 className="text-2xl font-black text-ink mt-2">
        시작 전에 간단히 알려주세요
      </h1>
      <p className="text-base text-sub mt-1">
        딱 맞는 안내를 위해 몇 가지만 여쭤볼게요.
      </p>

      <section className="mt-6">
        <h2 className="text-base font-bold text-ink mb-2">누가 사용하나요?</h2>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["senior", "어르신"],
              ["caregiver", "보호자"],
            ] as [UserType, string][]
          ).map(([value, label]) => (
            <TouchButton
              key={value}
              aria-pressed={userType === value}
              onPress={() => setUserType(value)}
              className={`min-h-[52px] rounded-2xl border text-base px-3 transition ${
                userType === value
                  ? "bg-primary-light border-primary text-primary-dark font-bold"
                  : "bg-card border-gray-200 text-sub"
              }`}
            >
              {label}
            </TouchButton>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold text-ink mb-2">
          이름 또는 닉네임
        </h2>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="예: 김순자, 우리 어머니"
          maxLength={20}
          className="w-full min-h-[52px] rounded-2xl border border-gray-200 bg-card px-4 text-base text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary"
        />
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold text-ink mb-2">연령대</h2>
        <div className="grid grid-cols-2 gap-2">
          {AGE_RANGES.map((range) => (
            <TouchButton
              key={range}
              aria-pressed={ageRange === range}
              onPress={() => setAgeRange(range)}
              className={`min-h-[52px] rounded-2xl border text-base px-3 transition ${
                ageRange === range
                  ? "bg-primary-light border-primary text-primary-dark font-bold"
                  : "bg-card border-gray-200 text-sub"
              }`}
            >
              {range}
            </TouchButton>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold text-ink mb-2">
          성별 <span className="text-sm text-sub font-normal">(선택)</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["female", "여성"],
              ["male", "남성"],
            ] as [Gender, string][]
          ).map(([value, label]) => (
            <TouchButton
              key={value}
              aria-pressed={gender === value}
              onPress={() => setGender(gender === value ? null : value)}
              className={`min-h-[52px] rounded-2xl border text-base px-3 transition ${
                gender === value
                  ? "bg-primary-light border-primary text-primary-dark font-bold"
                  : "bg-card border-gray-200 text-sub"
              }`}
            >
              {label}
            </TouchButton>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold text-ink mb-2">
          요즘 어떤 점이 걱정되세요?{" "}
          <span className="text-sm text-sub font-normal">(복수 선택)</span>
        </h2>
        <ConcernSelector value={concerns} onChange={setConcerns} />
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold text-ink mb-2">동의해 주세요</h2>
        <ConsentForm value={consents} onChange={setConsents} />
      </section>

      {error && (
        <p className="mt-4 text-sm text-danger text-center">{error}</p>
      )}

      <TouchButton
        onPress={handleSubmit}
        disabled={!canSubmit}
        className="mt-8 w-full min-h-[56px] rounded-2xl bg-primary text-white text-lg font-bold shadow-md active:scale-[0.98] transition disabled:bg-gray-300 disabled:shadow-none"
      >
        {saving ? "저장 중..." : "시작하기"}
      </TouchButton>
    </MobileShell>
  );
}
