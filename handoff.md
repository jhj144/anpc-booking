# Handoff — ANPC 예약 페이지

이 문서만 읽고 이어서 작업할 수 있도록 지금까지의 작업, 성공/실패, 다음 단계를 정리했다.
프로젝트 배경/기능 요구사항은 `prd.md` 참고. Next.js 16 관련 주의사항은 `AGENTS.md` 참고
(미들웨어가 `proxy.ts`로 개명되는 등 실제 breaking change가 있으니 새 API를 쓸 때는
`node_modules/next/dist/docs`를 먼저 확인할 것).

## 세션 시작 시점 상태

- DB 스키마(`supabase/schema.sql`)와 고객용 예약 페이지(`/book/[slug]`)는 이미 구현되어 있었음.
- 관리자 대시보드는 전혀 없었음 (`app/page.tsx`가 "준비 중"이라고만 표시).

## 1단계에서 한 일 — 관리자 대시보드 전체 구축 (성공)

아래를 전부 새로 만들었고, 실제 사용자의 Supabase 프로젝트(운영 중인 진짜 DB)에서
브라우저로 전체 플로우를 검증 완료함(로그인 → 일정 설정 → 예약 링크 생성 → 고객 예약 →
관리자 확인 → 취소 → 슬롯 재오픈).

