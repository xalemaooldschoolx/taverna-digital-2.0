import { useEffect, useRef } from 'react';

interface ConfettiEffectProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];

export default function ConfettiEffect({ active, onComplete }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Populate particles
    const particles: Particle[] = [];
    const count = 150;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.9) * 18, // upwards bias
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let framesElapsed = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      framesElapsed++;

      let activeParticles = 0;

      particles.forEach((p) => {
        if (p.opacity <= 0) return;
        activeParticles++;

        // Apply physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // air resistance
        p.rotation += p.rotationSpeed;

        if (framesElapsed > 45) {
          p.opacity -= 0.015;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);

        // Draw a nice ribbon confetti rectangle
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.5);
        ctx.restore();
      });

      if (activeParticles === 0 || framesElapsed > 130) {
        cancelAnimationFrame(animId);
        if (onComplete) onComplete();
      } else {
        animId = requestAnimationFrame(draw);
      }
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
