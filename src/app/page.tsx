import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#6fd6b6]/20 px-4 py-10">
      {/* 상단 로고/앱명 */}
      <div className="flex flex-col items-center gap-4 mt-8 mb-10">
        <Image
          src="/memoza.png"
          alt="Memoza 로고"
          width={120}
          height={120}
          className="rounded-2xl shadow-lg"
          priority
        />
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Memoza
        </h1>
        <p className="text-lg text-gray-600 font-medium mt-2">
          미니멀, 안전, 실시간 동기화 메모 앱
        </p>
      </div>
      {/* 주요 기능/슬로건 */}
      <div className="w-full max-w-xl flex flex-col gap-8 items-center mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="bg-white/80 rounded-xl p-6 flex flex-col items-center shadow-sm">
            <span className="text-2xl font-bold text-gray-800 mb-2">
              🔒 보안
            </span>
            <span className="text-gray-600 text-center">
              PIN 설정으로 타인 접근을 원천 차단하고, 모든 메모는 데이터베이스에
              강력하게 암호화되어 저장됩니다.
            </span>
          </div>
          <div className="bg-white/80 rounded-xl p-6 flex flex-col items-center shadow-sm">
            <span className="text-2xl font-bold text-gray-800 mb-2">
              💻 어디서든 동기화
            </span>
            <span className="text-gray-600 text-center">
              데스크탑, 모바일, 태블릿 등 다양한 환경에서 동일한 경험과 실시간
              동기화를 보장합니다.
            </span>
          </div>
          <div className="bg-white/80 rounded-xl p-6 flex flex-col items-center shadow-sm">
            <span className="text-2xl font-bold text-gray-800 mb-2">
              🏷️ 태그/검색
            </span>
            <span className="text-gray-600 text-center">
              메모를 자유롭게 태그로 분류하고, 빠른 검색 및 필터링, 체크리스트
              등 다양한 생산성 도구를 제공합니다.
            </span>
          </div>
          <div className="bg-white/80 rounded-xl p-6 flex flex-col items-center shadow-sm">
            <span className="text-2xl font-bold text-gray-800 mb-2">
              ✨ 미니멀 & 직관성
            </span>
            <span className="text-gray-600 text-center">
              불필요한 기능 없이, 꼭 필요한 것만 담아 누구나 쉽게 쓸 수 있는
              직관적인 메모 경험을 제공합니다.
            </span>
          </div>
        </div>
        <div className="text-center mt-8 text-xl text-gray-700 font-semibold">
          &quot;가볍고 빠른,{" "}
          <span className="text-[#2ee6d6] font-bold">진짜 미니멀</span> 메모
          경험을 지금 시작하세요!&quot;
        </div>
      </div>
      {/* CTA 버튼 */}
      <Link
        href="/notes"
        className="mt-4 px-8 py-3 rounded-full bg-gray-900 text-white text-lg font-bold shadow hover:bg-gray-800 transition"
      >
        메모 시작하기
      </Link>
      <footer className="mt-16 text-xs text-gray-400">
        © 2025 Memoza. All rights reserved.
      </footer>
    </div>
  );
}
