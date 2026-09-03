import confetti from 'canvas-confetti';

export function triggerLuxuryConfetti() {
  try {
    // Left cannon
    confetti({
      particleCount: 55,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff', '#e0e7ff'],
      ticks: 350,
      gravity: 0.9,
      scalar: 1.1,
      shapes: ['circle', 'square'],
    });

    // Right cannon
    confetti({
      particleCount: 55,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff', '#e0e7ff'],
      ticks: 350,
      gravity: 0.9,
      scalar: 1.1,
      shapes: ['circle', 'square'],
    });

    // Star burst after 250ms
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#fef08a', '#f59e0b'],
        ticks: 250,
        scalar: 1.2,
      });
    }, 250);
  } catch (e) {
    console.warn('Confetti error:', e);
  }
}