- **인증**: `proxy.ts`(Next 16에서 middleware의 새 이름, 세션 쿠키 갱신 + `/admin/*` 보호),
  `lib/supabase/dal.ts`의 `requireAdmin()`(DAL 패턴, React `cache`로 메모），
  `app/admin/login/`(로그인 폼+서버 액션), `app/admin/actions.ts`(로그아웃).
  관리자 계정은 자체 가입 기능 없이 Supabase Studio에서 수동 생성하는 구조(PRD 의도대로).
- **관리자 레이아웃/대시보드**: `app/admin/(dashboard)/layout.tsx`(라우트 그룹, 로그인 페이지는
  이 그룹 밖에 있어 인증 체크에서 제외됨), 예약 링크 카드 목록(`page.tsx` + `BookingLinkCard`).
- **일정관리**: 처음엔 "요일별 고정시간표 + 수동 차단" 구조였으나 2단계에서 전면 재설계됨(아래 참고).
- **메시지 템플릿**: CRUD, 처음엔 시스템 기본 템플릿 2개 + 관리자 커스텀이었으나 2단계에서
  기본 템플릿 개념 자체를 제거함(아래 참고).
- **예약 링크 생성/수정**: `LinkForm`, `links/actions.ts`. 처음엔 미팅방법 필드가 있었으나
  2단계에서 제거됨.
- **예약 상세/안내 메시지 복사**: `links/[id]/page.tsx`, `BookingRow`(템플릿의 `{날짜}{시간}`
  치환 후 클립보드 복사), 예약 취소 기능.
- **알림**: `app/admin/(dashboard)/notifications/`(Discord 웹훅 URL + 알림 이메일 On/Off 설정),
  `lib/notifications.ts`가 `app/book/[slug]/actions.ts`의 `createBooking` 성공 후 호출됨.
  알림 발송 실패는 예약 성공 여부에 영향 없음(`Promise.allSettled` + 내부 try/catch).

## 2단계 — 사용자 요청 7가지 보완사항 (전부 완료, 실제 DB 검증 완료)

방식: 각 항목마다 `AskUserQuestion`으로 심층 인터뷰 후 구현. 아래 순서대로 처리함.

1. **로고 적용** — 원래 요청은 "로그인 페이지 좌측 하단 아이콘을 로고로"였는데, 그건 사실
   Next.js 개발 표시기(Dev Tools indicator)라 로고로 바꿀 수 없는 요소였음(개발 모드 전용,
   `next.config.mjs`의 `devIndicators`로 위치 변경/숨김만 가능). 인터뷰 결과 실제 의도는
   "고객용 페이지에 브랜드 로고를 노출하고 싶다"였음. `public/logo.png`(사용자가 직접
   `public/` 폴더에 넣어준 정사각형 네이비 배경 ANPC 워드마크)를 `components/ui/Logo.tsx`로
   만들어 로그인 페이지, 관리자 대시보드 헤더, 고객 예약 페이지 상단에 배치(원본 비율 유지,
   `rounded-lg`로 라운드 처리).
2. **미팅방법 필드 완전 제거** — `booking_links.meeting_method`/`meeting_method_detail`
   컬럼까지 DB에서 삭제(사용자가 명시적으로 요청, `supabase/migrations/001_drop_meeting_method.sql`
   작성 → **사용자가 Supabase Studio에서 직접 실행 완료**). `lib/meetingMethods.ts` 삭제,
   관련 코드(폼, 쿼리 select 목록, 알림 메시지, 템플릿의 `{미팅방법}` 플레이스홀더, 예약
   요약/확정 화면) 전체 정리. 관련 파일이 15개 가까이 됐음 — grep으로
   `meeting_method|meetingMethod|MEETING_METHODS` 검색해서 소스에 남은 게 없는지 확인함.
3. **예약 진행 시간 옵션박스화** — `LinkForm.tsx`에서 30분/1시간/2시간/직접입력 select로 변경.
   **버그를 하나 만들었다가 그 자리에서 고침**: "직접입력"으로 전환할 때 React가 이전
   `<input type="hidden">`과 새 `<input type="number">`를 같은 자리의 같은 태그로 보고
   DOM 노드를 재사용해버려서(리컨실리에이션), 새 입력창에 이전 프리셋 값(예: "30")이 그대로
   남아있던 문제. `key="custom"` / `key="preset"`을 각각 붙여서 해결. **이런 종류의 조건부
   입력 스위칭 패턴을 또 만들 때는 처음부터 key를 붙일 것.**
4. **템플릿 선택 필수 → 선택 사항** — 이미 그렇게 구현되어 있었음(코드 재확인만 하고 넘어감).
5+6. **일정관리 전면 재설계** (가장 큰 변경) — 기존 "요일별 무한 반복 가능시간 + 예외적으로
   차단" 방식(화이트리스트인데 사실상 항상 열려있는 모델)을, "기본은 전부 닫혀있고 관리자가
   명시적으로 연 시간만 예약 가능" 방식으로 전환. 인터뷰에서 PRD의 핵심 기능(공휴일/연차
   차단)을 잃지 않도록 확인하며 진행함:
   - `weekly_schedule` 테이블 삭제, `available_rules` 테이블 신설
     (`admin_id, day_of_week, start_time, end_time, range_start_date, range_end_date`).
     "가능시간 추가" 폼에서 기간+요일(복수선택)+시간대를 입력하면 요일 개수만큼 행이
     insert됨(예: 월~금 체크 시 5행).
   - `blocked_slots` 테이블/로직은 그대로 두고 UI 라벨만 "불가능시간 설정"으로 변경
     (이미 열어둔 시간 중 특정 날짜/시간을 다시 막는 용도로 재해석).
   - `lib/slots.ts`의 `getAvailableSlots`가 날짜별로 `available_rules`를 필터링하도록 재작성
     (기존엔 요일별로 그룹핑 후 전체 기간에 무조건 적용했음).
   - `supabase/migrations/002_available_rules.sql` 작성 — 기존 `weekly_schedule` 데이터를
     "오늘부터 180일" 유효기간의 규칙으로 자동 이전한 후 테이블 drop. **사용자가 실행 완료**.
   - 브라우저로 실제 검증: 새 규칙(토요일 09:00~12:00, 8/20~8/31) 추가 → 예약 링크 기간 확장
     → 고객 페이지에서 해당 토요일에 45분 간격 슬롯(09:00/09:45/10:30/11:15)이 정확히 계산됨.
7. **기본 제공 템플릿 제거** — `message_templates.admin_id`를 `not null`로 변경,
   `is_default` 컬럼 삭제, RLS 정책을 "본인 소유만" 단일 정책으로 교체.
   `supabase/migrations/003_remove_default_templates.sql`. **사용자가 실행 완료**.
   템플릿 페이지에서 "기본 제공 템플릿" 섹션 제거, 링크 생성/수정 폼의 템플릿 select 쿼리도
   `admin_id.is.null` OR 조건 제거하고 단순히 `eq("admin_id", user.id)`로 변경.

