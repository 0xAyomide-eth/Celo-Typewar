import TypingGame from '@/components/TypingGame';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col font-sans transition-colors duration-300">
      <TypingGame />
    </main>
  );
}
