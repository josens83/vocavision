import Navigation, { ScrollProgress } from "@/components/navigation/Navigation";
import HomePage from "@/components/home/HomePage";
import PromoBanner from "@/components/home/PromoBanner";

export default function Page() {
  return (
    <>
      <ScrollProgress />
      <PromoBanner />
      <Navigation />
      <main>
        <HomePage />
      </main>
    </>
  );
}
