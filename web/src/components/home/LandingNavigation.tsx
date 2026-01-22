"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function LandingNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <span className="font-bold text-gray-900 text-lg">VocaVision</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            요금제
          </Link>
          <Link
            href="/learn?exam=CSAT&level=L1&demo=true"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            데모
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            시작하기
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4">
          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="text-gray-700 font-medium py-2 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              요금제
            </Link>
            <Link
              href="/learn?exam=CSAT&level=L1&demo=true"
              className="text-gray-700 font-medium py-2 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              데모
            </Link>
            <hr className="my-2" />
            <Link
              href="/auth/login"
              className="text-gray-700 font-medium py-2 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              로그인
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-gray-900 px-4 py-3 text-center font-medium text-white hover:bg-gray-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              시작하기
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
