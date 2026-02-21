import { describe, it, expect } from 'vitest'
import { themes, type Theme } from './ThemeContext'

const THEME_KEYS: (keyof typeof themes)[] = Object.keys(themes)

const REQUIRED_FIELDS: (keyof Theme)[] = [
  'name',
  'bg',
  'bgSecondary',
  'bgHover',
  'surface',
  'border',
  'textPrimary',
  'textSecondary',
  'textTertiary',
  'green',
  'red',
  'yellow',
  'blue',
  'purple',
  'cyan',
  'cursor',
  'dotRed',
  'dotYellow',
  'dotGreen',
  'swatches',
]

describe('themes', () => {
  it('includes light themes', () => {
    expect(themes).toHaveProperty('light')
    expect(themes).toHaveProperty('solarizedLight')
  })

  it('includes a high-contrast theme', () => {
    expect(themes).toHaveProperty('highContrast')
  })

  it('includes a color-blind-friendly theme', () => {
    expect(themes).toHaveProperty('colorBlind')
  })

  it('includes the dev-designed theme', () => {
    expect(themes).toHaveProperty('devDesigned')
  })

  it.each(THEME_KEYS)('theme "%s" has all required fields', (key) => {
    const theme = themes[key]
    for (const field of REQUIRED_FIELDS) {
      expect(theme).toHaveProperty(field)
    }
  })

  it.each(THEME_KEYS)('theme "%s" has a non-empty swatches array', (key) => {
    expect(themes[key].swatches.length).toBeGreaterThan(0)
  })

  it('light theme has light background', () => {
    expect(themes.light.bg).toBe('#ffffff')
    expect(themes.light.textPrimary).toBe('#1a1a1a')
  })

  it('solarizedLight theme has light background', () => {
    expect(themes.solarizedLight.bg).toBe('#fdf6e3')
    expect(themes.solarizedLight.textPrimary).toBe('#073642')
  })

  it('highContrast theme uses black background and white text', () => {
    expect(themes.highContrast.bg).toBe('#000000')
    expect(themes.highContrast.textPrimary).toBe('#ffffff')
  })

  it('devDesigned theme has blue background and red text', () => {
    expect(themes.devDesigned.bg).toBe('#0000aa')
    expect(themes.devDesigned.textPrimary).toBe('#ff0000')
  })
})
