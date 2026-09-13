'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function ConfettiOnMount() {
  useEffect(() => {
    // Dispara confete em 2 explosões
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#1E4B5C', '#2E6B7E', '#4ADE80', '#FBBF24', '#60A5FA'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Explosão central
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors,
      });
    }, 200);
  }, []);

  return null;
}
