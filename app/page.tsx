import TypingGame from '@/components/TypingGame';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-paper text-ink font-sans">
      <TypingGame />
    </main>
  );
}
