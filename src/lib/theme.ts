import { useColorScheme } from 'react-native';

// Side Friends tokens (from the brand identity): each friend has a colour,
// azzurro is action, sole is winning, fragola is the group.
const light = {
  ground: '#ffffff', nuvola: '#f1f4f9', line: '#dde3ec', lineStrong: '#c9d2de',
  ink: '#0e1b33', inkMuted: '#56627a', onColor: '#0e1b33',
  azzurro: '#2e9bf0', azzurroShade: '#1a7fcf', azzurroText: '#1268b3', azzurroSoft: '#e3f1fd',
  sole: '#ffc21a', soleShade: '#d99e00', soleText: '#8a5a00', soleSoft: '#fff3cc',
  fragola: '#ff5b6e', fragolaShade: '#db3a4f', fragolaText: '#c81a39', fragolaSoft: '#ffe4e8',
  menta: '#2fbf8a', mentaShade: '#1f9a6d', lilla: '#9d7bf5', lillaShade: '#7c58de',
  argento: '#c3cbd6', bronzo: '#e0965a', backdrop: 'rgba(14,27,51,0.45)'
};
const dark: typeof light = {
  ground: '#0e1b33', nuvola: '#172744', line: '#2a3b5c', lineStrong: '#34486d',
  ink: '#f3f6fb', inkMuted: '#a9b4c8', onColor: '#0e1b33',
  azzurro: '#4aaef5', azzurroShade: '#2a86cc', azzurroText: '#7cc4f8', azzurroSoft: '#173a5e',
  sole: '#ffc83a', soleShade: '#cc9a1f', soleText: '#ffd15c', soleSoft: '#3a3318',
  fragola: '#ff6f81', fragolaShade: '#d24a5e', fragolaText: '#ff8b9a', fragolaSoft: '#45202e',
  menta: '#45d19d', mentaShade: '#2da577', lilla: '#b39af8', lillaShade: '#8e72d9',
  argento: '#aeb8c7', bronzo: '#e8a56e', backdrop: 'rgba(0,0,0,0.55)'
};
export type Theme = typeof light;
export type FriendColor = 'azzurro' | 'sole' | 'fragola' | 'menta' | 'lilla';

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
export const fill = (t: Theme, c: string) => (t as Record<string, string>)[c] ?? t.azzurro;
export const shade = (t: Theme, c: string) => (t as Record<string, string>)[c + 'Shade'] ?? t.azzurroShade;

export const font = {
  display: 'Unbounded_800ExtraBold',
  displayBold: 'Unbounded_700Bold',
  body: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  black: 'Figtree_800ExtraBold'
};
export const radius = { sm: 8, md: 16, lg: 24, full: 999 };
