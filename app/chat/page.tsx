"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "안녕하세요 무엇을 도와드릴까요?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const userText = input.trim();
    if (!userText || isLoading) return;

    setIsLoading(true);

    // 1) 사용자 메시지와 assistant 메시지 자리를 한번에 추가
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText },
      { role: "assistant", content: "" },
    ]);
    setInput("");

    try {
      // 2) 스트리밍 요청
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userText }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        // 3) 토큰이 들어올 때마다 마지막 assistant 메시지에 이어 붙이기
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            role: "assistant",
            content: updated[lastIndex].content + chunk,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Error:", error);
      // 에러 발생 시 마지막 assistant 메시지에 에러 표시
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          role: "assistant",
          content: "오류가 발생했습니다. 다시 시도해주세요.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
      <div className="w-full max-w-xl border rounded-xl bg-card p-4 flex flex-col gap-4 shadow">
        <h1 className="font-bold text-lg">ollama chatbot</h1>

        <div className="border rounded-lg p-3 flex flex-col gap-2 h-80 overflow-y-auto bg-muted">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end bg-primary text-primary-foreground px-3 py-2 rounded-lg max-w-[80%]"
                  : "self-start px-3 py-2 rounded-lg max-w-[80%] prose prose-sm"
              }>
              {m.role === "user" ? (
                m.content
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-3 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-3 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li className="ml-2">{children}</li>,
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold mb-3 mt-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold mb-3 mt-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-bold mb-2 mt-2">
                        {children}
                      </h3>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-300 px-1.5 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      ) : (
                        <code
                          className={`block bg-gray-300 p-3 rounded text-sm mb-3 overflow-x-auto ${className}`}>
                          {children}
                        </code>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-400 pl-4 mb-3 italic">
                        {children}
                      </blockquote>
                    ),
                  }}>
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2 bg-background text-foreground"
            placeholder="메세지를 입력해줘"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
          />
          <button
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            onClick={sendMessage}
            disabled={isLoading}>
            {isLoading ? "전송 중..." : "보내기"}
          </button>
        </div>
      </div>
    </div>
  );
}
