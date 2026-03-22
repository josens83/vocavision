"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import Navigation from "@/components/navigation/Navigation";
import { Check, Shield, ArrowLeft, CreditCard, Loader2, Package } from "lucide-react";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useLocale } from '@/hooks/useLocale';
import { useWordCounts } from '@/hooks/useWordCounts';

type PlanType = "basic" | "premium";
type BillingCycle = "monthly" | "yearly";

interface PlanInfo {
  name: string;
  description: string;
  features: string[];
  prices: {
    monthly: number;
    yearly: number;
  };
}

interface PackageInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  price: number;
  originalPrice?: number;
  durationDays: number;
  badge?: string;
  wordCount: number;
  previewWords?: Array<{
    word: string;
    definitionKo?: string;
  }>;
}

function loadPaddle(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).Paddle) {
      resolve((window as any).Paddle);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => {
      const paddle = (window as any).Paddle;
      paddle.Initialize({ token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN });
      resolve(paddle);
    };
    script.onerror = () => reject(new Error('Failed to load Paddle.js'));
    document.head.appendChild(script);
  });
}

function getPlanInfo(isEn: boolean): Record<PlanType, PlanInfo> {
  return {
    basic: {
      name: isEn ? "Basic" : "베이직",
      description: isEn
        ? "Perfect for SAT & IELTS preparation"
        : "수능 영어 완벽 대비를 원하는 분께 추천",
      features: isEn
        ? [
            "SAT Full (Starter L1 + Advanced L2) — 1,934 words",
            "IELTS Academic Mastery — 795 words",
            "All AI-generated images",
            "All quiz modes",
            "Detailed learning statistics",
          ]
        : [
            "수능 L1(기초)/L2(중급)/L3(고급) 전체",
            "TEPS 기초/중급 어휘 (388개)",
            "AI 생성 이미지 전체",
            "전체 퀴즈 모드",
            "상세 학습 통계",
          ],
      prices: {
        monthly: isEn ? 499 : 4900,
        yearly: isEn ? 4788 : 47000,
      },
    },
    premium: {
      name: isEn ? "Premium" : "프리미엄",
      description: isEn
        ? "Complete access to all vocabulary packs"
        : "수능 + TEPS 완벽 대비를 원하는 분께 추천",
      features: isEn
        ? [
            "✨ All vocabulary packs included free",
            "SAT Full (Starter + Advanced) — 1,934 words",
            "IELTS Full (Foundation + Academic) — 795 words",
            "All AI-generated images",
            "All quiz modes",
            "Detailed learning statistics",
          ]
        : [
            "✨ 모든 단어장(단품) 무료 이용",
            "수능 L1(기초)/L2(중급)/L3(고급) 전체",
            "TEPS L1(기본)/L2(필수) 전체",
            "AI 생성 이미지 전체",
            "전체 퀴즈 모드",
            "상세 학습 통계",
          ],
      prices: {
        monthly: isEn ? 799 : 9900,
        yearly: isEn ? 7668 : 95000,
      },
    },
  };
}


// USD 가격 매핑 (글로벌 유저용)
const usdPackagePrices: Record<string, string> = {
  '2026-csat-analysis': '$3.99',
  'ebs-vocab': '$6.99',
  'toefl-complete': '$9.99',
  'toeic-complete': '$7.99',
  'sat-complete': '$9.99',
  'gre-complete': '$12.99',
  'ielts-complete': '$6.99',
};

