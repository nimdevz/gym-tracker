'use client';

import React, { useEffect, useRef } from 'react';

export function InteractiveGradientBg() {
  const mousePos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const cursorOrbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial center position
    mousePos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    targetPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.015;

      // Smooth lerp towards mouse position
      mousePos.current.x += (targetPos.current.x - mousePos.current.x) * 0.05;
      mousePos.current.y += (targetPos.current.y - mousePos.current.y) * 0.05;

      // Continuous floating offsets
      const floatX1 = Math.sin(time * 0.8) * 80;
      const floatY1 = Math.cos(time * 0.6) * 60;

      const floatX2 = Math.cos(time * 0.7) * 90;
      const floatY2 = Math.sin(time * 0.9) * 70;

      const floatX3 = Math.sin(time * 0.5) * 70;
      const floatY3 = Math.cos(time * 0.8) * 80;

      // Position mouse-following orb
      if (cursorOrbRef.current) {
        cursorOrbRef.current.style.transform = `translate3d(${mousePos.current.x - 300}px, ${mousePos.current.y - 300}px, 0)`;
      }

      // Position floating ambient orbs + subtle shift based on mouse position
      if (orb1Ref.current) {
        const x = floatX1 + (mousePos.current.x - window.innerWidth / 2) * 0.08;
        const y = floatY1 + (mousePos.current.y - window.innerHeight / 2) * 0.08;
        orb1Ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (orb2Ref.current) {
        const x = floatX2 + (mousePos.current.x - window.innerWidth / 2) * -0.06;
        const y = floatY2 + (mousePos.current.y - window.innerHeight / 2) * -0.06;
        orb2Ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (orb3Ref.current) {
        const x = floatX3 + (mousePos.current.x - window.innerWidth / 2) * 0.04;
        const y = floatY3 + (mousePos.current.y - window.innerHeight / 2) * 0.04;
        orb3Ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden bg-[#09090b]">
      {/* Interactive Mouse-Following Spotlight Orb */}
      <div
        ref={cursorOrbRef}
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-60 transition-transform ease-out duration-75"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(13, 148, 136, 0.06) 50%, transparent 70%)',
          filter: 'blur(75px)',
          willChange: 'transform',
        }}
      />

      {/* Floating Ambient Green Orb 1 */}
      <div
        ref={orb1Ref}
        className="absolute top-[10%] left-[15%] w-[550px] h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.14) 0%, rgba(5, 150, 105, 0.03) 55%, transparent 70%)',
          filter: 'blur(85px)',
          willChange: 'transform',
        }}
      />

      {/* Floating Ambient Mint/Teal Orb 2 */}
      <div
        ref={orb2Ref}
        className="absolute top-[40%] right-[10%] w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, rgba(16, 185, 129, 0.04) 55%, transparent 70%)',
          filter: 'blur(90px)',
          willChange: 'transform',
        }}
      />

      {/* Floating Ambient Lime/Spring Orb 3 */}
      <div
        ref={orb3Ref}
        className="absolute bottom-[10%] left-[30%] w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(132, 204, 22, 0.12) 0%, rgba(52, 211, 153, 0.03) 55%, transparent 70%)',
          filter: 'blur(80px)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
