import Navigation from "@/components/navigation/Navigation";
import VocabularyCategoryPage from "@/components/vocabulary/VocabularyCategoryPage";
import { levelConfigs, type Level } from "@/components/vocabulary/LessonCard";

interface PageProps {
  params: { level: string };
}

// Convert URL param to Level type
function parseLevel(levelParam: string): Level {
  const levelMap: Record<string, Level> = {
    a1: "A1",
    a2: "A2",
    b1: "B1",
    "b1-plus": "B1+",
    b2: "B2",
    c1: "C1",
  };
  return levelMap[levelParam.toLowerCase()] || "A1";
}

export default function VocabularyLevelPage({ params }: PageProps) {
  const level = parseLevel(params.level);

  return (
    <>
      <Navigation />
      <main className="pt-16">
        <VocabularyCategoryPage level={level} />
      </main>
    </>
  );
}

// Generate static params for all levels
export function generateStaticParams() {
  return [
    { level: "a1" },
    { level: "a2" },
    { level: "b1" },
    { level: "b1-plus" },
    { level: "b2" },
    { level: "c1" },
  ];
}
