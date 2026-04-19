import TypingGame from '@/components/TypingGame';

export default function Home() {
  return (
    <main className="min-h-[100dvh] w-full flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">
      <TypingGame />
    </main>
  );
}