세 마이그레이션 모두 **사용자가 Supabase Studio SQL Editor에서 직접 실행 완료**했다고 확인함
(내가 가진 서비스 롤 키로는 DDL을 실행할 수 없어서 — REST/PostgREST는 스키마 변경을 지원 안 함).

## 성공적으로 검증된 것

- `npm run build`, `npm run lint` 모두 통과 (최종 상태 기준).
- claude-in-chrome으로 실제 브라우저 + 사용자의 실제 Supabase 프로젝트를 대상으로
  전체 플로우를 여러 번 재검증함 (로그인, 가능시간/불가능시간 CRUD, 템플릿 CRUD, 예약
  링크 생성/수정, 고객 예약, 예약 취소 후 슬롯 재오픈, 로고 노출).

## 시도했지만 검증하지 못한 것 / 실패한 것

- **이메일 알림(Resend)**은 아예 비활성 상태. `.env.local`에 `RESEND_API_KEY`,
  `RESEND_FROM_EMAIL`이 비어있어서 `lib/notifications.ts`의 `sendEmailNotification`이
  조건문(`if (params.emailEnabled && ... && process.env.RESEND_API_KEY)`)에서 걸러져
  아예 호출조차 안 됨. Resend 계정 발급 후 값 채워야 테스트 가능.
- 자동 테스트(unit/e2e)가 프로젝트에 전혀 없음. `lib/slots.ts`의 가용성 계산 로직은
  브라우저 수동 확인만 거쳤고 회귀 테스트가 없어서, 다음에 이 파일을 건드릴 때 다시
  수동으로 캘린더를 확인해봐야 함.
- 이 저장소는 **git 저장소가 아님** (`git status` → "not a git repository"). 지금까지의
  모든 변경이 커밋되지 않은 로컬 파일 상태로만 존재함. 배포 전에 `git init` + 커밋 필요.

## 3단계에서 한 일 (전부 완료, 실제 DB/브라우저 검증 완료)

1. **git 저장소 초기화 + 첫 커밋** — 이전에는 git 저장소가 아니었음. `.env.local`이
   `.gitignore`에 걸려 있어 시크릿은 커밋되지 않음을 `git ls-files`로 재확인 후 진행.
2. **일정관리 "가능시간 추가" 날짜 입력을 인라인 범위 캘린더로 교체** —
   `components/admin/AvailableRuleForm.tsx` 신설. 기존엔 `<input type="date">`를
   눌러야(그것도 달력 아이콘만) 팝업이 떴는데, 이제 폼 안에 항상 펼쳐진 캘린더가 있고
   두 번 클릭(시작일→종료일)으로 범위를 선택함. 요일 체크박스도 컨트롤드 상태로 전환.
   **버그를 하나 만들었다가 그 자리에서 고침**: Next.js는 `<form action={serverAction}>`
   제출이 끝나면 폼을 네이티브로 자동 리셋하는데, 이게 컨트롤드 체크박스(React state)와
   충돌해서 제출 후 체크박스가 시각적으로만 해제되고 내부 state는 그대로 남는 문제가
   있었음(다시 제출하면 실제로는 빈 값이 나갈 위험). `<form onSubmit={...}>` +
   `e.preventDefault()` + 수동으로 `FormData`를 구성해 `startTransition`으로 서버
   액션을 직접 호출하는 방식으로 바꿔서 해결. **앞으로 서버 액션을 쓰는 폼에 컨트롤드
   input을 섞을 때는 이 자동 리셋 문제를 염두에 둘 것.**
