"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Navigation from "@/components/navigation/Navigation";
import { confirmPayment } from "@/lib/payments/toss";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    async function processPayment() {
      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        setErrorMessage("결제 정보가 올바르지 않습니다.");
        return;
      }

      try {
        const result = await confirmPayment(paymentKey, orderId, parseInt(amount, 10));

        if (result.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(result.error || "결제 승인에 실패했습니다.");
        }
      } catch (error) {
        console.error("결제 처리 오류:", error);
        setStatus("error");
        setErrorMessage("결제 처리 중 오류가 발생했습니다.");
      }
    }

    processPayment();
  }, [paymentKey, orderId, amount]);

  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              결제 처리 중...
            </h1>
            <p className="text-gray-600">
              잠시만 기다려주세요.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              결제가 완료되었습니다!
            </h1>
            <p className="text-gray-600 mb-6">
              VocaVision 프리미엄 서비스를 이용해주셔서 감사합니다.
            </p>
            <div className="space-y-3">
              <Link
                href="/learn"
                className="block w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                학습 시작하기
              </Link>
              <Link
                href="/"
                className="block w-full py-3 px-6 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                홈으로 가기
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              결제 처리 실패
            </h1>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <Link
                href="/checkout"
                className="block w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                다시 시도하기
              </Link>
              <Link
                href="/pricing"
                className="block w-full py-3 px-6 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                요금제 페이지로 가기
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
          로딩 중...
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
