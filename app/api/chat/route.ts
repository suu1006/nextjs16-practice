// app/api/chat/route.ts

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3.1",
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
