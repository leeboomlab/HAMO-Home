# HAMO B2C 모바일 웹앱 MVP 개발 프롬프트

## 0. 프로젝트 개요

HAMO B2C 모바일 웹앱을 개발한다.

HAMO는 시니어와 보호자가 집에서 간단히 움직임 상태를 확인하고, 매일 짧은 운동 루틴을 꾸준히 수행할 수 있도록 돕는 모바일 웹앱이다.

초기 목표는 앱스토어 앱이 아니라 **모바일 웹/PWA**다. 사용자는 카카오톡, 문자, 인스타그램, 블로그 링크를 통해 접속하고, 설치 없이 바로 사용할 수 있어야 한다.

핵심 방향은 다음과 같다.

* 모바일 웹/PWA
* 구글 로그인 지원
* 로그인 없이 바로 시작하는 게스트 모드 지원
* 카메라 기반 30초 앉았다 일어나기 측정
* 전면/후면 카메라 전환
* 기기 내 로컬 분석
* 매일 수행하는 데일리 루틴
* 결과 리포트
* 운동 streak / 출석 / 연속 참여 유도
* 가족에게 공유 가능한 결과 화면
* 의료 진단이 아닌 건강관리 참고용 자가 체크

기관 추천 기능은 이번 MVP에서 제외한다.

---

## 1. 핵심 제품 방향

이 앱은 “정밀 의료 측정 앱”이 아니다.

목표는 다음이다.

> 시니어가 매일 3~5분 정도 가볍게 움직임을 체크하고, 보호자와 함께 변화를 확인하는 모바일 웹앱

측정 결과는 정밀한 진단처럼 표현하지 말고, 구간형/참고형으로 보여준다.

결과 구간:

* 양호
* 보통
* 주의
* 재측정 권장

반드시 다음 문구를 서비스 곳곳에 포함한다.

> 본 서비스는 의료 진단이 아닌 건강관리 참고용 자가 체크 서비스입니다.

카메라 관련 신뢰 문구도 포함한다.

> 카메라 영상은 서버에 저장되지 않고, 기기에서 분석됩니다.

---

## 2. 로그인 정책

초기 진입 화면에서 사용자는 두 가지 선택지를 가진다.

1. Google로 로그인
2. 로그인 없이 바로 시작

### 2-1. Google 로그인

Google 로그인은 다음 기능을 사용할 때 권장된다.

* 여러 기기에서 기록 보기
* 히스토리 저장
* streak 장기 저장
* 가족 공유 링크 관리
* 추후 알림/리마인더 기능
* 장기 변화 그래프

Google 로그인 버튼 문구:

> Google로 계속하기

보조 설명:

> 기록을 안전하게 저장하고 여러 기기에서 확인할 수 있어요.

### 2-2. 게스트 모드

게스트 모드는 로그인 없이 바로 사용할 수 있어야 한다.

게스트 모드 버튼 문구:

> 로그인 없이 바로 시작

보조 설명:

> 먼저 체험해보고, 나중에 기록을 저장할 수 있어요.

게스트 모드에서는 다음이 가능하다.

* 온보딩
* 오늘 루틴 시작
* 카메라 측정
* 결과 리포트 확인
* 로컬 히스토리 일부 저장
* 결과 공유

게스트 모드에서는 localStorage 또는 익명 사용자 ID를 사용한다.

게스트 모드의 제한:

* 브라우저 삭제 시 기록이 사라질 수 있음
* 다른 기기에서 기록 확인 불가
* 장기 히스토리/알림 기능 제한
* 계정 연동 전까지 Supabase user와 완전히 연결되지 않을 수 있음

게스트 모드 사용 중 결과 저장을 유도하는 문구:

> 오늘 결과를 계속 저장하려면 Google로 로그인해 주세요.

또는:

> 로그인하면 매일 변화 기록을 안전하게 보관할 수 있어요.

### 2-3. 게스트 → Google 계정 전환

게스트 사용자가 나중에 Google 로그인하면 기존 localStorage 기록을 계정에 연결할 수 있도록 구조를 설계한다.

