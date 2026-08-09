# Handoff — ANPC 예약 페이지

**이 문서만 읽고 바로 이어서 작업할 수 있도록 작성했다.** 프로젝트 배경/기능 요구사항은
`prd.md` 참고. Next.js 16 관련 주의사항은 `AGENTS.md` 참고(미들웨어가 `proxy.ts`로
개명되는 등 실제 breaking change가 있으니 새 API를 쓸 때는 `node_modules/next/dist/docs`를
먼저 확인할 것).

## 0. 현재 상태 요약

- **배포됨**: https://anpc-booking.vercel.app (Vercel, Production 정상 동작 확인됨)
- **GitHub**: https://github.com/jhj144/anpc-booking (public). 로컬 git과 동기화되어
  있음. **로컬에서 커밋만 하고 `git push`를 안 하면 GitHub/Vercel에 반영 안 됨** — 항상
  마지막에 push까지 할 것.
- **DB**: Supabase 프로젝트(ANPC_Meets, 리전 ap-northeast-1). 로컬 `.env.local`과
  Vercel 환경변수 모두 같은 프로젝트를 가리킴.
- **관리자 계정**: `jhj@alphabrothers.co.kr` (Supabase Auth에 수동 생성된 유일한 관리자).
  회원가입 기능 없음 — 이 계정만 로그인 가능.
- **실사용 데이터**: 실제 예약 링크 3개(`[리빔] 사전미팅`, `[고객사] 1주차 미팅`,
  `[더블유에프엠] 사전미팅`), 사용자가 직접 등록한 실제 가능시간 존재, 디스코드 웹훅
  알림 활성화되어 실제로 동작 중. **테스트용으로 만들었던 임시 데이터는 전부 정리 완료.**
- **미완성**: 이메일(Resend) 알림만 미설정 상태(아래 3번 참고).

## 1. 시도한 것 (이번 세션 작업 전체, 시간순 요약)

### 1-1. 관리자 대시보드 신규 구축
기존엔 DB 스키마와 고객용 예약 페이지(`/book/[slug]`)만 있고 관리자 대시보드가 전혀
없었음. 아래를 전부 새로 만듦:
- 인증: `proxy.ts`(미들웨어, 세션 쿠키 갱신 + `/admin/*` 보호), `lib/supabase/dal.ts`의
  `requireAdmin()`, `app/admin/login/`.
- 관리자 레이아웃/대시보드: `app/admin/(dashboard)/layout.tsx`, 예약 링크 카드 목록.
- 일정관리, 메시지 템플릿 CRUD, 예약 링크 생성/수정, 예약 상세/안내 메시지 복사,
  디스코드/이메일 알림 설정.

### 1-2. 사용자 요청 보완사항 (로고 적용, 미팅방법 필드 제거, 예약시간 옵션박스화,
일정관리 전면 재설계, 기본 템플릿 제거 등) — 상세는 git 커밋 로그(`git log --oneline`)
참고. 이 중 가장 큰 변경은 **일정관리 재설계**: "요일별 무한반복 가능시간 + 예외 차단"
방식을 "기본 전부 닫힘 + 관리자가 명시적으로 연 시간만 예약 가능" 방식으로 전환
(`weekly_schedule` 테이블 삭제, `available_rules` 테이블 신설). 관련 마이그레이션
3개(`supabase/migrations/001~003_*.sql`)는 **전부 사용자가 Supabase Studio SQL
Editor에서 직접 실행 완료**함(서비스 롤 키로는 DDL 실행 불가 — PostgREST 한계).

### 1-3. UI/UX 개선 (사용자가 세션 중 실시간 피드백을 주는 대로 반영)
- 일정관리 캘린더를 `<input type="date">` 팝업 방식 → 항상 펼쳐진 인라인 범위 캘린더로
  교체 (`components/ui/RangeCalendar.tsx` + `lib/useDateRangeCalendar.ts`).
- "가능시간"/"불가능시간"을 탭으로 통합해 캘린더 하나 공유
  (`components/admin/ScheduleCalendarPanel.tsx`).
- 불가능시간도 날짜 범위 + 요일 복수선택 가능하게, "하루 종일" 옵션은 제거.
- 날짜를 하루만 선택해도 등록 가능(시작일=종료일로 자동 처리), 예약 링크 생성/수정
  폼도 같은 캘린더로 통일.
- 예약 링크 목록: 개별 즉시삭제 → 체크박스 다중선택 + 일괄삭제로 변경
  (`components/admin/BookingLinksList.tsx`). 상세 페이지엔 단일 삭제 버튼 유지.
