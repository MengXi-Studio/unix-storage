import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/unix-storage/'
export const META_TITLE = 'Unix Storage'
export const META_DESCRIPTION = '为 uni-app x 提供功能完善的本地缓存库'

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	/** 网站配置 描述 */
	description: META_DESCRIPTION,

	/** 网站配置 头信息 */
	head: [
		['meta', { property: 'og:url', content: META_URL }],
		['meta', { property: 'og:description', content: META_DESCRIPTION }],
		['meta', { property: 'twitter:url', content: META_URL }],
		['meta', { property: 'twitter:title', content: META_TITLE }],
		['meta', { property: 'twitter:description', content: META_DESCRIPTION }]
	],

	/** 网站主题配置 */
	themeConfig: {
		/** 编辑链接 */
		editLink: {
			pattern: 'https://github.com/MengXi-Studio/unix-storage/edit/main/packages/docs/:path',
			text: '对本页提出修改建议'
		},

		/** 大纲标题 */
		outlineTitle: '本页内容',

		/** 导航栏 */
		nav: [
			{ text: '指南', link: '/guide/getting-started' },
			{ text: 'API', link: '/api/functions' },
			{ text: '更新日志', link: '/changelog' },
			{
				text: '相关链接',
				items: [
					{ text: 'Discussions', link: 'https://github.com/MengXi-Studio/unix-storage/discussions' },
					{ text: 'Releases', link: 'https://github.com/MengXi-Studio/unix-storage/releases' }
				]
			}
		],

		sidebar: {
			'/guide/': [
				{
					text: '入门',
					items: [{ text: '快速开始', link: '/guide/getting-started' }]
				},
				{
					text: '核心功能',
					items: [
						{ text: 'TTL 过期管理', link: '/guide/ttl' },
						{ text: '命名空间与多实例', link: '/guide/namespace' }
					]
				},
				{
					text: '进阶',
					items: [
						{ text: '统一错误处理', link: '/guide/error-handling' },
						{ text: '平台支持', link: '/guide/platform' }
					]
				}
			],
			'/api/': [
				{
					text: '核心 API',
					items: [
						{ text: '顶层函数', link: '/api/functions' },
						{ text: 'StorageInstance 实例', link: '/api/instance' }
					]
				},
				{
					text: '类型',
					items: [{ text: '类型定义', link: '/api/types' }]
				}
			]
		}
	}
}
