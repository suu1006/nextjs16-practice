// app/api/chat/route.ts

import { NextRequest } from "next/server";

// 모델 타입 정의
type ModelType = "claude" | "gpt" | "gemini";

// 모델 타입을 Ollama 모델명으로 매핑
const MODEL_MAP: Record<ModelType, string> = {
  claude: "llama3.1", // Claude 대신 llama3.1 사용
  gpt: "mistral", // GPT 대신 mistral 사용
  gemini: "llama3", // Gemini 대신 gemma2 사용
};

export async function POST(req: NextRequest) {
  const { message, model } = await req.json();

  // 모델이 지정되지 않았거나 잘못된 경우 기본값 사용
  const modelType = (model as ModelType) || "claude";
  const ollamaModel = MODEL_MAP[modelType] || MODEL_MAP.claude;

  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ollamaModel,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "당신은 친절한 AI 어시스턴트입니다. 모든 답변을 한국어로 작성해주세요. 모든 답변이 사실인지 체크 후 답변해주세요",
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  if (!response.body) {
    return new Response("no stream", { status: 500 });
  }

  // ollama → next.js → client 로 스트림 전달
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // ollama는 NDJSON → newline 단위로 자름
        const lines = buffer.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // 각 줄은 json 형태
          try {
            const json = JSON.parse(line);
            const token = json.message?.content ?? "";

            if (token) {
              controller.enqueue(encoder.encode(token));
            }
          } catch (e) {
            console.error("parse error:", e);
          }
        }

        buffer = lines[lines.length - 1];
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
