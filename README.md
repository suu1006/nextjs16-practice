# Next.js 16 Practice Project

Next.js 16과 React 19를 활용한 AI 챗봇 애플리케이션 연습 프로젝트입니다.

## 📚 기술 스택

### Core

- **Next.js** 16.0.4 (App Router)
- **React** 19.2.0
- **TypeScript** 5.x
- **Tailwind CSS** 4.x

### State Management

- **Zustand** 5.0.8 (전역 상태 관리)
  - 테마 관리 (Light/Dark Mode)
  - LocalStorage 연동 (persist middleware)

### UI Components

- **shadcn/ui** (Radix UI 기반)
- **Lucide React** (아이콘)
- **class-variance-authority** (스타일 변형 관리)
- **tailwind-merge** & **clsx** (클래스 병합)

### AI & Markdown

- **Ollama** (로컬 LLM - llama3.1 모델)
- **React Markdown** (마크다운 렌더링)
- **remark-gfm** (GitHub Flavored Markdown 지원)

### Others

- **babel-plugin-react-compiler** (React 최적화)

## 🚀 주요 기능

### 1. AI 챗봇 (`/chat`)

- Ollama(llama3.1) 기반 로컬 AI 챗봇
- **실시간 스트리밍 응답** (토큰 단위 출력)
- 마크다운 형식 지원
  - 제목 (h1, h2, h3)
  - 리스트 (ul, ol)
  - 코드 블록 (인라인/블록)
  - 인용구 (blockquote)
- 한국어 응답 최적화
- 자동 스크롤

### 2. 테마 관리

- Light/Dark 모드 토글
- LocalStorage 자동 저장
- Zustand persist middleware 활용
- Hydration 처리

### 3. 프로젝트 구조

```
app/
├── api/
│   └── chat/
│       └── route.ts          # AI 챗봇 API (Ollama 프록시)
├── chat/
│   └── page.tsx              # 챗봇 UI 페이지
├── store/
│   └── use-theme.ts          # 테마 상태 관리 (Zustand)
├── components/               # 공통 컴포넌트
├── lib/                      # 유틸리티
└── styles/                   # 스타일

components/
└── ui/                       # shadcn/ui 컴포넌트
    ├── button.tsx
    ├── input.tsx
    └── theme-toggle.tsx
```

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Ollama 설치 및 실행

```bash
# Ollama 설치 (macOS)
brew install ollama

# Ollama 서비스 시작
ollama serve

# llama3.1 모델 다운로드
ollama pull llama3.1
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 접속

### 4. 챗봇 페이지 접속

http://localhost:3000/chat

## 📝 주요 구현 사항

### 스트리밍 응답 처리

- Ollama API → Next.js API Route → Client 3단계 스트리밍
- ReadableStream을 활용한 실시간 토큰 전달
- NDJSON 파싱 및 에러 핸들링

### 상태 관리

- Zustand의 persist middleware로 테마 상태 영구 저장
- `hasHydrated` 플래그로 SSR/CSR 불일치 방지

### 마크다운 렌더링

- `react-markdown`과 `remark-gfm`으로 풍부한 마크다운 지원
- 커스텀 컴포넌트로 스타일링 제어
- 인라인/블록 코드 구분 렌더링

## 🎯 주요 학습 포인트

1. **Next.js 16 App Router** 활용
2. **React 19** 새로운 기능 체험
3. **실시간 스트리밍** 구현 (ReadableStream)
4. **Zustand persist middleware** 실전 활용
5. **Ollama 로컬 LLM** 통합
6. **Tailwind CSS v4** 최신 버전 사용
7. **shadcn/ui** 컴포넌트 시스템

## 📦 빌드

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

## 🔧 환경 설정

### Ollama 포트 설정

기본적으로 Ollama는 `http://localhost:11434`에서 실행됩니다.
포트를 변경하려면 `app/api/chat/route.ts`에서 URL을 수정하세요.

### 모델 변경

다른 모델을 사용하려면 `app/api/chat/route.ts`의 `model` 필드를 수정하세요.

```typescript
model: "llama3.1", // 다른 모델명으로 변경
```

사용 가능한 모델:

```bash
ollama list
```

## 📄 라이선스

MIT
