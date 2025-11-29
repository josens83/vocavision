import Navigation, { ScrollProgress } from "@/components/navigation/Navigation";
import HomePage from "@/components/home/HomePage";

export default function Page() {
  return (
    <>
      <ScrollProgress />
      <Navigation />
      <main>
        <HomePage />
      </main>
    </>
  );
}
