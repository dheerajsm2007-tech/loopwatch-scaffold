import React, { useEffect, useRef, useState } from 'react';

export default function HeroCanvasVideo({ totalFrames = 180, fps = 24 }) {
  const canvasRef = useRef(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imagesRef = useRef([]);
  const animationRef = useRef(null);
  const frameIndexRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;

    let isMounted = true;
    const loadedImages = [];
    let count = 0;

    // Load frames from ezgif-55830495f9260025-jpg
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      // Format 3-digit padded number: 001, 002... 180
      const frameNum = String(i).padStart(3, '0');
      img.src = `/ezgif-55830495f9260025-jpg/ezgif-frame-${frameNum}.jpg`;

      img.onload = () => {
        if (!isMounted) return;
        count++;
        setLoadedCount(count);
        if (count === totalFrames || (count === 30 && i === 30)) {
          // Ready to render initial frames quickly
          setIsLoaded(true);
        }
      };

      loadedImages.push(img);
    }

    imagesRef.current = loadedImages;

    // Canvas drawing function
    const render = (time) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle timing
      const interval = 1000 / fps;
      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time;

        const currentImg = imagesRef.current[frameIndexRef.current];
        if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
          // Draw with object-fit: cover scaling
          const cWidth = canvas.width;
          const cHeight = canvas.height;
          const imgWidth = currentImg.naturalWidth;
          const imgHeight = currentImg.naturalHeight;

          const imgRatio = imgWidth / imgHeight;
          const canvasRatio = cWidth / cHeight;

          let renderWidth, renderHeight, offsetX, offsetY;

          if (canvasRatio > imgRatio) {
            renderWidth = cWidth;
            renderHeight = cWidth / imgRatio;
            offsetX = 0;
            offsetY = (cHeight - renderHeight) / 2;
          } else {
            renderWidth = cHeight * imgRatio;
            renderHeight = cHeight;
            offsetX = (cWidth - renderWidth) / 2;
            offsetY = 0;
          }

          ctx.clearRect(0, 0, cWidth, cHeight);
          ctx.drawImage(currentImg, offsetX, offsetY, renderWidth, renderHeight);
        }

        if (!prefersReducedMotion) {
          frameIndexRef.current = (frameIndexRef.current + 1) % totalFrames;
        }
      }

      if (!prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    // Resize handler
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = parent.clientHeight;
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    animationRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [totalFrames, fps]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Preloader subtle indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#090b0e] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 font-mono text-xs text-[#8b9bb4]">
            <div className="w-5 h-5 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
            <span>Loading telemetry stream ({Math.round((loadedCount / totalFrames) * 100)}%)...</span>
          </div>
        </div>
      )}

      {/* Frame Sequence Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.15]"
      />

      {/* Dark Scrim Overlay (Bottom-heavy 80% opacity fading to ~20% top) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090b0e] via-[#090b0e]/75 to-[#090b0e]/30 z-10" />

      {/* Subtle Cyan Grid Accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 z-10" />
    </div>
  );
}
