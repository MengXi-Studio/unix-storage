import { defineConfig } from 'vite'
import uniPkg from '@dcloudio/vite-plugin-uni'

// vite-plugin-uni 为 CJS 导出（__esModule + default），Node 22.23 + vite 5.2.8
// config bundle 互操作下 `import uni from ...` 拿到的命名空间不含可调用绑定，
// 须显式取 .default（unix-storage 实测，unix-request 同环境复现）
const uni = (uniPkg as any).default ?? uniPkg

export default defineConfig({
	plugins: [uni()]
})
