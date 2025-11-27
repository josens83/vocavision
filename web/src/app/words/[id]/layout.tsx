// Force dynamic rendering for this route segment
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Return empty array to prevent static generation at build time
export function generateStaticParams() {
  return [];
}

export default function WordDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