3. **예약 링크 삭제 기능 추가**:
   - `deleteBookingLink(id)`/`deleteBookingLinks(ids[])` 서버 액션
     (`links/actions.ts`). `bookings.booking_link_id`가 `on delete cascade`라서
     링크를 지우면 연결된 예약 내역도 함께 삭제됨 — 그래서 `window.confirm()`으로
     경고 문구를 띄운 후 진행하도록 함.
   - 상세 페이지(`links/[id]/page.tsx`)에는 `DeleteLinkButton`으로 단일 삭제.
   - 목록 페이지(`app/admin/(dashboard)/page.tsx`)는 사용자 요청으로 처음엔 카드마다
     즉시삭제 버튼이었다가, **체크박스로 여러 개 선택 후 한 번에 "선택 삭제"하는 방식으로
     변경**. `components/admin/BookingLinksList.tsx`가 선택 상태를 관리하고
     `BookingLinkCard`는 체크박스 UI만 담당(자체 삭제 버튼 없음).
   - `window.confirm()`은 브라우저 자동화(CDP)가 다루지 못하고 멈춰버려서, 최종
     클릭 확인은 사용자가 직접 브라우저에서 수행함(단일 삭제, 일괄 삭제 둘 다 확인 완료).

## 4단계 — 캘린더 UI 통합 + 클립보드 검증 완료 (전부 완료)

사용자가 세션 도중 실시간으로 UI 피드백을 여러 번 줬고, 그때그때 반영함:

1. **일정관리 캘린더가 너무 크고, 불가능시간은 캘린더가 아니라 native `<input type="date">`
   였음** → 하나로 통합. `components/ui/RangeCalendar.tsx`(순수 UI, 셀 크기 축소로 컴팩트하게)
   + `lib/useDateRangeCalendar.ts`(범위 선택 상태 훅)로 분리하고, 기존
   `AvailableRuleForm.tsx`는 삭제, `components/admin/ScheduleCalendarPanel.tsx`로 대체.
   "가능시간"/"불가능시간" 탭으로 전환하며 캘린더 하나를 공유함. 불가능시간도 이제
   날짜 범위 지정 가능(`addBlockedRange`가 `eachDateInRange`로 범위 내 날짜마다 행 생성,
   기존 단일일 전용 `addBlockedSlot`은 제거).
2. **하루만 등록하고 싶을 때 시작일/종료일을 두 번 눌러야 해서 번거롭다는 피드백** →
   시작일만 선택해도 등록 가능하도록 변경(종료일 미선택 시 시작일과 동일하게 취급).
   `ScheduleCalendarPanel`과 `LinkForm` 양쪽 다 적용.
3. **예약 링크 생성/수정 폼도 시작일/종료일을 캘린더로** → `LinkForm.tsx`도 동일한
   `RangeCalendar`/훅으로 교체. 이 과정에서 `useActionState`가 반환하는 dispatch 함수를
   `<form action={...}>`가 아니라 수동으로(`onSubmit` 안에서) 호출할 때는 반드시
   `startTransition`으로 감싸야 한다는 React 콘솔 경고를 실제로 만남
   ("An async function with useActionState was called outside of a transition") —
   안 그러면 `isPending`이 갱신되지 않음. `useTransition`으로 감싸서 수정함.
4. **예약 링크 목록의 개별 즉시삭제를 체크박스 다중선택 + 일괄삭제로 변경**
   (사용자 요청). `components/admin/BookingLinksList.tsx`가 선택 상태 관리,
   `deleteBookingLinks(ids[])` 서버 액션 추가. `BookingLinkCard`는 이제 체크박스 UI만
   담당(자체 삭제 버튼 없음). 상세 페이지의 단일 삭제(`DeleteLinkButton`)는 그대로 유지.
5. **클립보드 복사 버튼 실제 값 검증 완료** — 지난 세션엔 권한 프롬프트 때문에 확인 못
   했었는데, `navigator.clipboard.writeText`를 `javascript_tool`로 몽키패치해서(권한
   프롬프트 없이) 실제 복사되는 문자열을 캡처하는 방법으로 우회 검증함:
   - "안내 메시지 복사"(`BookingRow`): 템플릿의 `{날짜}{시간}` 치환 정상 확인.
     단, 검증 중 `[고객사] 1주차 미팅` 링크에 템플릿이 아예 연결 안 되어 있어서
     버튼이 비활성 상태였음을 발견 — `edit` 페이지에서 "1주차" 템플릿을 지정해서 고침
     (이건 버그가 아니라 그냥 그 링크에 템플릿 지정을 안 해뒀던 것).
   - "링크 복사"(`BookingLinkCard`): `shareUrl` 그대로 정상 복사됨.
