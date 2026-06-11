# HAMO B2C 모바일 웹앱 MVP

시니어와 보호자가 집에서 카메라로 간단히 움직임 상태를 확인하고, 매일 짧은 운동 루틴을 꾸준히 수행하도록 돕는 모바일 웹앱(PWA)입니다.

> 본 서비스는 의료 진단이 아닌 건강관리 참고용 자가 체크 서비스입니다.
> 카메라 영상은 서버에 저장되지 않고, 기기에서 분석됩니다.

## 기술 스택

- Next.js (App Router) + TypeScript + React
- Tailwind CSS v4
- Supabase (Auth: Google OAuth, DB)
- MediaPipe Pose Landmarker Web (`@mediapipe/tasks-vision`) — 브라우저 로컬 분석
- PWA 대응 (manifest)

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.

> 카메라(getUserMedia)는 HTTPS 또는 localhost에서만 동작합니다.
> 모바일 실기기 테스트 시 ngrok 등 터널링을 사용하세요.
>
> **ngrok 모바일 접속 시 주의**
> 1. 모바일 테스트는 `npm run dev:mobile` 로 서버를 실행하세요.
> 2. `next.config.ts`의 `allowedDevOrigins` + (선택) `.env.local`의 `MOBILE_DEV_HOST=본인.ngrok-free.app`
> 3. 설정 변경 후 **dev 서버를 반드시 재시작**하세요.
> 4. 아이폰 Safari 주소는 `https://xxxx.ngrok-free.app/start` 로 접속 (루트 `/` 말고).

### Supabase 설정 (선택)

환경변수가 없으면 앱은 **게스트 모드(localStorage)** 로만 동작합니다.
Google 로그인·서버 저장·공유 링크를 쓰려면:

1. Supabase 프로젝트 생성 후 `supabase/migrations/0001_init.sql` 실행 (스키마 + RLS)
2. Supabase Auth에서 **Google provider** 활성화 (Google Cloud Console OAuth 클라이언트 필요)
3. Supabase Auth에서 **Anonymous Sign-ins** 활성화 (게스트 기록 서버 저장)
4. `.env.local.example`을 `.env.local`로 복사하고 값 입력

## 주요 화면

| 경로 | 설명 |
| --- | --- |
| `/start` | 시작 화면 (Google 로그인 / 게스트 시작) |
| `/` | 홈 (오늘의 루틴, streak, 완료 현황) |
| `/onboarding` | 온보딩 (사용자 정보, 걱정 항목, 동의) |
| `/daily` | 데일리 루틴 안내 |
| `/assessment/sit-to-stand` | 30초 앉았다 일어나기 측정 (세팅→캘리브레이션→측정 통합) |
| `/report/[assessmentId]` | 결과 리포트 |
| `/history` | 측정 기록 / 주간 출석 |
| `/settings` | 설정 (리마인더, 로그인/로그아웃) |
| `/share/[shareToken]` | 가족 공유용 결과 페이지 (요약 스냅샷) |

## 아키텍처 메모

- **로컬 분석**: 영상·원본 좌표는 저장하지 않고, 브라우저에서 MediaPipe로 포즈를 추출해 결과 요약만 저장
- **게스트 모드**: Supabase Anonymous Auth + localStorage 이중 저장. Google 연결 시 `linkIdentity`로 계정 전환 (`lib/auth/anonymous.ts`, `lib/auth/migrateGuest.ts`)
- **카운트 로직**: 측정 시작 전 앉은 자세 캘리브레이션 → torso 높이로 정규화한 hip-knee 비율 + 히스테리시스 + 최소 반복 간격 (`lib/analyzers/sitToStandAnalyzer.ts`)
- **품질 점수**: FPS/유효 프레임/visibility/tracking lost 기반. 품질이 낮으면 결과보다 재측정 안내 우선 (`lib/analyzers/qualityScore.ts`)
- **공유**: 게스트 기록은 서버에 없으므로, 공유 시점에 개인정보 최소화된 "요약 스냅샷"만 `share_snapshots`에 저장하고 토큰 링크로 조회

## 폴더 구조

```txt
app/            라우트 (start, onboarding, daily, assessment, report, history, settings, share, auth/callback)
components/     layout / auth / home / onboarding / camera / assessment / report / history
lib/
  analyzers/    sitToStandAnalyzer, qualityScore
  auth/         anonymous, authClient, guest, guestServerSync, session, migrateGuest
  camera/       cameraDevices, cameraConstraints, useCamera
  data/         records (게스트·로그인 공통 기록 계층)
  mediapipe/    poseLandmarker, types
  scoring/      resultLevel, reportCopy
  share/        shareSnapshot
  storage/      guestStorage
  supabase/     client, server, queries
  utils/        date, device
supabase/migrations/  스키마 + RLS SQL
types/          profile, assessment, report, auth
```
