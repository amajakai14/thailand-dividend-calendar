export const PALETTES = {
  default: { xd: '#E25241', pay: '#1F9D6B', today: '#2D6CDF' },
  bold:    { xd: '#FF6B3D', pay: '#0FB37A', today: '#5B5BF7' },
  mono:    { xd: '#1A1A1A', pay: '#7A7A7A', today: '#000000' },
} as const;

export type Palette = keyof typeof PALETTES;

export interface Colors {
  bg: string; surface: string; surface2: string;
  text: string; muted: string; outMonth: string;
  weekend: string; divider: string; selectedBg: string;
  xd: string; pay: string; today: string;
}

export function colors(darkMode = false, accent: Palette = 'default'): Colors {
  const p = PALETTES[accent] ?? PALETTES.default;
  if (darkMode) {
    return {
      bg: '#0E1116', surface: '#171B22', surface2: '#1F2530',
      text: '#ECEFF4', muted: '#8893A4', outMonth: '#3A4250',
      weekend: '#A4537A', divider: '#262C36', selectedBg: '#222A36',
      ...p,
    };
  }
  return {
    bg: '#F6F4EE', surface: '#FFFFFF', surface2: '#F0EDE6',
    text: '#15181D', muted: '#8A8478', outMonth: '#C9C3B5',
    weekend: '#B65A7B', divider: '#E7E2D6', selectedBg: '#EBE6D8',
    ...p,
  };
}
