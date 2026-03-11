import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('apps', 'api', 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join('apps', 'api', 'prisma', 'migrations'),
  },
})
