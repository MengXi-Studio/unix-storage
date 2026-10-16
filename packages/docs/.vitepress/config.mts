import { defineConfig } from 'vitepress'

// GitHub Pages 项目页：仓库 unix-storage → base 必须为 /unix-storage/
export default defineConfig({
	lang: 'zh-CN',
	title: 'unix-storage',
	description: '为 uni-app x 提供功能完善的本地缓存库：Promise 化 / TTL 过期 / key 命名空间 / 多实例',
	base: '/unix-storage/',
	head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
	themeConfig: {
		siteTitle: 'unix-storage',
		nav: [
			{ text: '指南', link: '/guide/getting-started', activeMatch: '/guide/' },
			{ text: 'API', link: '/api/functions', activeMatch: '/api/' },
			{ text: '发布说明', link: '/release/0.1.0' }
		],
		sidebar: {
			'/guide/': [
				{
					text: '指南',
					items: [
						{ text: '快速开始', link: '/guide/getting-started' },
						{ text: 'TTL 过期管理', link: '/guide/ttl' },
						{ text: '命名空间与多实例', link: '/guide/namespace' },
						{ text: '统一错误处理', link: '/guide/error-handling' },
						{ text: '平台支持', link: '/guide/platform' }
					]
				}
			],
			'/api/': [
				{
					text: 'API',
					items: [
						{ text: '顶层函数', link: '/api/functions' },
						{ text: 'StorageInstance 实例', link: '/api/instance' },
						{ text: '类型定义', link: '/api/types' }
					]
				}
			],
			'/release/': [
				{
					text: '发布说明',
					items: [{ text: 'v0.1.0', link: '/release/0.1.0' }]
				}
			]
		},
		socialLinks: [{ icon: 'github', link: 'https://github.com/MengXi-Studio/unix-storage' }],
		footer: {
			message: '基于 MIT 许可发布',
			copyright: 'Copyright © 2026 MengXi Studio'
		},
		outline: { level: [2, 3], label: '本页目录' },
		docFooter: { prev: '上一页', next: '下一页' },
		lastUpdated: {
			text: '最后更新于',
			formatOptions: {
				dateStyle: 'short',
				timeStyle: 'medium'
			}
		},
		returnToTopLabel: '回到顶部',
		search: {
			provider: 'local',
			options: {
				translations: {
					button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
					modal: {
						noResultsText: '没有找到结果',
						resetButtonTitle: '清除查询',
						footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
					}
				}
			}
		}
	}
})
