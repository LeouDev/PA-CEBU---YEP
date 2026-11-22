import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Browser-safe values derived from the Neon vars that `neon deploy` writes to .env.local.
// The realtime secret and database URL never reach the bundle.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const rsvpUrl = env.VITE_RSVP_URL || (env.NEON_BRANCH_ID && env.NEON_FUNCTION_HOST_SUFFIX
    ? `https://${env.NEON_BRANCH_ID}-rsvp${env.NEON_FUNCTION_HOST_SUFFIX}` : '')
  return {
    plugins: [react()],
    base: './',
    define: {
      'import.meta.env.VITE_RSVP_URL': JSON.stringify(rsvpUrl),
      'import.meta.env.VITE_REALTIME_URL': JSON.stringify(env.VITE_REALTIME_URL || env.NEON_REALTIME_URL || ''),
    },
  }
})
