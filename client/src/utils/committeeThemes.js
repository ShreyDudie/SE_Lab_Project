/**
 * Committee Theme Configuration
 * Each committee has a completely unique visual identity.
 * DO NOT apply one style globally — each is a separate universe.
 */

const COMMITTEE_THEMES = {
  Pratibimb: {
    id: 'pratibimb',
    cssClass: 'theme-pratibimb',
    tagline: 'Pop meets Paradox',
    subtitle: 'Cultural Fest • VJTI',
    about: 'Pratibimb is VJTI\'s flagship cultural festival — a celebration of art, music, dance, drama, and everything that makes the creative spirit come alive. From electrifying performances to soul-stirring competitions, Pratibimb transforms the campus into a cultural wonderland.',
    icon: 'fa-palette',
    heroIcon: '🎭',
    colors: {
      primary: '#DC2626',
      primaryLight: '#EF4444',
      accent: '#000000',
      glow: 'rgba(220, 38, 38, 0.6)',
      text: '#FECACA',
      cardBg: 'rgba(20, 0, 0, 0.85)',
      heroBg: 'linear-gradient(135deg, #0a0000 0%, #1a0000 30%, #2d0000 60%, #0a0000 100%)',
    },
    effects: ['glitch', 'flicker', 'ink-smoke'],
    fontFamily: "'Bebas Neue', 'Impact', sans-serif",
    categories: ['Competition', 'Performance', 'Concert', 'Ceremony'],
  },

  Enthusia: {
    id: 'enthusia',
    cssClass: 'theme-enthusia',
    tagline: 'Celebrating Women Champions',
    subtitle: 'Sports Committee • VJTI',
    about: 'Enthusia is VJTI\'s annual inter-college sports festival — fueling the competitive spirit with events spanning football, cricket, basketball, athletics, and more. This year\'s theme celebrates the unstoppable women champions who redefine the game.',
    icon: 'fa-futbol',
    heroIcon: '🏆',
    colors: {
      primary: '#F97316',
      primaryLight: '#FB923C',
      accent: '#EA580C',
      glow: 'rgba(249, 115, 22, 0.6)',
      text: '#FFEDD5',
      cardBg: 'rgba(25, 10, 0, 0.85)',
      heroBg: 'linear-gradient(135deg, #431407 0%, #ea580c 40%, #78350f 100%)',
    },
    effects: ['shine-sweep', 'trophy-glow', 'victory'],
    fontFamily: "'Oswald', 'Impact', sans-serif",
    categories: ['Team Sport', 'Individual', 'Athletics', 'E-Sports'],
  },

  Technovanza: {
    id: 'technovanza',
    cssClass: 'theme-technovanza',
    tagline: 'Silver Jubilee Celebration',
    subtitle: 'Tech Fest • Hackathons • RoboWars',
    about: 'Technovanza is VJTI\'s premier technical festival. Bringing together the brightest minds to build, compete, and push the boundaries of technology.',
    icon: 'fa-microchip',
    heroIcon: '⚡',
    colors: {
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      accent: '#2563EB',
      glow: 'rgba(59, 130, 246, 0.6)',
      text: '#DBEAFE',
      cardBg: 'rgba(5, 10, 30, 0.85)',
      heroBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 40%, #0f172a 100%)',
    },
    effects: ['neon-grid', 'scan-line', 'digital'],
    fontFamily: "'Orbitron', 'Courier New', monospace",
    categories: ['Hackathon', 'RoboWars', 'Workshop', 'Competition'],
  },

  COC: {
    id: 'coc',
    cssClass: 'theme-coc',
    tagline: 'Code. Compete. Conquer.',
    subtitle: 'Coding Club • Competitive Programming',
    about: 'COC (Community of Coders) is VJTI\'s coding club — the epicenter of competitive programming, algorithmic challenges, and open-source contributions.',
    icon: 'fa-code',
    heroIcon: '💻',
    colors: {
      primary: '#4ADE80',
      primaryLight: '#86EFAC',
      accent: '#16A34A',
      glow: 'rgba(74, 222, 128, 0.6)',
      text: '#DCFCE7',
      cardBg: 'rgba(0, 0, 0, 0.9)',
      heroBg: 'linear-gradient(135deg, #052e16 0%, #000000 40%, #14532d 100%)',
    },
    effects: ['matrix', 'blink-cursor', 'terminal'],
    fontFamily: "'Fira Code', 'Consolas', monospace",
    categories: ['Contest', 'Workshop', 'Hackathon', 'Lecture'],
  },
};

/**
 * Get theme config for a committee by name.
 * Falls back to a neutral theme if not found.
 */
export function getCommitteeTheme(name) {
  if (!name) return null;
  return COMMITTEE_THEMES[name] || null;
}

/**
 * Get all themes as an array for iteration.
 */
export function getAllThemes() {
  return Object.entries(COMMITTEE_THEMES).map(([name, theme]) => ({
    name,
    ...theme,
  }));
}

/**
 * Generate inline CSS variables from a theme for dynamic application.
 */
export function getThemeCSSVars(theme) {
  if (!theme) return {};
  return {
    '--committee-primary': theme.colors.primary,
    '--committee-primary-light': theme.colors.primaryLight,
    '--committee-accent': theme.colors.accent,
    '--committee-glow': theme.colors.glow,
    '--committee-text': theme.colors.text,
    '--committee-card-bg': theme.colors.cardBg,
    '--committee-hero-bg': theme.colors.heroBg,
    '--committee-font': theme.fontFamily,
  };
}

export default COMMITTEE_THEMES;