MVP에서는 완전한 migration이 어렵다면 TODO로 남기되, 구조는 고려한다.

필요한 함수 예시:

* `createGuestProfile()`
* `getCurrentProfile()`
* `linkGuestDataToUser(userId)`
* `migrateLocalAssessmentsToSupabase(userId)`

---

## 3. 기술 스택

다음 스택으로 개발한다.

* Next.js App Router
* TypeScript
* React
* Tailwind CSS
* Supabase
* Supabase Auth
* Google OAuth
* MediaPipe Pose Landmarker Web
* PWA 대응 가능 구조
* 모바일 우선 반응형 UI

가능하면 shadcn/ui 스타일의 깔끔한 컴포넌트 구조를 사용한다. 설치되어 있지 않다면 Tailwind 기반으로 직접 구현해도 된다.

---

## 4. 전체 아키텍처

기본 분석은 서버가 아니라 브라우저 로컬에서 수행한다.

흐름은 다음과 같다.

1. 사용자가 모바일 웹 접속
2. 시작 화면에서 Google 로그인 또는 게스트 시작 선택
3. 온보딩 진행
4. 카메라 권한 허용
5. 전면/후면 카메라 선택 또는 전환
6. MediaPipe Pose Landmarker Web으로 브라우저에서 포즈 추출
7. 브라우저에서 30초 앉았다 일어나기 횟수와 간단 품질 지표 계산
8. Supabase에는 원본 영상이나 전체 좌표를 기본 저장하지 않음
9. 로그인 사용자는 Supabase에 결과 요약 저장
10. 게스트 사용자는 localStorage에 결과 저장하고, 가능하면 익명 profile_id 형태로 저장
11. 결과 리포트 표시
12. 데일리 루틴 완료 처리
13. streak, 히스토리, 추천 운동 표시

---

## 5. MVP 필수 화면

### 5-1. 시작 화면

경로: `/start`

최초 진입 또는 로그인 상태가 없을 때 보여준다.

포함 요소:

* HAMO 로고
* 메인 문구
* 서브 문구
* Google 로그인 버튼
* 로그인 없이 바로 시작 버튼
* 개인정보/카메라 신뢰 문구
* 의료 진단 아님 고지

메인 문구 예시:

> 부모님이 넘어지기 전에, 매일 3분만 확인하세요.

서브 문구:

> 카메라로 간단한 움직임을 확인하고, 가족이 이해하기 쉬운 리포트를 받아보세요.

버튼:

* `Google로 계속하기`
* `로그인 없이 바로 시작`

하단 신뢰 문구:

> 카메라 영상은 서버에 저장되지 않고, 기기에서 분석됩니다.

---

### 5-2. 홈 화면

경로: `/`

목표: 사용자가 오늘의 루틴을 바로 시작하게 하기

포함 요소:

* HAMO 로고 텍스트
* 오늘 날짜
* 오늘의 인사 문구
* 로그인 상태 표시

  * Google 로그인 사용자: 프로필 이름 표시
  * 게스트 사용자: `게스트 모드`
* 게스트 사용자인 경우 작은 로그인 유도 배너
* 오늘의 루틴 카드
* 연속 수행일 streak 표시
* 오늘 완료 여부
* 주요 CTA 버튼: `오늘 루틴 시작하기`
* 보조 버튼: `지난 결과 보기`
* 신뢰 문구: `영상은 저장되지 않고 기기에서 분석됩니다`

게스트 배너 예시:

> 게스트 모드로 이용 중이에요. 로그인하면 기록을 안전하게 저장할 수 있어요.

버튼:

> Google로 기록 저장하기

---

### 5-3. 온보딩 화면

경로: `/onboarding`

최초 접속 시 사용자 정보를 간단히 입력한다.

입력 항목:

* 사용자 유형: `시니어 본인` / `보호자`
* 이름 또는 닉네임
* 출생연도 또는 연령대
* 성별 선택 optional
* 주요 걱정 항목 복수 선택

  * 낙상 위험
  * 다리 근력 저하
  * 균형감각 저하
  * 보행 불안
  * 운동 부족
  * 부모님 상태 확인
