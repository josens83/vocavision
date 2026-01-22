"use client";

const stats = [
  { number: "7,656+", label: "수록 단어", icon: "📚", description: "검증된 필수 어휘" },
  { number: "3,335", label: "수능 필수 어휘", icon: "🎯", description: "EBS 연계 완벽 대비" },
  { number: "6,598", label: "TEPS 고급 어휘", icon: "📈", description: "서울대 텝스 대비" },
];

export default function SocialProofSection() {
  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            검증된 어휘 데이터베이스
          </h2>
          <p className="text-gray-600 mt-2">
            수능, TEPS 기출 분석 기반의 정확한 어휘 선별
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-center hover:shadow-md transition-all duration-200"
            >
              <span className="text-4xl mb-3 block">{stat.icon}</span>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {stat.number}
              </div>
              <div className="text-base font-medium text-gray-700 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-gray-500">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Additional Trust Elements */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>매일 업데이트</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>전문가 검수</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>기출 분석 기반</span>
          </div>
        </div>
      </div>
    </section>
  );
}
