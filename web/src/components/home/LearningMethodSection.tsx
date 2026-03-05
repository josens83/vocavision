"use client";

const methods = [
  {
    icon: "\uD83D\uDCD6",
    title: "\uB73B & \uBC1C\uC74C",
    desc: "\uD55C\uAE00 \uB73B + IPA + \uD55C\uAE00 \uBC1C\uC74C \uD45C\uAE30 \u2014 \uC815\uD655\uD55C \uBC1C\uC74C\uBD80\uD130 \uC2DC\uC791",
    color: "bg-blue-50 border-blue-200",
  },
  {
    icon: "\uD83C\uDFA8",
    title: "\uC5F0\uC0C1 \uC774\uBBF8\uC9C0",
    desc: "AI\uAC00 \uC0DD\uC131\uD55C \uC2DC\uAC01\uC801 \uC5F0\uC0C1 \uC774\uBBF8\uC9C0 \u2014 \uD14D\uC2A4\uD2B8\uAC00 \uC544\uB2CC \uC774\uBBF8\uC9C0\uB85C \uAE30\uC5B5",
    color: "bg-pink-50 border-pink-200",
  },
  {
    icon: "\uD83C\uDF33",
    title: "\uC5B4\uC6D0 \uBD84\uC11D",
    desc: "\uB77C\uD2F4\uC5B4\xB7\uADF8\uB9AC\uC2A4\uC5B4 \uBFCC\uB9AC \uD574\uBD80 \u2014 \uCC98\uC74C \uBCF4\uB294 \uB2E8\uC5B4\uB3C4 \uC758\uBBF8\uB97C \uCD94\uB860",
    color: "bg-green-50 border-green-200",
  },
  {
    icon: "\uD83D\uDCA1",
    title: "\uD55C\uAD6D\uC5B4 \uC5F0\uC0C1\uBC95",
    desc: "\uD55C\uAD6D\uC5B4 \uBC1C\uC74C \uAE30\uBC18 \uAE30\uC5B5 \uC5F0\uC0C1 \u2014 \uC18C\uB9AC\uB85C \uC758\uBBF8\uB97C \uC5F0\uACB0",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    icon: "\uD83C\uDFB5",
    title: "\uB77C\uC784 & \uB9AC\uB4EC",
    desc: "\uB2E4\uC74C\uC808 \uBD84\uD574/\uC7AC\uC870\uD569 \uB77C\uC784 \u2014 \uC18C\uB9AC\uB85C \uAC01\uC778\uB418\uB294 \uB2E8\uC5B4",
    color: "bg-purple-50 border-purple-200",
  },
  {
    icon: "\uD83D\uDD17",
    title: "\uCF5C\uB85C\uCF00\uC774\uC158",
    desc: "\uC6D0\uC5B4\uBBFC\uC774 \uD568\uAED8 \uC4F0\uB294 \uB2E8\uC5B4 \uC870\uD569 \u2014 \uC2DC\uD5D8\uC5D0 \uB098\uC624\uB294 \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uD45C\uD604",
    color: "bg-teal-50 border-teal-200",
  },
  {
    icon: "\uD83D\uDCDD",
    title: "\uC608\uBB38 4\uAC1C",
    desc: "\uC2DC\uD5D8 \uCD9C\uC81C \uC2A4\uD0C0\uC77C\uC758 \uB9E5\uB77D \uC608\uBB38(\uD55C\uC601 \uBCD1\uAE30) \u2014 \uBB38\uB9E5 \uC18D\uC5D0\uC11C \uCCB4\uD654",
    color: "bg-orange-50 border-orange-200",
  },
  {
    icon: "\uD83E\uDDE0",
    title: "\uAC04\uACA9 \uBC18\uBCF5 \uBCF5\uC2B5",
    desc: "\uD2C0\uB9B0 \uB2E8\uC5B4 \uC911\uC2EC \uC2A4\uB9C8\uD2B8 \uBCF5\uC2B5 \u2014 \uACFC\uD559\uC801\uC73C\uB85C \uCD5C\uC801\uD654\uB41C \uC554\uAE30 \uD0C0\uC774\uBC0D",
    color: "bg-indigo-50 border-indigo-200",
  },
];

export default function LearningMethodSection() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            하나의 단어, 8가지 시선
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            다른 단어앱은 뜻만 보여줍니다. VocaVision은 단어를 완전히 이해시킵니다.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {methods.map((m) => (
            <div
              key={m.title}
              className={`rounded-2xl border p-5 ${m.color} transition-transform hover:scale-[1.03]`}
            >
              <span className="text-3xl block mb-3">{m.icon}</span>
              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">{m.title}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
