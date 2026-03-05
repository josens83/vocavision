"use client";

const stats = [
  { value: "12,675+", label: "\uC804\uCCB4 \uC218\uB85D \uB2E8\uC5B4" },
  { value: "6\uAC1C", label: "\uB300\uBE44 \uAC00\uB2A5\uD55C \uC2DC\uD5D8" },
  { value: "100%", label: "AI \uC0DD\uC131 \uC5B4\uC6D0\xB7\uC5F0\uC0C1\xB7\uC608\uBB38" },
  { value: "4.0\uAC1C", label: "\uB2E8\uC5B4\uB2F9 \uB9E5\uB77D \uC608\uBB38" },
  { value: "8\uC139\uC158", label: "\uB2E8\uC5B4\uBCC4 \uD559\uC2B5 \uCF58\uD150\uCE20" },
];

export default function TrustStatsSection() {
  return (
    <section className="py-16 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
          숫자로 증명합니다
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl sm:text-4xl font-bold text-brand-primary">
                {s.value}
              </span>
              <span className="text-sm text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
