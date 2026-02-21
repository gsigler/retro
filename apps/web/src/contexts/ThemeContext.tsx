import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface Theme {
  name: string
  bg: string
  bgSecondary: string
  bgHover: string
  surface: string
  border: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  green: string
  red: string
  yellow: string
  blue: string
  purple: string
  cyan: string
  cursor: string
  dotRed: string
  dotYellow: string
  dotGreen: string
  swatches: string[]
}

const dracula: Theme = {
  name: 'Dracula',
  bg: '#282a36',
  bgSecondary: '#1e1f29',
  bgHover: '#343746',
  surface: '#44475a',
  border: '#7c8db5',
  textPrimary: '#f8f8f2',
  textSecondary: '#bd93f9',
  textTertiary: '#8894b0',
  green: '#50fa7b',
  red: '#ff5555',
  yellow: '#f1fa8c',
  blue: '#8be9fd',
  purple: '#bd93f9',
  cyan: '#8be9fd',
  cursor: '#f8f8f2',
  dotRed: '#ff5555',
  dotYellow: '#f1fa8c',
  dotGreen: '#50fa7b',
  swatches: ['#ff5555', '#f1fa8c', '#50fa7b', '#8be9fd', '#bd93f9', '#ff79c6'],
}

const oneDark: Theme = {
  name: 'One Dark',
  bg: '#282c34',
  bgSecondary: '#21252b',
  bgHover: '#2c313a',
  surface: '#3e4451',
  border: '#6b7080',
  textPrimary: '#abb2bf',
  textSecondary: '#c678dd',
  textTertiary: '#7a808c',
  green: '#98c379',
  red: '#e06c75',
  yellow: '#e5c07b',
  blue: '#61afef',
  purple: '#c678dd',
  cyan: '#56b6c2',
  cursor: '#abb2bf',
  dotRed: '#e06c75',
  dotYellow: '#e5c07b',
  dotGreen: '#98c379',
  swatches: ['#e06c75', '#e5c07b', '#98c379', '#61afef', '#c678dd', '#56b6c2'],
}

const catppuccin: Theme = {
  name: 'Catppuccin',
  bg: '#1e1e2e',
  bgSecondary: '#181825',
  bgHover: '#262637',
  surface: '#313244',
  border: '#585b70',
  textPrimary: '#cdd6f4',
  textSecondary: '#cba6f7',
  textTertiary: '#7f849c',
  green: '#a6e3a1',
  red: '#f38ba8',
  yellow: '#f9e2af',
  blue: '#89b4fa',
  purple: '#cba6f7',
  cyan: '#94e2d5',
  cursor: '#cdd6f4',
  dotRed: '#f38ba8',
  dotYellow: '#f9e2af',
  dotGreen: '#a6e3a1',
  swatches: ['#f38ba8', '#f9e2af', '#a6e3a1', '#89b4fa', '#cba6f7', '#94e2d5'],
}

const gruvbox: Theme = {
  name: 'Gruvbox',
  bg: '#282828',
  bgSecondary: '#1d2021',
  bgHover: '#3c3836',
  surface: '#3c3836',
  border: '#665c54',
  textPrimary: '#ebdbb2',
  textSecondary: '#d3869b',
  textTertiary: '#a89984',
  green: '#b8bb26',
  red: '#fb4934',
  yellow: '#fabd2f',
  blue: '#83a598',
  purple: '#d3869b',
  cyan: '#8ec07c',
  cursor: '#ebdbb2',
  dotRed: '#fb4934',
  dotYellow: '#fabd2f',
  dotGreen: '#b8bb26',
  swatches: ['#fb4934', '#fabd2f', '#b8bb26', '#83a598', '#d3869b', '#8ec07c'],
}

const nord: Theme = {
  name: 'Nord',
  bg: '#2e3440',
  bgSecondary: '#272c36',
  bgHover: '#3b4252',
  surface: '#3b4252',
  border: '#616e88',
  textPrimary: '#eceff4',
  textSecondary: '#b48ead',
  textTertiary: '#7b88a1',
  green: '#a3be8c',
  red: '#bf616a',
  yellow: '#ebcb8b',
  blue: '#81a1c1',
  purple: '#b48ead',
  cyan: '#88c0d0',
  cursor: '#eceff4',
  dotRed: '#bf616a',
  dotYellow: '#ebcb8b',
  dotGreen: '#a3be8c',
  swatches: ['#bf616a', '#ebcb8b', '#a3be8c', '#81a1c1', '#b48ead', '#88c0d0'],
}

const solarized: Theme = {
  name: 'Solarized',
  bg: '#002b36',
  bgSecondary: '#00232c',
  bgHover: '#073642',
  surface: '#073642',
  border: '#6d8388',
  textPrimary: '#fdf6e3',
  textSecondary: '#d33682',
  textTertiary: '#839496',
  green: '#859900',
  red: '#dc322f',
  yellow: '#b58900',
  blue: '#268bd2',
  purple: '#d33682',
  cyan: '#2aa198',
  cursor: '#fdf6e3',
  dotRed: '#dc322f',
  dotYellow: '#b58900',
  dotGreen: '#859900',
  swatches: ['#dc322f', '#b58900', '#859900', '#268bd2', '#d33682', '#2aa198'],
}

