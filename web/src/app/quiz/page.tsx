import Navigation from "@/components/navigation/Navigation";
import { QuizDemo } from "@/components/quiz/QuizChoice";

export default function QuizPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-6 min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-display-md font-display font-bold text-slate-900 mb-4">
              퀴즈 <span className="text-gradient">데모</span>
            </h1>
            <p className="text-lg text-slate-600">test-english.com 스타일의 퀴즈 UI를 체험해보세요.</p>
          </div>

          <QuizDemo />

          <div className="mt-12 card p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">📋 퀴즈 UI 특징</h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-level-beginner-light text-level-beginner flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <span><strong>카드형 선택지</strong> - 라디오 버튼을 숨기고 클릭 가능한 카드로 표시</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-level-intermediate-light text-level-intermediate flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <span><strong>라벨 표시 (A, B, C, D)</strong> - 좌측에 고정된 라벨 영역</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-level-advanced-light text-level-advanced flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <span><strong>선택 시 스타일 변경</strong> - 파란색 배경과 체크 표시</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-level-expert-light text-level-expert flex items-center justify-center text-sm font-bold shrink-0">4</span>
                <span><strong>정답/오답 피드백</strong> - 초록/빨강 색상으로 즉시 피드백</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-study-flashcard text-slate-900 flex items-center justify-center text-sm font-bold shrink-0">5</span>
                <span><strong>진행률 표시</strong> - 상단에 현재 문제 번호와 프로그레스 바</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
