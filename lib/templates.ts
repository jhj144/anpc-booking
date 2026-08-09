export interface TemplateVars {
  date: string;
  time: string;
}

/** 템플릿 본문의 {날짜} {시간} 플레이스홀더를 실제 값으로 치환한다. */
export function renderTemplate(body: string, vars: TemplateVars): string {
  return body.replaceAll("{날짜}", vars.date).replaceAll("{시간}", vars.time);
}
