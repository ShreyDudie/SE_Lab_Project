import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCommitteeTheme } from '../utils/committeeThemes';

export default function MouseAura() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };
    
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  // Determine aura color based on route/theme
  let auraColor = 'rgba(255, 255, 255, 0.15)'; // default
  let auraSize = 300;
  
  if (location.pathname.startsWith('/committee/')) {
    // Attempt to extract ID (hacky but works for UI effect)
    // The actual committee data isn't easily accessible here without Context,
    // so we'll just check if there's a strong theme active on the body
    const bodyBg = document.body.style.background;
    if (bodyBg.includes('ea580c')) auraColor = 'rgba(234, 88, 12, 0.25)'; // Enthusia
    else if (bodyBg.includes('2563eb')) auraColor = 'rgba(59, 130, 246, 0.25)'; // Technovanza
    else if (bodyBg.includes('14532d')) auraColor = 'rgba(74, 222, 128, 0.15)'; // COC
    else if (bodyBg.includes('2d0000')) {
      auraColor = 'rgba(220, 38, 38, 0.25)'; // Pratibimb
      auraSize = 400; // slightly larger for cultural chaos
    }
  }

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${auraSize}px`,
        height: `${auraSize}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`,
        pointerEvents: 'none',
        transform: `translate(${position.x - auraSize / 2}px, ${position.y - auraSize / 2}px)`,
        zIndex: 9999,
        transition: 'transform 0.05s linear',
        mixBlendMode: 'screen',
      }}
    />
  );
}
