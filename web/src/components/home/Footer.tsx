"use client";

import Link from "next/link";

const footerLinks = {
  product: {
    title: "서비스",
    links: [
      { label: "단어 학습", href: "/learn" },
      { label: "복습", href: "/review" },
      { label: "요금제", href: "/pricing" },
    ],
  },
  support: {
    title: "고객지원",
    links: [
      { label: "자주 묻는 질문", href: "/faq" },
      { label: "문의하기", href: "/contact" },
    ],
  },
  legal: {
    title: "법적 고지",
    links: [
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                V
              </div>
              <span className="font-bold text-gray-900">VocaVision</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              AI 기반 영어 단어 학습 플랫폼
              <br />
              수능 · TEPS 완벽 대비
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-gray-900 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} VocaVision AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a href="mailto:support@vocavision.ai" className="hover:text-gray-700">
              support@vocavision.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
