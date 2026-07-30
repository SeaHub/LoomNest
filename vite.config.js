import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  base: process.env.GITHUB_ACTIONS && repository ? `/${repository}/` : '/',
  plugins: [vue()],
});
