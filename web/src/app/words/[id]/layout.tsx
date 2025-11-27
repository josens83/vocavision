// Force dynamic rendering for this route segment
export const dynamic = 'force-dynamic';

export default function WordDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
