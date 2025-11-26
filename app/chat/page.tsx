"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// 마크다운 컴포넌트 설정을 메모이제이션
const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="ml-2">{children}</li>,
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mb-3 mt-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold mb-3 mt-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-sm font-mono border border-indigo-300 shadow-sm">
        {children}
      </code>
    ) : (
      <code
        className={`block bg-slate-700 text-slate-100 p-4 rounded-lg text-sm mb-4 overflow-x-auto font-mono border border-slate-600 shadow-md leading-relaxed ${className}`}>
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-400 pl-4 mb-3 italic">
      {children}
    </blockquote>
  ),
};

// Message 컴포넌트 분리 및 메모이제이션
const ChatMessage = memo(({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={
        isUser
          ? "self-end bg-primary text-primary-foreground px-3 py-2 rounded-lg max-w-[80%]"
          : "self-start px-3 py-2 rounded-lg max-w-[80%] prose prose-sm"
      }>
      {isUser ? (
        message.content
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}>
          {message.content}
        </ReactMarkdown>
      )}
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

// ChatInput 컴포넌트 분리
const ChatInput = memo(
  ({
    input,
    isLoading,
    onInputChange,
    onSend,
    onStop,
  }: {
    input: string;
    isLoading: boolean;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onStop: () => void;
  }) => {
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isLoading) {
          e.preventDefault();
          onSend();
        }
      },
      [isLoading, onSend]
    );

    return (
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 bg-background text-foreground"
          placeholder="메세지를 입력해줘"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        {isLoading ? (
          <button
            className="px-4 py-2 rounded-lg bg-white text-destructive-foreground hover:bg-white/90"
            onClick={onStop}>
            <div className="size-3 bg-black" />
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            onClick={onSend}
            disabled={!input.trim()}>
            보내기
          </button>
        )}
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";

// 초기 메시지
const INITIAL_MESSAGE: Message = {
  id: "initial",
  role: "assistant",
  content: "안녕하세요 무엇을 도와드릴까요?",
};

// ID 생성 함수
let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${messageIdCounter++}`;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const userText = input.trim();
    if (!userText || isLoading) return;

    setIsLoading(true);

    const userMessageId = generateMessageId();
    const assistantMessageId = generateMessageId();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: userText },
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);
    setInput("");

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userText }),
        signal: abortControllerRef.current.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: updated[lastIndex].content + chunk,
          };
          return updated;
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted by user");
      } else {
        console.error("Error:", error);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: "오류가 발생했습니다. 다시 시도해주세요.",
          };
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  return (
    <div className="h-screen bg-background text-foreground p-4 flex items-center justify-center">
      <div className="w-full max-w-xl border rounded-xl bg-card p-4 flex flex-col gap-4 shadow">
        <h1 className="font-bold text-lg">ollama chatbot</h1>

        <div className="border rounded-lg p-3 flex flex-col gap-2 h-[600px] overflow-y-auto bg-muted">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSend={sendMessage}
          onStop={stopGeneration}
        />
      </div>
    </div>
  );
}