6. **가능시간이 하나도 없어서 고객 예약 페이지가 완전히 막혀 있던 상태를 발견** —
   버그가 아니라 사용자가 아직 실제 가능시간을 설정 안 한 것이라고 확인함(2026-08-09
   기준). 배포/실사용 전에 반드시 `/admin/schedule`에서 실제 가능시간을 등록해야 함.

이번 단계에서 테스트용으로 만들었던 모든 임시 데이터(테스트 예약 링크 3개, 가능시간
규칙 6개, 불가능시간 1개, 테스트 예약 1건)는 전부 정리 완료. 실제 링크 2개
(`[고객사] 1주차 미팅`, `[더블유에프엠] 사전미팅`)는 그대로 있고, `[고객사] 1주차 미팅`은
이번에 템플릿을 연결해준 상태로 남아있음. 세션 도중 사용자가 별도로 실제 링크
(`[리빔] 사전미팅`)를 직접 만든 것으로 보이는데, 이건 내가 건드리지 않음.

## 5단계 — 예약 현황 배지 + 디스코드 웹훅 실발송 검증 (전부 완료)

1. **예약 링크 목록에 "예약 전"/"예약 완료" 배지 추가** (사용자 요청) — 체크박스 옆에
   표시. `app/admin/(dashboard)/page.tsx`에서 `bookings`를 `status=confirmed` 조건으로
   한 번 더 조회해 `booking_link_id` Set을 만들고, `BookingLinkCard`에 `hasBooking`으로
   내려서 초록/회색 배지로 렌더링. 실제 데이터(`[리빔] 사전미팅`이 이미 예약 있음)로
   검증 완료.
2. **디스코드 웹훅 알림 실제 발송 검증 완료** — 사용자가 실제 디스코드 웹훅 URL을
   발급받아 전달, `/admin/notifications`에서 켜고 저장 → 임시 가능시간 하루 열고
   고객 예약 페이지에서 실제 예약 생성 → **사용자가 디스코드 채널에서 알림 수신 확인**.
   테스트에 썼던 임시 가능시간과 예약은 정리했고, **디스코드 웹훅 설정(URL, 활성화)은
   실제 설정으로 그대로 저장되어 있음** — 이제부터 이 프로젝트에서 예약이 들어올 때마다
   실제로 디스코드 알림이 감. 이메일 알림은 여전히 미설정 상태(`RESEND_API_KEY` 없음).

## 6단계 — UI 소소한 개선 + GitHub 업로드/Vercel 배포 버튼 (전부 완료)

1. **불가능시간에도 요일 복수선택 추가, "하루 종일" 옵션 제거** (사용자 요청) —
   가능시간과 동일하게 요일 체크박스로 범위 내 특정 요일만 막을 수 있음.
   `addBlockedRange`가 `eachDateInRange` 결과를 `dayOfWeek`로 필터링하도록 수정.
   항상 시작/종료 시간을 받게 되어 "하루 종일" 토글 UI는 삭제(기존 DB의
   `is_full_day` 컬럼/표시 로직은 하위호환을 위해 그대로 둠 — 과거에 하루종일로
   등록된 행이 있다면 목록에서 여전히 "하루 종일"로 보임).
2. **헤더의 로고+"ANPC 예약 관리" 텍스트를 클릭하면 `/admin`(예약 링크 목록)으로
   이동하도록** `app/admin/(dashboard)/layout.tsx`에 `Link` 추가.
