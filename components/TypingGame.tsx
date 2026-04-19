'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMiniPay } from '@/hooks/use-minipay';
import { Contract } from 'ethers';
import confetti from 'canvas-confetti';
import { Loader2, RefreshCw, Trophy, Wallet, Palette } from 'lucide-react';

const WORDS = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "I", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"
];

const GAME_DURATION = 30; // seconds

// Mock contract address for UI purposes if not deployed
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const CONTRACT_ABI = [
  "function submitScore(uint256 _wpm, uint256 _accuracy) public",
  "function bestWpm(address) public view returns (uint256)"
];

export default function TypingGame() {
  const { provider, address, isMiniPay, isConnected, connect } = useMiniPay();
  
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [theme, setTheme] = useState('light');

  const inputRef = useRef<HTMLInputElement>(null);

  const generateWords = () => {
    const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
    setWords(shuffled.slice(0, 100));
  };

  useEffect(() => {
    generateWords();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Load saved theme
    const savedTheme = localStorage.getItem('celotype-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.className = savedTheme === 'light' ? '' : `theme-${savedTheme}`;
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('celotype-theme', newTheme);
    document.documentElement.className = newTheme === 'light' ? '' : `theme-${newTheme}`;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && status === 'playing') {
      endGame();
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  useEffect(() => {
    if (isConnected && provider && address) {
      fetchBestScore();
    }
  }, [isConnected, provider, address]);

  const fetchBestScore = async () => {
    if (!provider || !address || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") return;
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const best = await contract.bestWpm(address);
      setBestScore(Number(best));
    } catch (e) {
      console.error("Failed to fetch best score", e);
    }
  };

  const startGame = () => {
    generateWords();
    setCurrentWordIndex(0);
    setCurrentInput('');
    setStatus('playing');
    setTimeLeft(GAME_DURATION);
    setCorrectKeystrokes(0);
    setTotalKeystrokes(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const endGame = () => {
    setStatus('finished');
    const timeInMinutes = GAME_DURATION / 60;
    const finalWpm = Math.round((correctKeystrokes / 5) / timeInMinutes);
    const finalAccuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 0;
    setWpm(finalWpm);
    setAccuracy(finalAccuracy);
    if (finalWpm > 40) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== 'playing') {
      if (status === 'idle') startGame();
      else return;
    }

    const value = e.target.value;
    const currentWord = words[currentWordIndex];

    // If space is pressed, move to next word
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      if (typedWord === currentWord) {
        setCorrectKeystrokes((prev) => prev + currentWord.length + 1); // +1 for space
      }
      setTotalKeystrokes((prev) => prev + currentWord.length + 1);
      setCurrentWordIndex((prev) => prev + 1);
      setCurrentInput('');
    } else {
      setCurrentInput(value);
    }
  };

  const submitScore = async () => {
    if (!provider || !isConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      alert("Contract not deployed yet. Please deploy the contract and update CONTRACT_ADDRESS in the code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.submitScore(wpm, accuracy);
      await tx.wait();
      alert("Score submitted successfully to Celo!");
      fetchBestScore();
    } catch (error) {
      console.error("Failed to submit score", error);
      alert("Failed to submit score. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWords = () => {
    const startIndex = Math.max(0, currentWordIndex - 5);
    const visibleWords = words.slice(startIndex, startIndex + 25);
    
    return visibleWords.map((word, i) => {
      const actualIndex = startIndex + i;
      const isCurrent = actualIndex === currentWordIndex;
      const isComplete = actualIndex < currentWordIndex;
      
      if (isComplete) {
        return (
          <span key={actualIndex} className="text-ink mr-[1ch]">
            {word}
          </span>
        );
      } else if (isCurrent) {
        const letters = [];
        const length = Math.max(word.length, currentInput.length);
        
        for (let idx = 0; idx <= length; idx++) {
          if (idx === currentInput.length) {
            letters.push(
              <span key={`cursor-${idx}`} className="inline-block w-[2px] h-[32px] bg-primary align-middle mx-[-1px] animate-pulse"></span>
            );
          }

          if (idx < length) {
            const expectedChar = word[idx] || '';
            const inputChar = currentInput[idx];
            let colorClass = "text-muted";
            
            if (inputChar !== undefined) {
              if (inputChar === expectedChar) {
                colorClass = "text-primary";
              } else {
                colorClass = "text-error";
              }
            }
            
            const displayChar = expectedChar || inputChar;
            letters.push(<span key={idx} className={colorClass}>{displayChar}</span>);
          }
        }

        return (
          <span key={actualIndex} className="border-b-[3px] border-primary mr-[1ch]">
            {letters}
          </span>
        );
      } else {
        return (
          <span key={actualIndex} className="mr-[1ch]">
            {word}
          </span>
        );
      }
    });
  };

  const currentWpm = status === 'finished' ? wpm : Math.round((correctKeystrokes / 5) / ((GAME_DURATION - timeLeft) / 60 || 1));
  const currentAcc = status === 'finished' ? accuracy : (totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 0);

  return (
    <div className="flex flex-col h-full w-full max-w-[1024px] mx-auto">
      <header className="px-12 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
          <div className="w-6 h-6 bg-secondary rounded-full border-4 border-primary"></div>
          CELO TYPER
        </div>
        <div className="flex flex-row items-center gap-4">
          <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-muted/20">
            <Palette size={14} className="text-muted" />
            <select 
              value={theme}
              onChange={handleThemeChange}
              className="bg-transparent text-xs font-semibold uppercase tracking-wider text-ink outline-none cursor-pointer border-none"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="ocean">Ocean</option>
              <option value="terminal">Terminal</option>
              <option value="sunset">Sunset</option>
              <option value="cyberpunk">Cyber</option>
            </select>
          </div>
          {!isConnected ? (
            <button 
              onClick={connect}
              className="bg-surface px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors hover:brightness-95 hover:dark:brightness-110"
            >
              <span className="text-muted">●</span> {isMiniPay ? "Connect MiniPay" : "Connect Wallet"}
            </button>
          ) : (
            <div className="bg-surface px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <span className="text-primary">●</span> Connected to {isMiniPay ? "MiniPay" : "Wallet"} • {address?.slice(0, 4)}...{address?.slice(-4)}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-12 flex flex-col justify-center gap-16">
        <div className="flex gap-12">
          <div className="flex flex-col">
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted mb-1">WPM</div>
            <div className={`text-5xl font-extrabold leading-none tracking-tight ${status === 'playing' ? 'text-primary' : ''}`}>
              {currentWpm || 0}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted mb-1">ACC</div>
            <div className="text-5xl font-extrabold leading-none tracking-tight">
              {currentAcc}%
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-[11px] uppercase tracking-[0.1em] text-muted mb-1">TIME</div>
            <div className="text-5xl font-extrabold leading-none tracking-tight">
              {timeLeft}s
            </div>
          </div>
        </div>

        <div 
          className="font-mono text-[32px] leading-relaxed text-muted max-w-[900px] select-none relative"
          onClick={() => inputRef.current?.focus()}
        >
          {renderWords()}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            className="absolute opacity-0 pointer-events-none"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </main>

      <footer className="p-12 flex justify-between items-end">
        <div className="text-xs text-muted">
          Press <span className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">Tab</span> + <span className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">Enter</span> to restart test
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="mt-3 text-xs font-medium text-muted">
              {bestScore !== null ? `Best Score: ${bestScore} WPM` : ""}
            </div>
            <div className="mt-2 flex gap-4">
              <button 
                onClick={startGame}
                className="px-7 py-3.5 rounded-xl font-bold text-sm cursor-pointer border border-ink bg-transparent transition-transform hover:scale-105"
              >
                Restart Test
              </button>
              <button 
                onClick={submitScore}
                disabled={isSubmitting || !isConnected || status !== 'finished'}
                className="px-7 py-3.5 rounded-xl font-bold text-sm cursor-pointer border border-primary bg-primary text-paper transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Save to Celo"}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