- 예약 링크 목록에 "예약 전"/"예약 완료" 상태 배지 추가(초록/회색).
- 헤더 로고+타이틀 클릭 시 `/admin`(예약 링크 목록)으로 이동.
- 고객용 예약 페이지(`/book/[slug]`) 상단에도 로고 옆 "ANPC 예약 관리" 텍스트 추가.
- **알림설정 + 계정(비밀번호 변경)을 "마이페이지"(`/admin/mypage`) 하나로 통합**
  (기존 `/admin/notifications`, `/admin/account`는 삭제됨).
- **예약 가능 슬롯 간격을 미팅 진행시간(duration) 기준에서 항상 1시간 고정 간격으로
  변경** (`lib/slots.ts`의 `SLOT_INTERVAL_MINUTES = 60`). 예: 12~18시 가능시간 +
  2시간 미팅 → 기존엔 12/14/16만 선택 가능했는데, 이제 12/13/14/15/16까지 선택
  가능(17시는 종료가 19시라 범위 밖이라 제외). 이 변경은 **모든 링크에 동일 적용**
  하기로 사용자와 확정함(45분짜리 미팅 링크도 이제 45분 간격이 아니라 1시간 간격).

### 1-4. 배포 인프라 구축
- 로컬 git 저장소 초기화 + 첫 커밋(원래 git 저장소가 아니었음).
- GitHub 저장소(`jhj144/anpc-booking`, public) 생성 후 push.
- `README.md`에 "Deploy to Vercel" 1-Click 배포 버튼 작성(PRD의 "팀원이 각자 배포"
  요구사항). Supabase 프로젝트 생성 → schema.sql/migrations 실행 → 관리자 계정 생성
  → 배포 → `NEXT_PUBLIC_APP_URL` 재설정까지 전체 셋업 가이드 문서화.
- 사용자가 실제로 배포 버튼을 눌러 Vercel 배포 완료.

### 1-5. 배포 후 로그인 불가 사태 디버깅 (아래 2, 3번 참고)

## 2. 성공한 것 / 검증 완료된 것

- `npm run build`, `npm run lint` 항상 통과 상태 유지.
- claude-in-chrome으로 실제 브라우저 + 사용자의 실제 Supabase 프로젝트를 대상으로
  전체 플로우 반복 검증: 로그인, 가능시간/불가능시간 CRUD, 템플릿 CRUD, 예약 링크
  생성/수정/삭제(단일+일괄), 고객 예약, 예약 취소 후 슬롯 재오픈, 로고 노출.
- **클립보드 복사 버튼 실제 값 검증 완료** — "안내 메시지 복사"(템플릿 `{날짜}{시간}`
  치환 정상), "링크 복사"(`shareUrl` 정상). 검증 기법: `navigator.clipboard.writeText`를
  `javascript_tool`로 몽키패치해서 실제 인자를 캡처(권한 프롬프트 우회).
- **디스코드 웹훅 알림 실제 발송 검증 완료** — 사용자가 실제 웹훅 URL 발급, 설정 저장 →
  테스트 예약 생성 → 디스코드 채널에서 알림 수신 확인함. 현재 실제 설정으로 활성화되어
  있어 앞으로 예약이 생길 때마다 알림이 감.
- **GitHub/Vercel 배포 파이프라인 검증 완료** — 배포 버튼이 정확한 저장소로 연결됨을
  확인, 실제 배포 성공, git push 시 Vercel 자동 재배포 확인.
- **배포 사이트 로그인 성공 확인** (아래 3번 문제 해결 후, 사용자가 직접 확인).
- **예약 슬롯 1시간 간격 변경 로컬에서 검증 완료** (12~18시+2시간 미팅 → 10~16시
  링크로 실측, 정확히 1시간 간격씩 생성됨을 스크린샷으로 확인). 배포本은 push 직후라
  사용자가 아직 재확인 전.

## 3. 실패했거나 시행착오를 거친 것 (중요 — 반드시 읽을 것)

### 3-1. [가장 중요] 배포 사이트 로그인 완전 불가 사태 — 근본 원인: Vercel 환경변수 오류
사용자가 배포 완료 후 로그인이 안 된다고 보고. 디버깅 과정:
1. 처음엔 "이메일 또는 비밀번호가 올바르지 않습니다"만 뜸 → 사용자가 비밀번호를
   잊었다고 판단, Supabase Studio에서 비밀번호 재설정(recovery) 이메일 발송.
2. **재설정 링크를 클릭하면 새 비밀번호 설정 화면 없이 그냥 로그인되어버리는 문제
   발견** — 이 앱에 recovery 콜백 페이지가 없었기 때문. 급하게 비밀번호 변경 기능을
   추가함(`/admin/mypage`의 `ChangePasswordForm` + `changePassword` 서버 액션,
   `supabase.auth.updateUser({ password })` 사용).
