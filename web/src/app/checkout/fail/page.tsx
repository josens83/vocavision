"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";
import Navigation from "@/components/navigation/Navigation";

function FailContent() {
  const searchParams = useSearchParams();

  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");

  const getErrorDescription = (code: string | null): string => {
    switch (code) {
      case "PAY_PROCESS_CANCELED":
        return "결제가 취소되었습니다.";
      case "PAY_PROCESS_ABORTED":
        return "결제가 중단되었습니다.";
      case "REJECT_CARD_COMPANY":
        return "카드사에서 결제를 거절했습니다.";
      default:
        return errorMessage || "결제 처리 중 오류가 발생했습니다.";
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          결제 실패
        </h1>
        <p className="text-gray-600 mb-2">
          {getErrorDescription(errorCode)}
        </p>
        {errorCode && (
          <p className="text-sm text-gray-400 mb-6">
            오류 코드: {errorCode}
          </p>
        )}

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

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            결제 관련 문의:{" "}
            <a
              href="mailto:support@vocavision.com"
              className="text-indigo-600 hover:underline"
            >
              support@vocavision.com
            </a>
          </p>
        </div>
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

export default function CheckoutFailPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Suspense fallback={<LoadingFallback />}>
          <FailContent />
        </Suspense>
      </main>
    </>
  );
}
