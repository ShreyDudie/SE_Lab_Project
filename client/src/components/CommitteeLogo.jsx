import { useState } from 'react';

export default function CommitteeLogo({ committeeName, size = 64, className = '' }) {
  const [imgError, setImgError] = useState(false);

  // Fallback SVGs incase the user hasn't dropped the image files yet
  const fallbackLogos = {
    'Pratibimb': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="100" height="100" rx="20" fill="var(--burgundy)"/>
        <path d="M50 20L75 40V75C75 77.7614 72.7614 80 70 80H30C27.2386 80 25 77.7614 25 75V40L50 20Z" fill="#FFC107"/>
        <path d="M40 50C40 44.4772 44.4772 40 50 40C55.5228 40 60 44.4772 60 50V60C60 65.5228 55.5228 70 50 70C44.4772 70 40 65.5228 40 60V50Z" fill="white"/>
        <circle cx="45" cy="50" r="3" fill="#000"/>
        <circle cx="55" cy="50" r="3" fill="#000"/>
        <path d="M45 60Q50 65 55 60" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'Technovanza': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="100" height="100" rx="20" fill="var(--navy)"/>
        <path d="M30 30H70L80 50L70 70H30L20 50L30 30Z" fill="var(--primary)"/>
        <circle cx="50" cy="50" r="10" fill="#fff"/>
        <path d="M20 50H80" stroke="#fff" strokeWidth="2" strokeLinedasharray="4 4" />
        <path d="M50 20V80" stroke="#fff" strokeWidth="2" strokeLinedasharray="4 4" />
      </svg>
    ),
    'COC': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="100" height="100" rx="20" fill="#052e16"/>
        <text x="50" y="60" fontFamily="monospace" fontSize="48" fontWeight="bold" fill="#4ADE80" textAnchor="middle">&lt;/&gt;</text>
        <path d="M20 80H80" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    ),
    'Enthusia': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="100" height="100" rx="20" fill="#78350f"/>
        <path d="M30 30C30 18.9543 38.9543 10 50 10C61.0457 10 70 18.9543 70 30V40C70 51.0457 61.0457 60 50 60C38.9543 60 30 51.0457 30 40V30Z" fill="var(--gold)"/>
        <path d="M40 60L35 90H65L60 60" fill="var(--gold)"/>
        <path d="M20 20H30V40H20V20ZM70 20H80V40H70V20Z" fill="var(--gold)"/>
      </svg>
    )
  };

  const defaultLogo = (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="20" fill="var(--navy-light)"/>
      <circle cx="50" cy="50" r="25" fill="#fff" opacity="0.5"/>
      <text x="50" y="60" fontFamily="sans-serif" fontSize="32" fontWeight="bold" fill="#fff" textAnchor="middle">
        {committeeName ? committeeName[0] : 'V'}
      </text>
    </svg>
  );

  // Map committee string name to filename
  const getFileMap = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('coc')) return 'coc';
    if (n.includes('technovanza')) return 'technovanza';
    if (n.includes('pratibimb')) return 'prati';
    if (n.includes('enthusia')) return 'enthu';
    return null;
  };

  const fileName = getFileMap(committeeName);

  if (!imgError && fileName) {
    return (
      <img 
        src={`/logos/${fileName}.png`} 
        alt={`${committeeName} Logo`} 
        width={size} 
        height={size} 
        className={className}
        onError={() => setImgError(true)}
        style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.1))', borderRadius: '12px' }}
      />
    );
  }

  return fallbackLogos[committeeName] || defaultLogo;
}