3. 비밀번호를 바꾸려 하니 "New password should be different from the old
   password" 에러 → **원래 비밀번호가 맞았다는 뜻**이었음. 원래 비밀번호로 로그인
   재시도 → 여전히 실패, 에러 메시지에 `(401 Invalid API Key)`가 찍힘(로그인 액션에
   `error.status`/`error.message`를 임시로 노출시켜서 확인 — 원인 파악 후 즉시 되돌림).
4. **근본 원인**: Vercel 환경변수 `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`에 **구버전 JWT 형식 키(`eyJhbGci...`로 시작)**가
   들어가 있었음. 이 Supabase 프로젝트는 신버전 키(`sb_publishable_...`,
   `sb_secret_...`)를 쓰는데 구버전 키가 무효화되어 있어 모든 Supabase API 호출이
   401로 실패하고 있었음. `.env.local`은 처음부터 신버전 키라 **로컬은 한 번도 이
   문제를 겪지 않았음** — 아마 최초 배포 버튼으로 배포할 때 Supabase 대시보드의
   "Legacy anon, service_role API keys" 탭 값을 잘못 복사해 넣은 것으로 추정.
   - **중요**: `SUPABASE_SERVICE_ROLE_KEY`는 로그인뿐 아니라
     `lib/supabase/admin.ts`의 `createAdminClient()`를 통해 **고객용 공개 예약
     플로우 전체**(`/book/[slug]` 링크 조회, 가용성 계산, 예약 생성)에도 쓰인다. 즉
     이 버그가 있던 동안 배포 사이트에서는 로그인뿐 아니라 고객의 실제 예약 생성도
     실패했을 가능성이 높음(사용자가 별도 확인했다고 함, 여기서 재확인은 생략함).
5. **수정 방법**: Vercel 프로젝트 → Environment Variables에서 3개 값을
   `.env.local`의 올바른 값으로 덮어쓰고 재배포. 일부러 틀린 비밀번호로 로그인해서
   에러가 `401 Invalid API Key` → `400 Invalid login credentials`로 바뀐 것으로
   API 연결 정상화를 검증(민감정보 자체는 화면에 노출 안 시킴). **사용자가 실제
   비밀번호로 로그인 성공까지 최종 확인함.**
6. **앞으로 Vercel 환경변수를 다시 만지게 되면**: 반드시 Supabase 대시보드의
   **"Publishable and secret API keys" 탭**(Settings → API Keys, "Legacy" 탭
   아님)에서 값을 복사할 것. Vercel의 "Sensitive" 값은 저장 후 다시 읽을 수 없고,
   편집 화면에 보이는 값은 실제 저장된 값의 일부를 반영한 것일 수도, 완전히 무관한
   placeholder일 수도 있어 신뢰할 수 없음(관찰: ANON_KEY/SERVICE_ROLE_KEY는 실제
   값의 prefix를 보여줬지만, URL 필드는 `https://aBcDe.supabase.co` 같은 완전
   무관한 예시였음) — **애매하면 그냥 새 값으로 덮어쓰는 게 안전.**
7. 편집 중 Vercel의 "Environments" 드롭다운(Production/Preview/Development)을
   실수로 "Preview"만 남긴 채 저장할 뻔한 적이 있음 — 값을 다 입력한 후 저장 직전에
   **Environments가 여전히 "Production and Preview"인지 반드시 재확인**할 것.

### 3-2. 이메일(Resend) 알림 미완성
`.env.local`/Vercel 모두 `RESEND_API_KEY`, `RESEND_FROM_EMAIL`이 비어있어서
`lib/notifications.ts`의 `sendEmailNotification`이 조건문에서 걸러져 호출조차 안 됨.
**사용자가 Resend API 키 발급이 어렵다고 해서 이번 세션에서는 보류함.** 나중에 계정을
만들면 두 값을 채우고 발송 테스트하면 됨.

### 3-3. 자동 테스트 전무
프로젝트에 unit/e2e 테스트가 전혀 없음. `lib/slots.ts`의 가용성 계산 로직(방금 슬롯
간격 로직도 변경함)은 브라우저 수동 확인만 거쳤음 — 이 파일을 다시 건드릴 일이 있으면
반드시 수동으로 캘린더를 재확인할 것.

### 3-4. 개발 중 겪은 반복적인 기술적 함정 (다음에 또 만날 수 있음)
- **React key 없이 조건부 입력 스위칭하면 DOM 재사용 버그 발생**: 예를 들어 select로
  프리셋↔직접입력을 전환할 때 `<input type="hidden">`과 `<input type="number">`를
  React가 같은 자리의 같은 태그로 보고 DOM을 재사용해 이전 값이 새 입력창에 남는
  문제가 있었음. `key="preset"`/`key="custom"`처럼 명시적 key를 붙여서 해결. 조건부
  입력 스위칭 패턴을 새로 만들 때는 처음부터 key를 붙일 것.
