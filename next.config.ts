import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true, // 리액트 컴파일러
  cacheComponents: true, // 컴포넌트 캐싱 최적화
};

export default nextConfig;