// 단품 패키지 결제 컴포넌트
function PackageCheckout({ packageSlug }: { packageSlug: string }) {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const locale = useLocale();
  const isEn = locale === 'en';
  const wordCounts = useWordCounts();
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackageInfo();
  }, [packageSlug]);

  useEffect(() => {
    if (_hasHydrated && !user) {
      // redirect URL을 encodeURIComponent로 인코딩하여 쿼리 파라미터 충돌 방지
      const redirectUrl = encodeURIComponent(`/checkout?package=${packageSlug}`);
      router.push(`/auth/login?redirect=${redirectUrl}`);
    }
  }, [_hasHydrated, user, router, packageSlug]);

  const fetchPackageInfo = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/packages/${packageSlug}`
      );
      if (!response.ok) throw new Error(isEn ? "Package not found." : "패키지를 찾을 수 없습니다.");
      const data = await response.json();
      const pkg = data.package;
      if (pkg.wordCount === 0 && wordCounts.packages[packageSlug]) {
        pkg.wordCount = wordCounts.packages[packageSlug];
      }
      setPackageInfo(pkg);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!agreedToTerms || !packageInfo || !user) {
      if (!agreedToTerms) alert(isEn ? "Please agree to the Terms of Service and Privacy Policy." : "이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }

    setIsProcessing(true);

    try {
      if (isEn) {
        // Paddle (글로벌)
        const token = localStorage.getItem('authToken');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://vocavisionbackend-production.up.railway.app/api'}/paddle/create-package-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ packageSlug }),
          }
        );
        const data = await res.json();
        if (!data.transactionId) throw new Error('No transaction ID returned');

        const paddleInstance = await loadPaddle();
        setIsProcessing(false);
        paddleInstance.Checkout.open({
          transactionId: data.transactionId,
          settings: {
            successUrl: `${window.location.origin}/checkout/success?source=paddle`,
          },
        });
      } else {
        // TossPayments (한국)
        const { requestPaymentWithParams } = await import("@/lib/payments/toss");

        const safeUserId = user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
        const orderId = `vv-pkg-${safeUserId}-${packageSlug}-${Date.now()}`;

        await requestPaymentWithParams({
          orderId,
          orderName: packageInfo.name,
          amount: packageInfo.price,
          customerEmail: user.email || undefined,
          customerName: user.name || (isEn ? "Customer" : "고객"),
          packageSlug: packageSlug,
          packageId: packageInfo.id,
          userId: user.id,
          isPackagePurchase: true,
        });
      }
    } catch (error) {
      console.error("결제 오류:", error);
      alert(isEn ? "Payment error. Please try again." : "결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!_hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (error || !packageInfo) {
    return (
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isEn ? 'Package Not Found' : '패키지를 찾을 수 없습니다'}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="btn bg-brand-primary text-white">
            {isEn ? 'Back to Home' : '홈으로 돌아가기'}
          </Link>
        </div>
      </main>
    );
  }

  const hasDiscount =
    packageInfo.originalPrice && packageInfo.originalPrice > packageInfo.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - packageInfo.price / packageInfo.originalPrice!) * 100)
    : 0;
  const durationText = isEn
    ? (packageInfo.durationDays >= 365 ? "1 year" : `${packageInfo.durationDays} days`)
    : (packageInfo.durationDays >= 365 ? "1년" : `${packageInfo.durationDays}일`);

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEn ? 'Back to Home' : '홈으로 돌아가기'}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{isEn ? 'Purchase Package' : '단품 구매'}</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* 왼쪽: 상품 정보 */}
          <div className="md:col-span-2 space-y-6">
            {/* 상품 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 flex items-center justify-center flex-shrink-0">
                  <Package className="w-10 h-10 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {packageInfo.badge && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                        {packageInfo.badge}
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-gray-900">
                      {packageInfo.name}
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {packageInfo.description || packageInfo.shortDesc}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📚 {packageInfo.wordCount}{isEn ? ' words' : '개 단어'}</span>
                    <span>⏱️ {durationText}{isEn ? ' access' : ' 이용'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 이용 안내 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isEn ? 'What You Get' : '이용 안내'}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {isEn ? 'Instant access to all words' : '구매 즉시 모든 단어 학습 가능'}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {isEn ? 'Flashcards & quiz modes included' : '플래시카드, 퀴즈 모드 이용 가능'}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {isEn ? `${durationText} access from purchase date` : `구매일로부터 ${durationText}간 이용`}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {isEn ? 'One-time payment (no auto-renewal)' : '일회성 결제 (자동 갱신 없음)'}
                </li>
              </ul>
            </div>

            {/* 약관 동의 */}
            <div className="bg-brand-primary/5 border-2 border-brand-primary/20 rounded-xl p-5">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-6 h-6 rounded border-2 border-brand-primary/30 text-brand-primary focus:ring-brand-primary focus:ring-2 flex-shrink-0"
                />
                <div className="text-sm leading-relaxed">
                  <span className="text-gray-800 font-medium">
                    <Link
                      href="/terms"
                      className="text-brand-primary font-semibold hover:underline"
                      target="_blank"
                    >
                      {isEn ? 'Terms of Service' : '이용약관'}
                    </Link>
                    {isEn ? " and " : " 및 "}
                    <Link
                      href="/privacy"
                      className="text-brand-primary font-semibold hover:underline"
                      target="_blank"
                    >
                      {isEn ? 'Privacy Policy' : '개인정보처리방침'}
                    </Link>
                    {isEn ? '.' : '에 동의합니다.'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 오른쪽: 결제 요약 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEn ? 'Order Summary' : '결제 요약'}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{isEn ? 'Product' : '상품명'}</span>
                  <span className="font-medium">{packageInfo.name}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{isEn ? 'Duration' : '이용 기간'}</span>
                  <span>{durationText}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{isEn ? 'Words' : '단어 수'}</span>
                  <span>{packageInfo.wordCount}{isEn ? '' : '개'}</span>
                </div>

                {hasDiscount && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>{isEn ? 'Original Price' : '정상가'}</span>
                      <span className="line-through">
                        {isEn ? `$${(packageInfo.originalPrice! / 1300).toFixed(2)}` : `₩${packageInfo.originalPrice!.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>{isEn ? 'Discount' : '할인'}</span>
                      <span>-{discountPercent}%</span>
                    </div>
                  </>
                )}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{isEn ? 'Total' : '총 결제 금액'}</span>
                    <span className="text-brand-primary">
                      {isEn ? (usdPackagePrices[packageSlug] || `$${(packageInfo.price / 1300).toFixed(2)}`) : `₩${packageInfo.price.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing || !agreedToTerms}
                className={`w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
                  isProcessing || !agreedToTerms
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-brand-primary hover:bg-brand-primary/90"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isEn ? 'Processing...' : '처리 중...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {isEn ? `Pay ${usdPackagePrices[packageSlug] || `$${(packageInfo.price / 1300).toFixed(2)}`}` : `₩${packageInfo.price.toLocaleString()} 결제하기`}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                {isEn ? 'Secure payment by Paddle' : '토스페이먼츠 안전결제'}
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center">
                {isEn ? 'Full refund available within 14 days' : '결제 후 7일 이내 미이용 시 전액 환불 가능'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// 구독 플랜 결제 컴포넌트
function SubscriptionCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, _hasHydrated } = useAuthStore();
  const locale = useLocale();
  const isEn = locale === 'en';
  const plans = getPlanInfo(isEn);

  const planParam = searchParams.get("plan") as PlanType | null;
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("basic");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (planParam && (planParam === "basic" || planParam === "premium")) {
      setSelectedPlan(planParam);
    }
  }, [planParam]);

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push(`/auth/login?redirect=/checkout?plan=${selectedPlan}`);
    }
  }, [_hasHydrated, user, router, selectedPlan]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const plan = plans[selectedPlan];
  const price = plan.prices[billingCycle];
  const monthlyPrice = billingCycle === "yearly" ? Math.round(price / 12) : price;
  const savings = billingCycle === "yearly"
    ? plan.prices.monthly * 12 - plan.prices.yearly
    : 0;

  const handlePayment = async () => {
    if (!agreedToTerms || !user) {
      if (!agreedToTerms) alert(isEn
        ? "Please agree to the Terms of Service and Privacy Policy."
        : "이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }

    setIsProcessing(true);

    try {
      if (isEn) {
        // Paddle checkout (글로벌)
        const token = localStorage.getItem('authToken');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://vocavisionbackend-production.up.railway.app/api'}/paddle/create-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              plan: selectedPlan,
              billingCycle,
            }),
          }
        );
        const data = await res.json();
        if (!data.transactionId) throw new Error('No transaction ID returned');

        const paddleInstance = await loadPaddle();
        setIsProcessing(false);
        paddleInstance.Checkout.open({
          transactionId: data.transactionId,
          settings: {
            successUrl: `${window.location.origin}/checkout/success?source=paddle`,
          },
        });
      } else {
        // TossPayments (한국)
        const { requestPaymentWithParams } = await import("@/lib/payments/toss");
        const safeUserId = user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
        const orderId = `vv-sub-${safeUserId}-${selectedPlan}-${billingCycle}-${Date.now()}`;
        await requestPaymentWithParams({
          orderId,
          orderName: isEn
            ? `VocaVision AI ${getPlanInfo(isEn)[selectedPlan].name} (${billingCycle === "monthly" ? "Monthly" : "Yearly"})`
            : `VocaVision AI ${getPlanInfo(isEn)[selectedPlan].name} (${billingCycle === "monthly" ? "월간" : "연간"})`,
          amount: getPlanInfo(isEn)[selectedPlan].prices[billingCycle] as number,
          customerEmail: user.email || undefined,
          customerName: user.name || (isEn ? "Customer" : "고객"),
          plan: selectedPlan,
          billingCycle,
          userId: user.id,
        });
      }
    } catch (error) {
      console.error("결제 오류:", error);
      alert(isEn ? "Payment error. Please try again." : "결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEn ? 'Back to Pricing' : '요금제 페이지로 돌아가기'}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{isEn ? 'Checkout' : '결제하기'}</h1>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* 플랜 선택 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEn ? 'Select Plan' : '플랜 선택'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedPlan("basic")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === "basic"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">{plans.basic.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {plans.basic.description}
                  </div>
                </button>
                <button
                  onClick={() => setSelectedPlan("premium")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === "premium"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">{plans.premium.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {plans.premium.description}
                  </div>
                </button>
              </div>
            </div>

            {/* 결제 주기 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEn ? 'Billing Cycle' : '결제 주기'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    billingCycle === "monthly"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">{isEn ? 'Monthly' : '월간 결제'}</div>
                  <div className="text-lg font-bold text-gray-900 mt-2">
                    {isEn ? `$${(plan.prices.monthly / 100).toFixed(2)}` : `₩${plan.prices.monthly.toLocaleString()}`}
                    <span className="text-sm font-normal text-gray-500">
                      {isEn ? '/mo' : '/월'}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                    billingCycle === "yearly"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {isEn ? '20% OFF' : '20% 할인'}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-900">{isEn ? 'Yearly' : '연간 결제'}</div>
                  <div className="text-lg font-bold text-gray-900 mt-2">
                    {isEn ? `$${(plan.prices.yearly / 100).toFixed(2)}` : `₩${plan.prices.yearly.toLocaleString()}`}
                    <span className="text-sm font-normal text-gray-500">
                      {isEn ? '/yr' : '/년'}
                    </span>
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {isEn ? `$${(plan.prices.yearly / 12 / 100).toFixed(2)}/mo` : `월 ₩${Math.round(plan.prices.yearly / 12).toLocaleString()}`}
                  </div>
                </button>
              </div>
            </div>

            {/* 포함된 기능 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEn ? `Features included in ${plan.name}` : `${plan.name} 플랜에 포함된 기능`}
              </h2>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* 약관 동의 */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-5">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-6 h-6 rounded border-2 border-indigo-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 flex-shrink-0"
                />
                <div className="text-sm leading-relaxed">
                  <span className="text-gray-800 font-medium">
                    <Link href="/terms" className="text-indigo-600 font-semibold hover:underline" target="_blank">
                      {isEn ? 'Terms of Service' : '이용약관'}
                    </Link>
                    {isEn ? " and " : " 및 "}
                    <Link href="/privacy" className="text-indigo-600 font-semibold hover:underline" target="_blank">
                      {isEn ? 'Privacy Policy' : '개인정보처리방침'}
                    </Link>
                    {isEn ? '.' : '에 동의합니다.'}
                  </span>
                  <p className="text-gray-600 mt-1.5">
                    {isEn ? 'You agree to recurring billing. Cancel anytime.' : '정기 결제에 동의하며, 언제든지 해지할 수 있습니다.'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 오른쪽: 결제 요약 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEn ? 'Order Summary' : '결제 요약'}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{plan.name} {isEn ? 'Plan' : '플랜'}</span>
                  <span>{billingCycle === "monthly" ? (isEn ? "Monthly" : "월간") : (isEn ? "Yearly" : "연간")}</span>
                </div>

                {billingCycle === "yearly" && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>{isEn ? 'Original Price' : '정상가'}</span>
                      <span className="line-through">
                        {isEn ? `$${(plan.prices.monthly * 12 / 100).toFixed(2)}` : `₩${(plan.prices.monthly * 12).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>{isEn ? 'Annual Discount' : '연간 할인'}</span>
                      <span>{isEn ? `-$${(savings / 100).toFixed(2)}` : `-₩${savings.toLocaleString()}`}</span>
                    </div>
                  </>
                )}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{isEn ? 'Total' : '총 결제 금액'}</span>
                    <span className="text-indigo-600">
                      {isEn ? `$${(price / 100).toFixed(2)}` : `₩${price.toLocaleString()}`}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {isEn ? `($${(monthlyPrice / 100).toFixed(2)}/mo)` : `(월 ₩${monthlyPrice.toLocaleString()})`}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing || !agreedToTerms}
                className={`w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
                  isProcessing || !agreedToTerms
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isEn ? 'Processing...' : '처리 중...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {isEn ? 'Subscribe' : '결제하기'}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                {isEn ? 'Secure payment by Paddle' : '토스페이먼츠 안전결제'}
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center">
                {isEn ? 'Full refund available within 14 days' : '결제 후 7일 이내 미이용 시 전액 환불 가능'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// 메인 컴포넌트: package 파라미터 여부에 따라 분기
function CheckoutContent() {
  const searchParams = useSearchParams();
  const packageSlug = searchParams.get("package");

  if (packageSlug) {
    return <PackageCheckout packageSlug={packageSlug} />;
  }

  return <SubscriptionCheckout />;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ErrorBoundary>
      <Navigation />
      <Suspense fallback={<LoadingFallback />}>
        <CheckoutContent />
      </Suspense>
    </ErrorBoundary>
  );
}
