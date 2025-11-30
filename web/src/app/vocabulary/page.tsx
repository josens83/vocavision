import Navigation from "@/components/navigation/Navigation";
import VocabularyLandingPage from "@/components/vocabulary/VocabularyLandingPage";

export default function Vocabulary() {
  return (
    <>
      <Navigation />
      <main className="pt-16">
        <VocabularyLandingPage />
      </main>
    </>
  );
}
