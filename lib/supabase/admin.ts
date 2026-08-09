import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service Role 클라이언트. RLS를 우회하므로 서버 코드에서만 사용하고
 * 브라우저로 절대 전달하지 않는다. 로그인하지 않은 고객사의 공개 예약 플로우
 * (링크 조회, 가용성 계산, 예약 생성)를 이 클라이언트로만 처리한다.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
