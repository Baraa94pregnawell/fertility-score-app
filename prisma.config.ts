import { defineConfig } from 'prisma/config'
import path from 'node:path'

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: `file:${dbPath}`,
  },
})
