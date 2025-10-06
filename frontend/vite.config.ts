import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure NODE_ENV is properly set for Logger dead code elimination
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/auth': path.resolve(__dirname, './src/auth'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@/contexts': path.resolve(__dirname, './src/contexts')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove Logger.debug calls completely in production
        pure_funcs: ['Logger.debug', 'Logger.info', 'Logger.perf'],
        drop_debugger: true,
      },
    },
    rollupOptions: {
      // Exclude legacy components from build
      external: (id) => id.includes('/_legacy/'),
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Firebase services
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/functions',
            'firebase/storage',
            'firebase/analytics'
          ],

          // UI and Icon libraries
          'ui-vendor': ['lucide-react', '@headlessui/react'],

          // PDF and document libraries
          'pdf-vendor': ['jspdf', 'html2canvas'],

          // Utility libraries
          'utils-vendor': ['date-fns'],

          // Split dashboard components by role (reduces initial load)
          'business-owner-dashboard': [
            './src/components/dashboard/BusinessOwnerDashboardSection'
          ],
          'hr-dashboard': [
            './src/components/dashboard/HRDashboardSection'
          ],
          'hod-dashboard': [
            './src/components/dashboard/HODDashboardSection'
          ],
          'dashboard-router': [
            './src/components/dashboard/DashboardRouter'
          ],

          // Warning system components
          'warning-components': [
            './src/components/warnings/ReviewDashboard'
          ]
        }
      }
    },
    target: 'esnext',
  }
})