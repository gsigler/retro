import { execSync, spawn } from 'node:child_process'
import detect from 'detect-port'

const apiPort = await detect(3000)
const webPort = await detect(5173)
const appUrl = `http://localhost:${webPort}`
const apiUrl = `http://localhost:${apiPort}/api`
const callbackUrl = `http://localhost:${apiPort}/api/auth/google/callback`

console.log(`Starting API on port ${apiPort}, Web on port ${webPort}`)

execSync('docker compose up -d --wait db', { stdio: 'inherit' })
execSync('prisma generate --schema apps/api/prisma/schema.prisma', {
  stdio: 'inherit',
})

const api = `PORT=${apiPort} APP_URL=${appUrl} GOOGLE_CALLBACK_URL=${callbackUrl} nest start -w -c apps/api/nest-cli.json -p apps/api/tsconfig.json --preserveWatchOutput`
const web = `VITE_API_URL=${apiUrl} vite apps/web --clearScreen false --port ${webPort}`

spawn('concurrently', ['-n', 'api,web', '-c', 'blue,magenta', api, web], {
  stdio: 'inherit',
}).on('exit', (code) => process.exit(code ?? 0))
