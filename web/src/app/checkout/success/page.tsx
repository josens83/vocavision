"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Navigation from "@/components/navigation/Navigation";
import { confirmPayment } from "@/lib/payments/toss";
import { useAuthStore } from "@/lib/store";
import { useLocale } from '@/hooks/useLocale';
import { event as gaEvent } from "@/lib/monitoring/analytics";
import { useQueryClient } from "@tanstack/react-query";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = useLocale();
  const isEn = locale === 'en';
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [navigating, setNavigating] = useState(false);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  // 추가 파라미터 (successUrl에서 전달)
  const plan = searchParams.get("plan");
  const billingCycle = searchParams.get("billingCycle");
  const userId = searchParams.get("userId");
  // 패키지 구매용 파라미터
  const type = searchParams.get("type");
  const packageSlug = searchParams.get("packageSlug");
  const packageId = searchParams.get("packageId");
  // 빌링키 발급 플로우 (정기결제)
  const authKey = searchParams.get("authKey");
  const customerKey = searchParams.get("customerKey");
  const isBilling = searchParams.get("billing") === "true";

  // Paddle은 _ptxn으로 transaction ID를 반환함
  const transactionId = searchParams.get("transaction_id") || searchParams.get("_ptxn");
  const isPaddleSuccess = searchParams.get("source") === "paddle";
  const isPackagePurchase = type === "package";

  useEffect(() => {
    async function processPayment() {
      // Paddle overlay 결제 성공 (source=paddle)
      if (isPaddleSuccess) {
        setStatus("success");
        try {
          const { refreshUser } = useAuthStore.getState();
          await refreshUser();
        } catch (e) {
          console.error('Failed to refresh user:', e);
        }
        queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        return;
      }

      // Paddle 결제 성공 → 구독은 webhook으로 자동 처리됨
      if (transactionId) {
        setStatus("success");
        try {
          const { refreshUser } = useAuthStore.getState();
          await refreshUser();
        } catch (e) {
          console.error('Failed to refresh user:', e);
        }
        queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        return;
      }

      // ===== 빌링키 발급 플로우 (구독 정기결제) =====
      if (isBilling && authKey && customerKey) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

          // localStorage에서 accessToken
          let accessToken = "";
          if (typeof window !== "undefined") {
            const authStorage = localStorage.getItem("auth-storage");
            if (authStorage) {
              try {
                const authData = JSON.parse(authStorage);
                accessToken = authData?.state?.accessToken || "";
              } catch { /* ignore */ }
            }
          }

          const response = await fetch(`${API_URL}/payments/billing/issue`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify({
              authKey,
              customerKey,
              plan: plan || 'basic',
              billingCycle: billingCycle || 'monthly',
            }),
          });

          const result = await response.json();

          if (result.success) {
            setStatus("success");
            gaEvent('purchase', {
              category: 'conversion',
              label: plan || undefined,
            });
            try {
              const { refreshUser } = useAuthStore.getState();
              await refreshUser();
            } catch (e) {
              console.error('Failed to refresh user:', e);
            }
            queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
            queryClient.invalidateQueries({ queryKey: ['packageAccessBulk'] });
          } else {
            setStatus("error");
            setErrorMessage(result.error || (isEn ? "Billing registration failed." : "정기결제 등록에 실패했습니다."));
          }
        } catch (error) {
          console.error("빌링키 발급 오류:", error);
          setStatus("error");
          setErrorMessage(isEn ? "An error occurred during billing setup." : "정기결제 설정 중 오류가 발생했습니다.");
        }
        return;
      }

      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setErrorMessage(isEn ? "Invalid payment information." : "결제 정보가 올바르지 않습니다.");
        return;
      }

      try {
        const result = await confirmPayment(
          paymentKey,
          orderId,
          parseInt(amount, 10),
          {
            plan: plan || undefined,
            billingCycle: billingCycle || undefined,
            userId: userId || undefined,
            // 패키지 구매용
            type: type || undefined,
            packageSlug: packageSlug || undefined,
            packageId: packageId || undefined,
          }
        );

        if (result.success) {
          setStatus("success");
          gaEvent('purchase', {
            category: 'conversion',
            label: packageSlug || plan || undefined,
            value: parseInt(amount, 10),
          });
          // 유저 정보 갱신 - 구독 상태 반영
          try {
            const { refreshUser } = useAuthStore.getState();
            await refreshUser();
          } catch (e) {
            console.error('Failed to refresh user:', e);
          }
          // 패키지 접근 권한 캐시 무효화 (결제 완료 후 권한 갱신)
          queryClient.invalidateQueries({ queryKey: ['packageAccess'] });
          queryClient.invalidateQueries({ queryKey: ['packageAccessBulk'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        } else {
          setStatus("error");
          setErrorMessage(result.error || (isEn ? "Payment approval failed." : "결제 승인에 실패했습니다."));
        }
      } catch (error) {
        console.error("결제 처리 오류:", error);
        setStatus("error");
        setErrorMessage(isEn ? "An error occurred while processing payment." : "결제 처리 중 오류가 발생했습니다.");
      }
    }

    processPayment();
  }, [paymentKey, orderId, amount, plan, billingCycle, userId, type, packageSlug, packageId, transactionId, isPaddleSuccess]);

  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEn ? 'Processing Payment...' : '결제 처리 중...'}
            </h1>
            <p className="text-gray-600">
              {isEn ? 'Please wait a moment.' : '잠시만 기다려주세요.'}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEn ? 'Payment Complete!' : '결제가 완료되었습니다!'}
            </h1>
            <p className="text-gray-600 mb-6">
              {isPackagePurchase
                ? (isEn ? "Your purchase is complete. Start learning now!" : "단품 구매가 완료되었습니다. 지금 바로 학습을 시작하세요!")
                : (isEn ? "Thank you for subscribing to VocaVision AI." : "VocaVision AI 프리미엄 서비스를 이용해주셔서 감사합니다.")}
            </p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setNavigating(true);
                  try {
                    const { refreshUser } = useAuthStore.getState();
                    await refreshUser();
                  } catch (e) {
                    console.error('Failed to refresh user before navigation:', e);
                  }
                  queryClient.invalidateQueries({ queryKey: ['packageAccess'] });
                  queryClient.invalidateQueries({ queryKey: ['packageAccessBulk'] });
                  queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
                  router.push("/dashboard");
                }}
                disabled={navigating}
                className="block w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-center disabled:opacity-70"
              >
                {navigating ? (isEn ? "Redirecting..." : "이동 중...") : isPackagePurchase ? (isEn ? "Start Learning" : "학습 시작하기") : (isEn ? "View My Subscription" : "내 구독 확인하기")}
              </button>
              <Link
                href="/"
                className="block w-full py-3 px-6 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center"
              >
                {isEn ? 'Go to Home' : '홈으로 가기'}
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEn ? 'Payment Failed' : '결제 처리 실패'}
            </h1>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <Link
                href="/checkout"
                className="block w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {isEn ? 'Try Again' : '다시 시도하기'}
              </Link>
              <Link
                href="/pricing"
                className="block w-full py-3 px-6 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                {isEn ? 'Go to Pricing' : '요금제 페이지로 가기'}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Loading...
        </h1>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Suspense fallback={<LoadingFallback />}>
          <SuccessContent />
        </Suspense>
      </main>
    </>
  );
}