* 알림 동의 optional
* 개인정보/건강관리 참고용 동의 required

Google 로그인 사용자는 Supabase profile에 저장한다.

게스트 사용자는 localStorage에 저장하되, 추후 Google 로그인 시 Supabase로 이전 가능하게 설계한다.

---

### 5-4. 데일리 루틴 화면

경로: `/daily`

오늘 수행할 루틴을 보여준다.

MVP 루틴:

1. 준비 안내
2. 30초 앉았다 일어나기 측정
3. 결과 확인
4. 추천 운동 1~2개 표시
5. 오늘 루틴 완료

UI 요소:

* 오늘 루틴 진행 단계
* 예상 소요 시간: `약 3분`
* 안전 안내
* 시작 버튼

안전 문구:

> 어지럽거나 불편하면 즉시 중단하세요. 보호자가 옆에서 함께 진행하면 더 안전합니다.

---

### 5-5. 카메라 세팅 화면

경로: `/assessment/setup`

카메라 측정 전 준비 화면이다.

반드시 들어가야 하는 기능:

* 카메라 권한 요청
* 전면/후면 카메라 전환 버튼
* 현재 선택된 카메라 표시
* 기기에서 사용 가능한 카메라 목록이 있으면 선택 가능하게 구현
* 전면/후면 전환은 `facingMode: 'user'` / `facingMode: 'environment'`를 우선 사용
* `enumerateDevices()`로 사용 가능한 video input 목록을 가져와 fallback 처리
* 모바일 Safari/Chrome 대응
* 카메라 권한 거부 시 안내 UI

UI 문구:

* `전신이 화면에 보이도록 2~3m 떨어져 주세요.`
* `의자가 움직이지 않도록 벽 가까이에 두세요.`
* `밝은 곳에서 진행해 주세요.`
* `카메라 전환`
* `전면 카메라`
* `후면 카메라`

카메라 프리뷰 위에는 guide frame을 표시한다.

상태 표시:

* `전신 인식 중`
* `인식 양호`
* `조금 더 뒤로 가주세요`
* `전신이 화면에 보이게 해주세요`
* `조명이 어두워요`

---

### 5-6. 30초 앉았다 일어나기 측정 화면

경로: `/assessment/sit-to-stand`

실제 측정 화면이다.

포함 요소:

* 실시간 카메라 프리뷰
* 포즈 skeleton overlay
* 30초 타이머
* 현재 횟수 count
* 측정 품질 상태
* 시작 / 일시정지 / 중단 / 다시 측정 버튼
* 카메라 전환 버튼
* 안전 안내

MediaPipe에서 주요 landmark를 사용한다.

* left/right shoulder
* left/right hip
* left/right knee
* left/right ankle

계산할 값:

* hip center y
* shoulder center y
* knee center y
* torso height
* body visibility score
* valid frame ratio
* approximate sit/stand state

카운트 로직:

* sitting 상태와 standing 상태를 구분
* hip_y 변화량과 torso/hip-knee 관계를 활용
* sitting → standing 전환이 안정적으로 감지되면 1회 count
* 너무 빠른 전환은 noise로 무시
* 최소 반복 간격 설정
* tracking lost 상태에서는 count 하지 않음

정확도보다 안정성을 우선한다.

기본 타입 구조:

```ts
type SitStandState = 'unknown' | 'sitting' | 'standing' | 'transition';

interface SitStandFrame {
  timestamp: number;
  hipY: number;
  shoulderY: number;
  kneeY: number;
  visibility: number;
  state: SitStandState;
}

interface SitStandResult {
  durationSec: number;
  repCount: number;
  avgRepTimeSec: number | null;
  validFrameRatio: number;
  avgFps: number;
  trackingLostCount: number;
  qualityScore: number;
  resultLevel: 'good' | 'normal' | 'caution' | 'retry';
}
```

---

### 5-7. 측정 품질 점수

로컬 MediaPipe는 기기 성능 차이가 크므로 반드시 quality score를 계산한다.

quality score에 반영할 항목:

* 평균 FPS
* 유효 프레임 비율
* 주요 관절 visibility 평균
* tracking lost 횟수
* 전신이 화면에 들어온 비율
* 측정 중 카메라 프레임 끊김

