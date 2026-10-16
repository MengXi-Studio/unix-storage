/**
 * RouteNameMap 字面量类型增强（由 @meng-xi/unix-router/vite-plugin 生成）
 * 供 WEB 端 RouteName 类型推导；原生端 UTS 不支持 keyof 组合，仍为 string。
 */
import '@/uni_modules/ux-router/utssdk/index.uts'

declare module '@/uni_modules/ux-router/utssdk/index.uts' {
	interface RouteNameMap {
		/** unix-storage */
		home: 'pages/index/index'
		/** 基础存取 */
		basic: 'pages-sub/basic/basic'
		/** 清理过期记录 */
		'clear-expired': 'pages-sub/clear-expired/clear-expired'
		/** 全局配置 */
		configure: 'pages-sub/configure/configure'
		/** 错误路径 */
		errors: 'pages-sub/errors/errors'
		/** 前缀与多实例 */
		namespace: 'pages-sub/namespace/namespace'
		/** TTL 过期 */
		ttl: 'pages-sub/ttl/ttl'
	}
}
