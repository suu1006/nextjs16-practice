// app/api/chat/route.ts
import { NextRequest } from "next/server";

// 모델 타입 정의
type ModelType = "claude" | "gpt" | "gemini";

const MODEL_MAP: Record<ModelType, string> = {
  claude: "llama-3.1-8b-instant", // 빠르고 대화 잘함 (기본값)
  gpt: "openai/gpt-oss-20b",
  gemini: "llama-3.3-70b-versatile", // 긴 문장/코드에 강한 편
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { message, model } = await req.json();

    const modelType: ModelType = (model as ModelType) || "claude";
    const groqModel = MODEL_MAP[modelType] ?? MODEL_MAP.claude;

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: groqModel,
        stream: true, // groq에서는 sse 로 받되
        messages: [
          {
            role: "system",
            content:
              "당신은 친절한 ai 어시스턴트입니다. 모든 답변을 한국어로 작성하고, 가능한 한 사실을 기반으로 답변하세요.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!groqRes.ok || !groqRes.body) {
      const errorText = await groqRes.text().catch(() => "");
      console.error("groq error:", errorText);
      return new Response("llm api error", { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // sse → 순수 텍스트로 변환해서 클라이언트로 스트리밍
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = groqRes.body!.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            // 마지막 줄은 잘릴 수 있으니까 버퍼에 남겨두고, 그 전까지만 처리
            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (!line || !line.startsWith("data:")) continue;

              const data = line.slice("data:".length).trim();
              if (data === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const json = JSON.parse(data);
                const token: string = json.choices?.[0]?.delta?.content ?? "";

                if (token) {
                  controller.enqueue(encoder.encode(token));
                }
              } catch (e) {
                console.error("sse parse error:", e, data);
              }
            }

            buffer = lines[lines.length - 1]; // 마지막 줄은 다음 chunk와 합쳐서 다시 파싱
          }
        } catch (e) {
          console.error("stream error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        // 여기서는 sse가 아니라 "순수 텍스트 스트림"으로 보냄
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    console.error("chat route error:", e);
    return new Response("internal error", { status: 500 });
  }
}
