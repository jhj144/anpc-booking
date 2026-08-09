import { createBrowserClient } from "@supabase/ssr";

/** 브라우저에서 사용하는 클라이언트. 로그인 폼 등 최소한의 용도로만 사용한다. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
