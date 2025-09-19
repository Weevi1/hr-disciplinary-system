import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    rollupOptions: {
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
          
          // Split large component bundles
          'dashboard-components': [
            './src/components/dashboard/DashboardRouter',
            './src/components/dashboard/HRDashboardSection',
            './src/components/dashboard/HODDashboardSection'
          ],
          
          'warning-components': [
            './src/components/warnings/ReviewDashboard'
          ]
        }
      }
    },
    target: 'esnext',
    minify: true
  }
})