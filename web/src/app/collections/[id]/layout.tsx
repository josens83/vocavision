// Force dynamic rendering for this route segment
export const dynamic = 'force-dynamic';

export default function CollectionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
