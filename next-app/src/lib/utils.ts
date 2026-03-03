/**
 * OpenAI API 에러 메시지를 사용자 친화적 문구로 변환
 */
export function parseOpenAIError(raw: string): string {
  if (raw.includes('API key') || raw.includes('Incorrect API key') || raw.includes('invalid_api_key')) {
    return 'OpenAI API 키가 잘못되었거나 만료되었습니다. .env.local의 OPENAI_API_KEY를 확인해 주세요.';
  }
  if (raw.includes('quota') || raw.includes('billing')) {
    return 'OpenAI 사용 한도가 초과되었습니다. OpenAI 대시보드에서 요금제·결제 정보를 확인해 주세요.';
  }
  if (raw.includes('rate limit') || raw.includes('rate_limit')) {
    return 'OpenAI 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (/Internal Server Error|500|timeout|ETIMEDOUT/i.test(raw)) {
    return 'OpenAI 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요. (status.openai.com 확인)';
  }
  if (/country|region|territory|not supported/i.test(raw)) {
    return 'OpenAI API가 이 지역에서 제한됩니다. (Worker placement 또는 Cloudflare Regional Services 설정을 확인해 주세요.)';
  }
  return raw;
}

/** Fisher–Yates shuffle (mutates array, returns same ref) */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
