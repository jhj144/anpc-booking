# ANPC 예약 페이지

미팅 일정 조율을 자동화하는 셀프호스팅 예약 서비스입니다. Calendly 같은 유료 예약 서비스를
대체하기 위해 만들어졌으며, Vercel + Supabase 무료 티어만으로 1인당 비용 0원으로 운영할 수
있습니다.

각 팀원은 아래 버튼으로 자신의 GitHub/Vercel/Supabase 계정에 독립된 인스턴스를 배포해
사용합니다 (트래픽·데이터 완전 분리).

## 1-Click 배포

> 먼저 아래 "사전 준비"에서 Supabase 프로젝트를 만들고 값을 복사해두세요. 배포 버튼을
> 누르면 그 값을 입력하는 화면이 나옵니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3a%2f%2fgithub.com%2fjhj144%2fanpc-booking&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_APP_URL&envDescription=Supabase+%ed%94%84%eb%a1%9c%ec%a0%9d%ed%8a%b8+%ec%84%a4%ec%a0%95%ea%b0%92%ea%b3%bc+%eb%b0%b0%ed%8f%ac+URL%ec%9d%b4+%ed%95%84%ec%9a%94%ed%95%a9%eb%8b%88%eb%8b%a4&project-name=anpc-booking&repository-name=anpc-booking)

## 사전 준비: Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성 (무료 티어로 충분)
2. **Project Settings → API**에서 아래 값을 복사해둡니다.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (절대 외부에 노출하지 마세요)
3. **SQL Editor**에서 [`supabase/schema.sql`](./supabase/schema.sql) 전체 내용을 실행합니다.
4. 이어서 [`supabase/migrations`](./supabase/migrations) 폴더의 SQL 파일을 `001`, `002`,
   `003` 순서대로 실행합니다.
5. **Authentication → Users**에서 관리자 계정을 직접 하나 생성합니다(이메일/비밀번호). 이
   서비스는 회원가입 기능이 없고, 이렇게 만든 계정으로만 `/admin`에 로그인할 수 있습니다.

## 배포 후 할 일

1. 위 배포 버튼을 눌러 진행하면서 3단계에서 복사해둔 3개 환경변수를 입력합니다.
   (`NEXT_PUBLIC_APP_URL`은 일단 아무 값이나 넣어도 됩니다 — 다음 단계에서 다시 채웁니다.)
2. 배포가 끝나면 Vercel이 부여한 도메인(예: `https://anpc-booking.vercel.app`)을 확인합니다.
3. Vercel 프로젝트 **Settings → Environment Variables**에서 `NEXT_PUBLIC_APP_URL`을 그
   도메인으로 업데이트하고 재배포합니다(예약 링크 공유 시 절대경로 생성에 사용됨).
4. `/admin/login`에서 사전 준비 5단계에서 만든 관리자 계정으로 로그인합니다.
5. **`/admin/schedule`에서 실제 가능시간을 등록해야** 고객이 예약할 수 있습니다(기본값은
   전부 예약 불가 상태).

## 선택 기능

- **디스코드 알림**: `/admin/notifications`에서 디스코드 웹훅 URL을 등록하면 예약이 생길
  때마다 알림이 옵니다. (채널 설정 → 연동 → 웹후크에서 URL 발급)
- **이메일 알림**: [Resend](https://resend.com) 계정을 만들고 Vercel 환경변수에
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`을 추가한 뒤 재배포해야 활성화됩니다(기본은 비활성).

## 로컬 개발

```bash
npm install
cp .env.example .env.local  # 값 채우기
npm run dev
```

## 기술 스택

- **프론트엔드**: Next.js 16 (App Router), Tailwind CSS
- **백엔드/DB**: Supabase (Postgres + Auth)
- **알림 연동**: Discord Webhook, Resend (둘 다 선택 사항)
- **배포**: Vercel
