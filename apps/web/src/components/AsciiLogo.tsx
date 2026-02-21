import { useTheme } from '@/contexts/ThemeContext'

interface AsciiLogoProps {
  size?: 'sm' | 'lg'
}

const logo = `
 ██████╗ ███████╗████████╗██████╗  ██████╗
 ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗
 ██████╔╝█████╗     ██║   ██████╔╝██║   ██║
 ██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║
 ██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝
 ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝
`.trimStart()

export function AsciiLogo({ size = 'sm' }: AsciiLogoProps) {
  const { theme } = useTheme()

  return (
    <pre
      className="box-drawing"
      style={{
        color: theme.purple,
        fontSize: size === 'lg' ? 14 : 8,
        lineHeight: 1.15,
        margin: 0,
        userSelect: 'none',
      }}
    >
      {logo}
    </pre>
  )
}
