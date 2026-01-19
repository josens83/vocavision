/**
 * Quiz Page
 * /quiz 접근 시 /review로 리다이렉트
 * 퀴즈 기능은 /review 페이지의 "4지선다 퀴즈" 버튼으로 통합
 */

import { redirect } from 'next/navigation';

export default function QuizPage() {
  redirect('/review');
}
