import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseOpenAIError, shuffle } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function getApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || typeof key !== 'string' || key.trim() === '') return null;
  return key.trim();
}

export async function POST(request: NextRequest) {
  try {
    let body: {
      templateSentence?: string;
      activities?: unknown;
      areaId?: string;
      level?: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        { error: '요청 본문이 올바른 JSON이 아닙니다.' },
        { status: 400 }
      );
    }
    const templateSentence =
      typeof body.templateSentence === 'string' ? body.templateSentence : '';
    const activities = Array.isArray(body.activities)
      ? body.activities.filter((a: unknown): a is string => typeof a === 'string')
      : [];
    const areaId = typeof body.areaId === 'string' && body.areaId.trim() ? body.areaId.trim() : null;
    const level = typeof body.level === 'string' && body.level.trim() ? body.level.trim() : null;

    if (!activities.length) {
      return NextResponse.json({ sentence: templateSentence });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    let examples: { sentence: string }[] = [];
    if (areaId && level) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('templates')
          .select('sentence')
          .eq('area_id', areaId)
          .eq('level', level)
          .limit(10);
        if (!error && data?.length) {
          examples = shuffle([...data]).slice(0, 3);
        }
      } catch {
        // Supabase 실패 시 예시 없이 폴백
      }
    }

    const activitiesText = activities.join('\n');
    const examplesText = examples.length
      ? `다음은 잘 작성된 평어 예시이다:\n${examples.map((e: { sentence: string }) => `- ${e.sentence}`).join('\n')}\n\n위 예시들의 문체와 말투를 그대로 따라서,`
      : '아래 평어 초안과 같은 문체로';

    const prompt = `${examplesText} 아래 평어 초안에 활동 내용을 녹여 한 문장으로 다시 써줘.

평어 초안: "${templateSentence}"

이번 학기 실제로 한 학습 활동:
${activitiesText}

반드시 지킬 규칙:
- 학생을 주어로 쓰지 말 것
- 존댓말 사용 금지
- 70자 이내
- 종결어미는 반드시 ~함, ~익힘, ~표현함, ~이해함, ~발표함, ~읽음, ~씀, ~탐구함, ~기름, ~뛰어남 중 하나로 끝낼 것
- ~생겼다, ~되고 있음, ~나타남, ~보임, ~있음 으로 끝내지 말 것
- 활동명을 문장 중간에 자연스럽게 녹일 것`;

    const res = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data?.error as { message?: string })?.message ??
        (typeof data?.error === 'string' ? data.error : null) ??
        res.statusText;
      const message = parseOpenAIError(String(errMsg));
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const sentence =
      data?.choices?.[0]?.message?.content?.trim() ?? templateSentence;

    return NextResponse.json({ sentence });
  } catch (err) {
    const raw = err instanceof Error ? err.message : '평어 생성 실패';
    const message = parseOpenAIError(raw);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
