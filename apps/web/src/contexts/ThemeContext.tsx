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

export const themes: Record<string, Theme> = {
  dracula,
  oneDark,
  catppuccin,
  gruvbox,
  nord,
  solarized,
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