결과 품질 구간:

* `높음`
* `보통`
* `낮음`
* `재측정 권장`

품질이 낮으면 정량 점수보다 재측정 안내를 우선 표시한다.

문구 예시:

> 이번 측정은 카메라 인식률이 낮아 정확한 결과를 제공하기 어렵습니다. 밝은 곳에서 전신이 보이도록 다시 측정해 주세요.

---

### 5-8. 결과 리포트 화면

경로: `/report/[assessmentId]`

결과 리포트는 보호자가 이해하기 쉽게 보여준다.

포함 요소:

* 오늘의 움직임 상태
* 앉았다 일어나기 횟수
* 움직임 안정성
* 측정 신뢰도
* HAMO 한마디
* 추천 운동
* 오늘 루틴 완료 표시
* 가족에게 공유하기
* 내 기록 보기
* 내일도 하기 CTA
* 게스트 사용자인 경우 Google 로그인 유도

기관 추천 기능은 제외한다.

결과 레벨:

* 양호
* 보통
* 주의
* 재측정 권장

예시 문구:

* `오늘의 움직임 상태: 보통`
* `30초 동안 8회 수행했어요.`
* `일어서는 속도는 무난했지만 후반부에 약간의 흔들림이 보였어요.`
* `오늘은 하체 근력과 균형 운동을 함께 해보세요.`

게스트 로그인 유도 문구:

> 오늘 결과를 계속 저장하려면 Google로 로그인해 주세요.

버튼:

> 기록 저장하기

---

### 5-9. 데일리 습관화 기능

사용자가 매일매일 하게 만드는 것이 목표다.

구현할 기능:

#### 출석 / streak

* 오늘 루틴 완료 여부
* 연속 완료 일수
* 이번 주 완료 횟수
* 월간 달력 뷰 optional
* 3일 연속 / 7일 연속 뱃지

문구 예시:

* `3일 연속 체크 중이에요!`
* `이번 주 4번 움직임을 확인했어요.`
* `내일도 3분만 함께해요.`

#### 오늘의 미션

MVP에서는 rule-based로 간단히 추천한다.

예시:

* 측정 결과 양호: `가볍게 유지 운동`
* 보통: `하체 근력 운동`
* 주의: `벽 잡고 균형 운동`
* 재측정 권장: `카메라 위치를 조정하고 다시 측정`

#### 리마인더

MVP에서는 실제 push notification까지 필수는 아니다.

우선 구현:

* 사용자가 원하는 체크 시간 선택 UI
* localStorage 또는 Supabase에 저장
* 알림 기능은 추후 확장 가능하게 TODO 처리
* PWA notification은 가능하면 구조만 잡기

---

### 5-10. 히스토리 화면

경로: `/history`

포함 요소:

* 최근 측정 목록
* 날짜별 결과
* rep count 변화
* quality score
* streak
* 간단한 추세 문구
* 게스트 모드일 경우 “기록이 이 브라우저에만 저장됩니다” 안내

초기에는 복잡한 그래프보다 카드 리스트로 충분하다.

예시:

* `6월 11일 - 8회 - 보통`
* `6월 10일 - 7회 - 보통`
* `6월 09일 - 재측정 권장`

---

### 5-11. 가족 공유 기능

경로: `/share/[assessmentId]`

공유 기능:

* 결과 요약 링크 복사
* Web Share API 사용 가능하면 사용
* 카카오톡 공유는 추후 확장 TODO
* 공유용 결과 페이지는 개인정보를 최소화해서 표시
* 이름 대신 닉네임 또는 `부모님`으로 표시 가능

공유 문구 예시:

> HAMO로 오늘의 움직임 체크를 완료했어요. 가족과 함께 확인해보세요.

---

## 6. Supabase 데이터 구조

다음 테이블을 기준으로 구현한다.

게스트 모드는 localStorage 기반으로 시작하되, Google 로그인 사용자는 Supabase에 저장한다.

### profiles