3. **GitHub 저장소 생성 + 푸시 완료**: https://github.com/jhj144/anpc-booking
   (public). 사용자가 이미 GitHub에 로그인되어 있던 브라우저 세션에서
   `github.com/new`로 직접 만들고, 로컬 git에 `git remote add origin` +
   `git push -u origin main`으로 업로드(커밋 히스토리 전부 포함, 총 10+ 커밋).
   푸시 전 `git ls-files`로 `.env.local` 등 시크릿 파일이 스테이징/트래킹되지
   않았음을 재확인함(`.env.example`만 포함, 실제 키 없음).
4. **README.md 작성 — "Deploy to Vercel" 1-Click 배포 버튼 포함** (PRD 2번 항목).
   버튼 URL은 `https://vercel.com/new/clone?repository-url=...&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_APP_URL&project-name=anpc-booking&repository-name=anpc-booking`
   형태로, 클릭하면 Vercel이 "Cloning from GitHub: jhj144/anpc-booking"으로
   자동 연결되는 것까지 브라우저로 확인함(실제 로그인/배포는 계정 소유자 몫이라
   거기서 멈춤). README에는 Supabase 프로젝트 생성 → schema.sql/migrations 실행
   순서 → 관리자 계정 수동 생성 → 배포 후 `NEXT_PUBLIC_APP_URL` 재설정까지
   전체 셋업 순서를 문서화함. Resend 환경변수는 배포 버튼의 필수 입력에서 제외하고
   "선택 기능"으로 별도 안내(필수로 걸어두면 계정 없는 사람이 배포 자체를 못 하게 됨).

## 다음 단계 제안

1. (우선순위 높음) **가능시간을 아직 하나도 설정 안 했으므로**, 배포/실사용 전에
   `/admin/schedule`에서 실제 요일별 가능시간을 등록할 것.
2. 이메일 알림을 쓸 계획이면 Resend 계정 생성 후 `.env.local`과 배포 환경변수에
   `RESEND_API_KEY`/`RESEND_FROM_EMAIL` 등록, 발송 테스트. (사용자가 API 키 발급이
   어렵다고 해서 이번엔 보류함 — 나중에 다시 시도 가능.)
3. 이 저장소는 이제 **로컬 git + GitHub(`jhj144/anpc-booking`, public) 둘 다에 존재**.
   앞으로 변경사항은 로컬에서 커밋 후 `git push`까지 해야 GitHub에도 반영됨(로컬
   커밋만으로는 GitHub에 안 올라감). **매번 push 전에 `git ls-files`로 시크릿
   파일이 없는지 재확인할 것** — 사용자가 이 점을 특별히 강조함.
4. 개발 서버가 백그라운드에서 계속 실행 중일 수 있음(포트 3000). 새 세션에서
   `npm run dev` 실행 전에 기존 프로세스가 떠 있는지 확인할 것
   (`Get-NetTCPConnection -LocalPort 3000 -State Listen`). **이번 세션에서 실제로
   두 개의 dev 서버 프로세스가 동시에 떠서 Turbopack이 낡은 코드로 응답하는 바람에
   한참 헤맨 적이 있음** — 이상 동작이 보이면 제일 먼저 의심할 것.
5. `window.confirm()`을 쓰는 삭제류 버튼은 claude-in-chrome 자동화로 클릭하면 CDP가
   타임아웃되며 멈춘다(네이티브 모달이라 CDP Input 이벤트가 못 닿음). 이런 버튼을
   검증해야 할 때는 클릭 전에 사용자에게 미리 알리고, 최종 확인 클릭은 사용자가 직접
   하도록 요청할 것.
6. `navigator.clipboard.writeText`를 실제로 호출하는 버튼을 검증할 땐, 클릭 전에
   `javascript_tool`로 `navigator.clipboard.writeText`를 몽키패치해서 인자를 캡처하면
   권한 프롬프트 없이 값을 확인할 수 있음(`readText` 방식은 권한 프롬프트로 막힘).
7. 디스코드 웹훅 URL은 `notification_settings` 테이블(DB)에 저장되어 있음 — 코드나
   `.env.local`에는 없음. URL 자체는 이 문서에도 기록하지 않았음(민감정보이므로
   필요하면 Supabase Studio에서 직접 조회할 것).
