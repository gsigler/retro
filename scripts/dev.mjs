import { execSync, spawn } from 'node:child_process'
import detect from 'detect-port'

const apiPort = await detect(3000)
const webPort = await detect(5173)

console.log(`Starting API on port ${apiPort}, Web on port ${webPort}`)

execSync('docker compose -p retro up -d --wait db', { stdio: 'inherit' })
execSync('prisma generate --schema apps/api/prisma/schema.prisma', {
  stdio: 'inherit',
})

const api = `PORT=${apiPort} nest start -w -c apps/api/nest-cli.json -p apps/api/tsconfig.json --preserveWatchOutput`
const web = `VITE_API_URL=http://localhost:${apiPort} vite apps/web --clearScreen false --port ${webPort}`

spawn('concurrently', ['-n', 'api,web', '-c', 'blue,magenta', api, web], {
  stdio: 'inherit',
}).on('exit', (code) => process.exit(code ?? 0))
