"use client";

import { useState, useRef, useCallback, useMemo, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import { markdownComponents } from "@/components/ui/markdown-components";
import { ModelTab } from "@/features/chat/components/model-tabs";

type ModelType = "claude" | "gpt" | "gemini";

type ModelResponse = {
  content: string;
  isLoading: boolean;
  isCompleted: boolean;
  feedback: "like" | "dislike" | null;
};

// 답변 영역 컴포넌트 (메모이제이션)
const ResponseArea = memo(
  ({ response }: { response: ModelResponse }) => {
    if (response.isLoading && !response.content) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <div className="text-gray-400">응답을 생성하고 있습니다...</div>
        </div>
      );
    }

    if (response.content) {
      return (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}>
            {response.content}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">
          아래에서 질문을 입력하면 세 모델이 모두 응답합니다.
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 깊은 비교를 통한 최적화
    return (
      prevProps.response.content === nextProps.response.content &&
      prevProps.response.isLoading === nextProps.response.isLoading
    );
  }
);

ResponseArea.displayName = "ResponseArea";

export default function ChatPage() {
  // 현재 프롬프트 (사용자가 입력한 질문)
  const [currentPrompt, setCurrentPrompt] =
    useState("안녕하세요! 무엇을 도와드릴까요?");

  // 후속 질문 입력
  const [followUpInput, setFollowUpInput] = useState("");

  // 복사 상태
  const [copied, setCopied] = useState(false);

  // 현재 선택된 탭 (어떤 모델의 응답을 볼 것인지)
  const [selectedModel, setSelectedModel] = useState<ModelType>("claude");

  // 각 모델별 응답 데이터
  const [modelResponses, setModelResponses] = useState<
    Record<ModelType, ModelResponse>
  >({
    claude: {
      content: "",
      isLoading: false,
      isCompleted: false,
      feedback: null,
    },
    gpt: { content: "", isLoading: false, isCompleted: false, feedback: null },
    gemini: {
      content: "",
      isLoading: false,
      isCompleted: false,
      feedback: null,
    },
  });

  // 각 모델별 요청 취소를 위한 AbortController
  const abortControllersRef = useRef<Record<ModelType, AbortController | null>>(
    {
      claude: null,
      gpt: null,
      gemini: null,
    }
  );

  // 특정 모델에 대한 스트리밍 응답 처리
  const streamResponse = useCallback(
    async (model: ModelType, prompt: string) => {
      // 이전 요청이 있다면 취소
      if (abortControllersRef.current[model]) {
        abortControllersRef.current[model]?.abort();
      }

      const abortController = new AbortController();
      abortControllersRef.current[model] = abortController;

      // 로딩 상태로 변경
      setModelResponses((prev) => ({
        ...prev,
        [model]: {
          content: "",
          isLoading: true,
          isCompleted: false,
          feedback: null,
        },
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: prompt, model }),
          signal: abortController.signal,
        });

        if (!res.body) {
          throw new Error("응답이 없습니다");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);

          // 스트리밍으로 응답 업데이트
          setModelResponses((prev) => ({
            ...prev,
            [model]: {
              ...prev[model],
              content: prev[model].content + chunk,
            },
          }));
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log(`${model} request aborted`);
        } else {
          console.error(`${model} error:`, error);
          setModelResponses((prev) => ({
            ...prev,
            [model]: {
              ...prev[model],
              content: "오류가 발생했습니다. 다시 시도해주세요.",
            },
          }));
        }
      } finally {
        setModelResponses((prev) => ({
          ...prev,
          [model]: { ...prev[model], isLoading: false, isCompleted: true },
        }));
        abortControllersRef.current[model] = null;
      }
    },
    []
  );

  // 모든 모델에 질문 전송
  const sendToAllModels = useCallback(
    (question: string) => {
      setCurrentPrompt(question);

      // 세 개의 모델 모두에게 동시에 요청
      const models: ModelType[] = ["claude", "gpt", "gemini"];
      models.forEach((model) => {
        streamResponse(model, question);
      });
    },
    [streamResponse]
  );

  // modelResponse가 변경될 때만 다시 계산
  const isAnyLoading = useMemo(
    () => Object.values(modelResponses).some((response) => response.isLoading),
    [modelResponses]
  );

  const currentResponse = useMemo(
    () => modelResponses[selectedModel],
    [modelResponses, selectedModel]
  );

  // 후속 질문 전송
  const sendFollowUpQuestion = useCallback(() => {
    const question = followUpInput.trim();
    if (!question) return;

    setFollowUpInput("");
    sendToAllModels(question);
  }, [followUpInput, sendToAllModels]);

  // Enter 키로 전송
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isAnyLoading) {
        e.preventDefault();
        sendFollowUpQuestion();
      }
    },
    [sendFollowUpQuestion, isAnyLoading]
  );

  // 피드백 핸들러 (중복 코드 제거)
  const handleFeedback = useCallback(
    (feedbackType: "like" | "dislike") => {
      setModelResponses((prev) => ({
        ...prev,
        [selectedModel]: {
          ...prev[selectedModel],
          feedback:
            prev[selectedModel].feedback === feedbackType ? null : feedbackType,
        },
      }));
    },
    [selectedModel]
  );

  // 복사 기능
  const handleCopy = useCallback(async () => {
    const content = modelResponses[selectedModel].content;
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  }, [selectedModel, modelResponses]);

  // 모델 선택 핸들러 메모이제이션
  const handleSelectClaude = useCallback(() => setSelectedModel("claude"), []);
  const handleSelectGpt = useCallback(() => setSelectedModel("gpt"), []);
  const handleSelectGemini = useCallback(() => setSelectedModel("gemini"), []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="w-full border-b border border-gray-200/50 dark:border-white/10 h-16 text-lg flex flex-row items-center justify-between px-6">
        <div className="font-bold flex flex-row items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-full"
          />
          AI Model Comparator
        </div>
        <div className="flex flex-row gap-12 mr-6 items-center">
          <div className="cursor-pointer hover:text-gray-400">History</div>
          <div className="cursor-pointer hover:text-gray-400">Settings</div>
          <div className="cursor-pointer hover:text-gray-400">Upgrade</div>
          <div>
            <Image
              src="/user.png"
              alt="User"
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="ml-6 mr-6 pb-6">
        {/* 프롬프트 표시 영역 */}
        <div className="text-lg mt-6 text-gray-500 border rounded-lg p-4 border-gray-200/50 dark:border-white/10">
          <span>Your Prompt:</span>
          <div className="text-white text-xl mt-2">{currentPrompt}</div>
        </div>

        {/* 모델 응답 표시 영역 */}
        <div className="h-[550px] rounded-lg flex flex-col mt-6 border border-gray-200/50 dark:border-white/10">
          {/* 모델 탭 - 재렌더링될때마다 새로운 함수가 생성되지않도록  */}
          <div className="flex flex-row items-center justify-between w-full border-b border-gray-200/50 dark:border-white/10">
            <ModelTab
              modelName="Claude 3.7 Sonnet"
              isSelected={selectedModel === "claude"}
              isLoading={modelResponses.claude.isLoading}
              isCompleted={modelResponses.claude.isCompleted}
              onClick={handleSelectClaude}
            />
            <ModelTab
              modelName="GPT 4.0"
              isSelected={selectedModel === "gpt"}
              isLoading={modelResponses.gpt.isLoading}
              isCompleted={modelResponses.gpt.isCompleted}
              onClick={handleSelectGpt}
            />
            <ModelTab
              modelName="Gemini Pro"
              isSelected={selectedModel === "gemini"}
              isLoading={modelResponses.gemini.isLoading}
              isCompleted={modelResponses.gemini.isCompleted}
              onClick={handleSelectGemini}
            />
          </div>

          {/* 답변 영역 */}
          <div className="flex-1 w-full p-4 text-white overflow-y-auto">
            <ResponseArea response={currentResponse} />
          </div>

          {/* 피드백 버튼 영역 */}
          <div className="h-[60px] w-full px-4 py-2 border-t border-gray-200/50 dark:border-white/10 flex items-center gap-3">
            {/* like 버튼 */}
            <Button
              size="sm"
              variant={
                currentResponse.feedback === "like" ? "default" : "outline"
              }
              className="flex items-center gap-1"
              onClick={() => handleFeedback("like")}>
              <ThumbsUp className="w-4 h-4" />
            </Button>

            {/* dislike 버튼 */}
            <Button
              size="sm"
              variant={
                currentResponse.feedback === "dislike" ? "default" : "outline"
              }
              className="flex items-center gap-1"
              onClick={() => handleFeedback("dislike")}>
              <ThumbsDown className="w-4 h-4" />
            </Button>

            {/* copy 버튼 */}
            <Button
              size="sm"
              variant={copied ? "default" : "outline"}
              className="flex items-center gap-1 transition-all"
              onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-xs">복사됨</span>
                </>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 후속 질문 입력 영역 */}
        <div className="flex items-center gap-2 w-[80%] mx-auto mt-6 border border-gray-300 dark:border-white/20 rounded-lg px-3 py-2 bg-background">
          <input
            placeholder="질문을 입력하면 세 개의 모델이 모두 응답합니다"
            className="flex-1 bg-transparent outline-none text-sm text-white"
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnyLoading}
          />

          <Button
            size="sm"
            className="h-8 px-3 flex items-center gap-1"
            onClick={sendFollowUpQuestion}
            disabled={!followUpInput.trim() || isAnyLoading}>
            {isAnyLoading ? (
              <>
                <span>⏹️</span>
              </>
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
