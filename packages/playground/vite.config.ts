import { defineConfig, type Plugin } from 'vite'
import uniDefault from '@dcloudio/vite-plugin-uni'
import { routeGen } from './uni_modules/ux-router/plugins/index.mjs'

// ESM 加载时默认导出是模块命名空间对象，真正的函数在 .default 上
const uni = (uniDefault as unknown as { default?: typeof uniDefault }).default ?? uniDefault

/**
 * uni-uts-v1 genInitCode 的 StringLiteral 缺引号官方 bug 修正：
 * 入口 index.uts 的 export const 字符串常量（如 DEFAULT_KEY_PREFIX = 'mx_storage:'）
 * 在 ?uts-proxy 中被生成为裸值（export const DEFAULT_KEY_PREFIX = mx_storage:），
 * 值不是合法标识符时 rollup 解析报 Expected a semicolon。
 * 本插件在 uts 代理生成后、rollup 解析前为裸值补引号；
 * 官方修复 genInitCode（JSON.stringify 字面量）后可移除。
 * HBuilderX 与 npm 双编译链均会加载本 vite 配置，一处修复两链生效。
 * 注意：重构 vite.config.ts 时请勿移除本插件（2026-10-17 云打包复验曾因移除复发）。
 */
function utsProxyStringLiteralFix(): Plugin {
	return {
		name: 'fix-uts-proxy-string-literal',
		enforce: 'post',
		transform(code: string, id: string) {
			if (!id.endsWith('?uts-proxy')) {
				return null
			}
			let touched = false
			const fixed = code.replace(/^(export const [A-Za-z_$][\w$]* = )([^'"\d].*)$/gm, (line, head: string, value: string) => {
				const raw = value.trim()
				// 跳过合法字面量与函数代理行：布尔/空值、含引号、含函数调用的行（/*#__PURE__*/ initUTSProxyFunction(...)）
				if (raw == 'true' || raw == 'false' || raw == 'null' || raw.includes('(') || raw.includes('"') || raw.includes("'")) {
					return line
				}
				touched = true
				return head + JSON.stringify(raw)
			})
			return touched ? { code: fixed, map: null } : null
		}
	}
}

export default defineConfig({
	plugins: [
		routeGen({
			verbose: true,
			pages: {
				pagesDir: 'pages',
				subPackages: [{ root: 'pages-sub', dir: 'pages-sub' }],
				entryPage: 'pages/index/index',
				dts: 'define-uni-page.d.ts'
			},
			router: {
				outputPath: 'router/routes.gen.uts',
				importFrom: '@/uni_modules/ux-router/utssdk/index.uts',
				dts: 'route-name.gen.d.ts'
			}
		}),

		utsProxyStringLiteralFix(),

		uni()
	]
})
