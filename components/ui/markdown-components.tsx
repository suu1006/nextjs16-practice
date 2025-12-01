import type { Components } from "react-markdown";

// 마크다운 컴포넌트 설정
export const markdownComponents: Components = {
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