```sql
id uuid primary key
auth_user_id uuid null
display_name text
user_type text -- 'senior' | 'caregiver' | 'guest'
birth_year int null
age_range text null
gender text null
is_guest boolean default false
guest_id text null
created_at timestamptz default now()
```

### user_concerns

```sql
id uuid primary key
profile_id uuid references profiles(id)
concern_fall boolean default false
concern_strength boolean default false
concern_balance boolean default false
concern_walking boolean default false
concern_exercise boolean default false
concern_parent_status boolean default false
created_at timestamptz default now()
```

### consents

```sql
id uuid primary key
profile_id uuid references profiles(id)
privacy_required boolean
health_notice_required boolean
anonymous_stats_required boolean
marketing_optional boolean default false
raw_landmark_optional boolean default false
created_at timestamptz default now()
```

### assessments

```sql
id uuid primary key
profile_id uuid references profiles(id)
assessment_type text -- 'sit_to_stand_30s'
status text -- 'completed' | 'failed' | 'cancelled'
started_at timestamptz
completed_at timestamptz
duration_sec int
device_type text
browser text
camera_facing text -- 'user' | 'environment' | 'unknown'
analyzer_version text
created_at timestamptz default now()
```

### assessment_results

```sql
id uuid primary key
assessment_id uuid references assessments(id)
rep_count int
avg_rep_time_sec numeric null
valid_frame_ratio numeric
avg_fps numeric
tracking_lost_count int
quality_score int
quality_level text -- 'high' | 'medium' | 'low' | 'retry'
result_level text -- 'good' | 'normal' | 'caution' | 'retry'
stability_score int null
asymmetry_score int null
result_summary text
recommendation_json jsonb
created_at timestamptz default now()
```

### daily_logs

```sql
id uuid primary key
profile_id uuid references profiles(id)
log_date date
completed boolean default false
assessment_id uuid references assessments(id) null
streak_count int default 0
created_at timestamptz default now()
unique(profile_id, log_date)
```

### reminder_preferences

```sql
id uuid primary key
profile_id uuid references profiles(id)
preferred_time text null
enabled boolean default false
created_at timestamptz default now()
```

### report_views

```sql
id uuid primary key
assessment_id uuid references assessments(id)
viewed_at timestamptz default now()
shared_channel text null
```

---

## 7. localStorage 게스트 데이터 구조

게스트 모드에서는 다음 키를 사용한다.

```ts
const STORAGE_KEYS = {
  guestId: 'hamo_guest_id',
  guestProfile: 'hamo_guest_profile',
  guestConsents: 'hamo_guest_consents',
  guestAssessments: 'hamo_guest_assessments',
  guestDailyLogs: 'hamo_guest_daily_logs',
  guestReminder: 'hamo_guest_reminder',
};
```

게스트 assessment 예시:

```ts
interface GuestAssessment {
  id: string;
  assessmentType: 'sit_to_stand_30s';
  completedAt: string;
  result: {
    repCount: number;
    avgRepTimeSec: number | null;
    qualityScore: number;
    qualityLevel: 'high' | 'medium' | 'low' | 'retry';
    resultLevel: 'good' | 'normal' | 'caution' | 'retry';
    resultSummary: string;
  };
}
```

추후 Google 로그인 시 localStorage 데이터를 Supabase로 migration할 수 있게 함수 구조를 분리한다.

---

## 8. 폴더 구조 제안

다음 구조로 만든다.