const light: Theme = {
  name: 'Light',
  bg: '#ffffff',
  bgSecondary: '#f5f5f5',
  bgHover: '#e8e8e8',
  surface: '#eeeeee',
  border: '#cccccc',
  textPrimary: '#1a1a1a',
  textSecondary: '#7c3aed',
  textTertiary: '#555555',
  green: '#16a34a',
  red: '#dc2626',
  yellow: '#b45309',
  blue: '#2563eb',
  purple: '#9333ea',
  cyan: '#0891b2',
  cursor: '#1a1a1a',
  dotRed: '#dc2626',
  dotYellow: '#b45309',
  dotGreen: '#16a34a',
  swatches: ['#dc2626', '#b45309', '#16a34a', '#2563eb', '#9333ea', '#0891b2'],
}

const solarizedLight: Theme = {
  name: 'Solarized Light',
  bg: '#fdf6e3',
  bgSecondary: '#eee8d5',
  bgHover: '#e4ddc8',
  surface: '#eee8d5',
  border: '#93a1a1',
  textPrimary: '#073642',
  textSecondary: '#268bd2',
  textTertiary: '#586e75',
  green: '#859900',
  red: '#dc322f',
  yellow: '#b58900',
  blue: '#268bd2',
  purple: '#d33682',
  cyan: '#2aa198',
  cursor: '#073642',
  dotRed: '#dc322f',
  dotYellow: '#b58900',
  dotGreen: '#859900',
  swatches: ['#dc322f', '#b58900', '#859900', '#268bd2', '#d33682', '#2aa198'],
}

const highContrast: Theme = {
  name: 'High Contrast',
  bg: '#000000',
  bgSecondary: '#0d0d0d',
  bgHover: '#1a1a1a',
  surface: '#141414',
  border: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: '#ffff00',
  textTertiary: '#dddddd',
  green: '#00ff88',
  red: '#ff6b6b',
  yellow: '#ffff00',
  blue: '#66aaff',
  purple: '#cc88ff',
  cyan: '#00ffff',
  cursor: '#ffffff',
  dotRed: '#ff6b6b',
  dotYellow: '#ffff00',
  dotGreen: '#00ff88',
  swatches: ['#ff6b6b', '#ffff00', '#00ff88', '#66aaff', '#cc88ff', '#00ffff'],
}

// Color values in this theme follow the Okabe-Ito palette, which is safe for
// deuteranopia/protanopia (red-green color blindness). The 'green' and 'red'
// fields are repurposed as "positive" (sky blue) and "warning/error" (orange)
// so no meaning is conveyed by red/green distinction alone.
const colorBlind: Theme = {
  name: 'Color Blind Friendly',
  bg: '#0a0a1a',
  bgSecondary: '#0d0d22',
  bgHover: '#16163a',
  surface: '#14142e',
  border: '#5b72b8',
  textPrimary: '#e8e8e8',
  textSecondary: '#f8a100',
  textTertiary: '#9099bb',
  green: '#56b4e9', // sky blue — used where "positive/success" is indicated
  red: '#e69f00', // orange — used where "error/danger" is indicated
  yellow: '#f0e442',
  blue: '#0072b2',
  purple: '#cc79a7',
  cyan: '#56b4e9',
  cursor: '#e8e8e8',
  dotRed: '#d55e00',
  dotYellow: '#f0e442',
  dotGreen: '#009e73',
  swatches: ['#e69f00', '#56b4e9', '#009e73', '#f0e442', '#0072b2', '#cc79a7'],
}

const devDesigned: Theme = {
  name: 'Dev Designed',
  bg: '#0000aa',
  bgSecondary: '#000088',
  bgHover: '#0000cc',
  surface: '#0000bb',
  border: '#ff0000',
  textPrimary: '#ff0000',
  textSecondary: '#ffff00',
  textTertiary: '#ff8800',
  green: '#00ff00',
  red: '#ff0000',
  yellow: '#ffff00',
  blue: '#00aaff',
  purple: '#ff00ff',
  cyan: '#00ffff',
  cursor: '#ff0000',
  dotRed: '#ff0000',
  dotYellow: '#ffff00',
  dotGreen: '#00ff00',
  swatches: ['#ff0000', '#ffff00', '#00ff00', '#ff00ff', '#00ffff', '#ff8800'],
}

export const themes: Record<string, Theme> = {
  dracula,
  oneDark,
  catppuccin,
  gruvbox,
  nord,
  solarized,
  light,
  solarizedLight,
  highContrast,
  colorBlind,
  devDesigned,
}

interface ThemeContextValue {
  theme: Theme
  themeKey: string
  setThemeKey: (key: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'retro-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? 'dracula'
    } catch {
      return 'dracula'
    }
  })

  const theme = themes[themeKey] ?? dracula

  const setThemeKey = useCallback((key: string) => {
    setThemeKeyState(key)
    try {
      localStorage.setItem(STORAGE_KEY, key)
    } catch {
      // localStorage unavailable
    }
  }, [])

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg
    document.body.style.color = theme.textPrimary
  }, [theme])

  const value = useMemo(
    () => ({ theme, themeKey, setThemeKey }),
    [theme, themeKey, setThemeKey],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    return { theme: dracula, themeKey: 'dracula', setThemeKey: () => {} }
  }
  return ctx
}