- **`<form action={serverAction}>`은 제출 완료 후 폼을 네이티브로 자동 리셋**하는데,
  이게 컨트롤드 state(체크박스 등)와 충돌해서 화면엔 리셋된 것처럼 보여도 내부 state는
  안 바뀌어 다음 제출에 옛날 값이 나가는 버그가 있었음. 컨트롤드 input을 섞은 폼은
  `<form onSubmit={...}>` + `e.preventDefault()` + 수동 `FormData` 구성 +
  `startTransition`으로 서버 액션을 직접 호출하는 방식을 쓸 것.
- **`useActionState`가 반환하는 dispatch 함수를 `<form action={...}>`이 아니라
  수동으로(`onSubmit` 안에서) 호출할 때는 반드시 `startTransition`으로 감쌀 것.**
  안 그러면 "An async function with useActionState was called outside of a
  transition" 경고가 뜨고 `isPending`이 갱신 안 됨.
- **`window.confirm()`을 쓰는 버튼은 claude-in-chrome 자동화로 클릭하면 CDP가
  타임아웃되며 멈춘다**(네이티브 모달이라 CDP Input 이벤트가 안 닿음). 이런 버튼
  검증 시엔 클릭 전에 사용자에게 미리 알리고, 최종 확인 클릭은 사용자가 직접 하도록
  요청할 것.
- **`navigator.clipboard.writeText` 검증**: 클릭 전에 `javascript_tool`로
  `navigator.clipboard.writeText`를 몽키패치해서 인자를 캡처하면 권한 프롬프트 없이
  값을 확인할 수 있음(`readText` 방식은 권한 프롬프트로 CDP가 막힘).
- **개발 서버 중복 실행 주의**: 세션 중 실제로 두 개의 `npm run dev` 프로세스가
  동시에 떠서 Turbopack이 낡은 코드로 응답하는 바람에 한참 헤맨 적이 있음. 새 세션
  시작 시 `npm run dev` 실행 전에
  `Get-NetTCPConnection -LocalPort 3000 -State Listen`으로 기존 프로세스가 떠 있는지
  확인할 것. 이상 동작(고친 코드가 반영 안 되는 것처럼 보임)이 보이면 제일 먼저 의심.
- **이 프로젝트 폴더가 OneDrive 동기화 폴더 안에 있음.** `Remove-Item -Recurse
  -Force`로 지운 폴더(`app/admin/(dashboard)/account`, `.../notifications`)가
  git에서는 이미 삭제됐는데도 **파일시스템에 저절로 다시 나타나는 현상**을 겪음
  (OneDrive가 삭제 직후 상태를 클라우드 버전으로 되돌린 것으로 추정). 파일/폴더 삭제
  직후엔 몇 초 기다렸다가 `Get-ChildItem`으로 실제로 없어졌는지 재확인할 것.
  `npm run build`가 `.next/dev/types/routes.d.ts` 관련 이상한 TS 문법 에러를
  내면(존재하지 않는 라우트를 참조하는 등) 십중팔구 이런 캐시/동기화 불일치이니
  `.next` 폴더를 지우고 다시 빌드해볼 것.
- 디스코드 웹훅 URL은 `notification_settings` 테이블(DB)에 저장되어 있음 — 코드나
  `.env.local`에는 없음. 민감정보라 이 문서에도 URL 자체는 기록하지 않음(필요하면
  Supabase Studio에서 직접 조회).

## 4. 다음 단계 제안

1. (선택) 이메일 알림을 쓸 계획이면 Resend 계정 생성 후 `.env.local`과 Vercel
   환경변수에 `RESEND_API_KEY`/`RESEND_FROM_EMAIL` 등록, 발송 테스트.
2. **방금 배포한 "슬롯 1시간 고정 간격" 변경을 사용자가 아직 배포 사이트에서
   최종 확인 전** — 확인 결과를 기다릴 것. 문제가 있다면 `lib/slots.ts`의
   `SLOT_INTERVAL_MINUTES` 상수를 조정.
3. 자동 테스트(특히 `lib/slots.ts` 가용성 계산)를 추가하면 앞으로 이런 로직을
   건드릴 때 수동 브라우저 확인 의존도를 줄일 수 있음 — 아직 손대지 않음.
4. push 전에는 항상 `git ls-files | Select-String -Pattern "env" -CaseSensitive:$false`
   같은 명령으로 시크릿 파일이 트래킹 안 됐는지 재확인할 것(`.env.example`만 있어야
   정상). **사용자가 이 점을 여러 번 특별히 강조함.**
5. 3-4번의 기술적 함정들(특히 OneDrive 동기화, dev 서버 중복 실행, Vercel legacy
   API 키)은 이 프로젝트에서 반복적으로 발생할 여지가 있으니 새 세션 시작 시 한 번씩
   염두에 둘 것.