```txt
app/
  start/
    page.tsx
  auth/
    callback/
      route.ts
  page.tsx
  onboarding/
    page.tsx
  daily/
    page.tsx
  assessment/
    setup/
      page.tsx
    sit-to-stand/
      page.tsx
  report/
    [assessmentId]/
      page.tsx
  history/
    page.tsx
  share/
    [assessmentId]/
      page.tsx

components/
  layout/
    MobileShell.tsx
    Header.tsx
    BottomNav.tsx
  auth/
    GoogleLoginButton.tsx
    GuestStartButton.tsx
    GuestModeBanner.tsx
    LoginPromptCard.tsx
  home/
    TodayRoutineCard.tsx
    StreakCard.tsx
  onboarding/
    ConsentForm.tsx
    ConcernSelector.tsx
  camera/
    CameraPreview.tsx
    CameraSwitcher.tsx
    PoseOverlay.tsx
    CameraGuide.tsx
    CameraPermissionState.tsx
  assessment/
    SitStandTimer.tsx
    RepCounter.tsx
    QualityBadge.tsx
    SafetyNotice.tsx
  report/
    ResultSummaryCard.tsx
    MetricCard.tsx
    HamoCommentCard.tsx
    RecommendedExerciseCard.tsx
    ShareButton.tsx
  history/
    HistoryList.tsx
    StreakCalendar.tsx

lib/
  auth/
    authClient.ts
    guest.ts
    session.ts
    migrateGuest.ts
  supabase/
    client.ts
    queries.ts
  storage/
    guestStorage.ts
  mediapipe/
    poseLandmarker.ts
    types.ts
  camera/
    cameraDevices.ts
    cameraConstraints.ts
  analyzers/
    sitToStandAnalyzer.ts
    qualityScore.ts
  scoring/
    resultLevel.ts
    reportCopy.ts
  utils/
    device.ts
    date.ts

types/
  profile.ts
  assessment.ts
  report.ts
  auth.ts
```

---

## 9. UI 스타일 가이드

브랜드 컬러는 보라색 계열이다.

분위기:

* 따뜻함
* 신뢰감
* 시니어/보호자 친화적
* 의료앱처럼 차갑지 않게
* 너무 장난스럽지 않게
* 큰 글자
* 넓은 터치 영역
* 둥근 카드
* 쉬운 문장

추천 색상:

```ts
const colors = {
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  primaryDark: '#4C1D95',
  text: '#111827',
  subText: '#6B7280',
  background: '#FAFAFF',
  card: '#FFFFFF',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
}
```

모바일 최적화:

* 버튼 높이 최소 52px
* 본문 글자 16px 이상
* 주요 숫자 32px 이상
* 하단 CTA 고정 가능
* 한 화면에서 너무 많은 정보 금지

---

## 10. 구현 시 주의사항

### 로그인

* Google 로그인과 게스트 모드를 모두 지원한다.
* 첫 화면에서 로그인 강제 금지.
* Google 로그인 성공 후 `/` 또는 `/daily`로 이동.
* 게스트 사용자는 localStorage 기반으로 계속 사용할 수 있어야 한다.
* 게스트 사용자가 결과 저장이나 히스토리 장기 보관을 원할 때 Google 로그인 유도.
* 추후 게스트 데이터 migration 가능하게 구조 분리.

### 카메라

* iOS Safari에서 카메라 권한과 facingMode 동작이 다를 수 있음.
* `facingMode`가 안 먹으면 `enumerateDevices()` 기반으로 deviceId를 사용.
* 카메라 전환 시 기존 stream track을 반드시 stop 처리.
* 페이지 이탈 시 stream 정리.
* 에러 상태 UI 구현.

### MediaPipe

* 모델 로딩 상태 표시.
* 모델 로딩 실패 시 안내.
* 낮은 FPS에서는 분석 빈도 줄이기.
* 모든 프레임을 분석하지 말고 throttle 처리.
* 가능하면 10~15fps 수준으로 추론.

### 성능

* 카메라 해상도는 640x480 또는 640x360 권장.
* 모바일에서 과도한 overlay 렌더링 금지.
* requestAnimationFrame 사용.
* Web Worker는 추후 고려.
* 오래된 기기에서는 간편 모드 fallback 가능하게 구조만 잡기.

### 측정 결과

* 정밀한 낙상위험 확률처럼 표현하지 말 것.
* 의료 진단처럼 표현하지 말 것.
* 측정 품질 낮으면 결과보다 재측정 안내 우선.
* 사람 간 비교 금지.
* 초반에는 본인 기록 변화 중심.

---

## 11. 이번 MVP에서 제외할 것

다음 기능은 이번 MVP에서 구현하지 않는다.

