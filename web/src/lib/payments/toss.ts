/**
 * 토스페이먼츠 결제 연동 유틸리티
 *
 * 테스트 모드로 설정되어 있습니다.
 * 실서비스 전환 시 클라이언트 키를 변경해야 합니다.
 */

// 토스페이먼츠 테스트용 클라이언트 키
// 실서비스 전환 시 환경변수로 변경 필요
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

// 결제 성공/실패 리다이렉트 URL
const SUCCESS_URL = typeof window !== "undefined"
  ? `${window.location.origin}/checkout/success`
  : "";
const FAIL_URL = typeof window !== "undefined"
  ? `${window.location.origin}/checkout/fail`
  : "";

interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
}

interface TossPayments {
  requestPayment: (
    method: string,
    options: {
      amount: number;
      orderId: string;
      orderName: string;
      customerEmail?: string;
      customerName?: string;
      successUrl: string;
      failUrl: string;
    }
  ) => Promise<void>;
  requestBillingAuth: (
    method: string,
    options: {
      customerKey: string;
      successUrl: string;
      failUrl: string;
    }
  ) => Promise<void>;
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPayments;
  }
}

let tossPaymentsInstance: TossPayments | null = null;

/**
 * 토스페이먼츠 SDK 로드
 */
async function loadTossPaymentsSDK(): Promise<TossPayments> {
  if (tossPaymentsInstance) {
    return tossPaymentsInstance;
  }

  // SDK 스크립트가 이미 로드되어 있는지 확인
  if (window.TossPayments) {
    tossPaymentsInstance = window.TossPayments(TOSS_CLIENT_KEY);
    return tossPaymentsInstance;
  }

  // SDK 스크립트 동적 로드
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;

    script.onload = () => {
      if (window.TossPayments) {
        tossPaymentsInstance = window.TossPayments(TOSS_CLIENT_KEY);
        resolve(tossPaymentsInstance);
      } else {
        reject(new Error("토스페이먼츠 SDK 로드 실패"));
      }
    };

    script.onerror = () => {
      reject(new Error("토스페이먼츠 SDK 스크립트 로드 실패"));
    };

    document.head.appendChild(script);
  });
}

/**
 * 일반 결제 요청
 * 카드 결제를 통해 즉시 결제를 진행합니다.
 */
export async function requestPayment(request: PaymentRequest): Promise<void> {
  const tossPayments = await loadTossPaymentsSDK();

  await tossPayments.requestPayment("카드", {
    amount: request.amount,
    orderId: request.orderId,
    orderName: request.orderName,
    customerEmail: request.customerEmail,
    customerName: request.customerName,
    successUrl: SUCCESS_URL,
    failUrl: FAIL_URL,
  });
}

/**
 * 빌링키 발급 요청 (정기결제용)
 * 카드 정보를 등록하고 빌링키를 발급받습니다.
 */
export async function requestBillingAuth(customerKey: string): Promise<void> {
  const tossPayments = await loadTossPaymentsSDK();

  await tossPayments.requestBillingAuth("카드", {
    customerKey,
    successUrl: `${SUCCESS_URL}?billing=true`,
    failUrl: `${FAIL_URL}?billing=true`,
  });
}

/**
 * 결제 성공 처리
 * 백엔드 서버에서 결제 승인을 진행합니다.
 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // 백엔드 API URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    // localStorage에서 accessToken 가져오기
    let accessToken = "";
    if (typeof window !== "undefined") {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          accessToken = authData?.state?.accessToken || "";
        } catch {
          // 파싱 실패 시 무시
        }
      }
    }

    const response = await fetch(`${API_URL}/payments/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || result.message || "결제 승인 실패" };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("결제 승인 오류:", error);
    return { success: false, error: "결제 승인 중 오류가 발생했습니다." };
  }
}

/**
 * 결제 실패 기록
 */
export async function recordPaymentFail(
  orderId: string,
  code: string,
  message: string
): Promise<void> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    let accessToken = "";
    if (typeof window !== "undefined") {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          accessToken = authData?.state?.accessToken || "";
        } catch {
          // 파싱 실패 시 무시
        }
      }
    }

    await fetch(`${API_URL}/payments/fail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({ orderId, code, message }),
    });
  } catch (error) {
    console.error("결제 실패 기록 오류:", error);
  }
}
