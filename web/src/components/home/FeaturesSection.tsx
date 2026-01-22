"use client";

const features = [
  {
    icon: "🖼️",
    title: "AI 시각화 이미지",
    description: "개념을 한눈에 이해하는 3종 이미지",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: "🎤",
    title: "정확한 발음",
    description: "IPA + 한국어 발음 + 강세 표시",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: "🌳",
    title: "어원 분석",
    description: "그리스어/라틴어 어근으로 깊이 이해",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    icon: "💡",
    title: "창의적 암기법",
    description: "한국어 기반 언어유희로 쉽게 기억",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: "📝",
    title: "상세 뜻풀이",
    description: "영영/영한 정의와 품사 정보",
    color: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    icon: "📚",
    title: "예문 & 용례",
    description: "실제 문맥에서 단어 활용법 학습",
    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
  {
    icon: "🔗",
    title: "동의어/반의어",
    description: "관련 어휘로 폭넓게 확장",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    icon: "🎯",
    title: "시험별 레벨",
    description: "수능/TEPS 등 목표에 맞는 분류",
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="inline-block rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-4">
            학습 요소
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 md:text-4xl">
            8가지 학습 요소로 완벽하게
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            단순 암기가 아닌, 다감각 학습으로 장기 기억에 저장됩니다
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${feature.color} text-2xl mb-4 group-hover:scale-110 transition-transform duration-200`}
              >
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