* 기관 추천 기능
* 결제
* 보험사/인바디 연동
* 기관 관리자 페이지
* 카메라 기반 반응속도
* 복잡한 게임
* 원본 영상 저장
* 전체 raw landmark CSV 기본 저장
* 의료 진단 문구
* 낙상위험 확률 %
* 또래 평균 비교
* 앱스토어 네이티브 앱

---

## 12. 완료 기준

MVP 완료 기준은 다음이다.

1. 모바일에서 접속 가능
2. 시작 화면에서 Google 로그인 가능
3. 시작 화면에서 게스트 모드 시작 가능
4. 온보딩 완료 가능
5. 게스트 정보가 localStorage에 저장됨
6. Google 로그인 사용자는 Supabase profile에 저장됨
7. 카메라 권한 요청 가능
8. 전면/후면 카메라 전환 가능
9. MediaPipe Pose가 모바일 브라우저에서 작동
10. 30초 앉았다 일어나기 측정 가능
11. 반복 횟수와 품질 점수 계산 가능
12. 결과 리포트 표시 가능
13. 오늘 루틴 완료 처리 가능
14. streak 표시 가능
15. 히스토리에서 과거 결과 확인 가능
16. 결과 공유 링크 생성 가능
17. 로그인 사용자는 Supabase에 결과 요약 저장 가능
18. 게스트 사용자는 localStorage에 결과 요약 저장 가능
19. 원본 영상은 저장하지 않음
20. 측정 품질 낮을 경우 재측정 권장 처리

---

## 13. 먼저 구현할 순서

아래 순서대로 구현한다.

### Step 1

Next.js + TypeScript + Tailwind 프로젝트 기본 구조 생성

### Step 2

모바일 UI Shell, 시작 화면, Google 로그인 버튼, 게스트 시작 버튼 구현

### Step 3

Supabase Auth Google OAuth callback 구조 작성

### Step 4

게스트 모드 localStorage 구조 작성

### Step 5

홈 화면, 온보딩 화면 구현

### Step 6

Supabase client, 타입, 기본 insert/query 함수 작성

### Step 7

카메라 권한 요청, 카메라 프리뷰, 전면/후면 전환 구현

### Step 8

MediaPipe Pose Landmarker Web 로딩 및 skeleton overlay 구현

### Step 9

30초 앉았다 일어나기 측정 UI 구현

### Step 10

sitToStandAnalyzer.ts에 기본 카운트 로직 구현

### Step 11

qualityScore.ts 구현

### Step 12

결과 리포트 화면 구현

### Step 13

daily_logs 또는 localStorage 기반 streak / today complete 기능 구현

### Step 14

history 화면 구현

### Step 15

공유 링크 화면 구현

### Step 16

게스트 사용자의 Google 로그인 유도 및 migration TODO 구조 작성

---

## 14. 코드 품질 요구사항

* TypeScript 타입을 명확히 작성.
* 분석 로직은 UI 컴포넌트 안에 넣지 말고 `lib/analyzers`로 분리.
* 카메라 관련 로직은 `lib/camera`로 분리.
* MediaPipe 관련 로직은 `lib/mediapipe`로 분리.
* Supabase query는 `lib/supabase/queries.ts`로 분리.
* 게스트 모드 관련 로직은 `lib/auth/guest.ts`와 `lib/storage/guestStorage.ts`로 분리.
* Google 로그인 관련 로직은 `lib/auth/authClient.ts`로 분리.
* UI 컴포넌트는 재사용 가능하게 작성.
* 모바일 브라우저 에러 대응을 꼼꼼하게 작성.
* TODO 주석으로 향후 확장 지점 표시.

---

## 15. 최종적으로 원하는 사용자 경험

사용자는 앱을 열고 이렇게 느껴야 한다.

> “로그인 없이도 바로 해볼 수 있네.”
> “마음에 들면 Google로 저장하면 되겠네.”
> “부모님 움직임 상태를 어렵지 않게 확인할 수 있네.”
> “매일 3분이면 할 수 있겠네.”
> “결과가 숫자만 있는 게 아니라 쉽게 설명돼서 좋다.”
> “영상이 저장되지 않는다고 하니 부담이 적다.”
> “내일도 한 번 해봐야겠다.”

이 경험을 중심으로 개발한다.
