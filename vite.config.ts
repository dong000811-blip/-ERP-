import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 깃허브 페이지 루트 배포를 위해 base를 상대경로로 강제 고정
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 빌드 시 파일 이름에 해시가 붙어도 경로를 잘 찾도록 설정
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
