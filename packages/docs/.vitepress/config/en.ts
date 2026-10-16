import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/unix-storage/en/'
export const META_TITLE = 'Unix Storage'
export const META_DESCRIPTION = 'A full-featured local storage library for uni-app x'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	/** 网站配置 描述 */
	description: META_DESCRIPTION,

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
			text: 'Suggest changes to this page'
		},

		/** 大纲标题 */
		outlineTitle: 'Contents of this page',

		/** 本地搜索（英文默认，覆盖 shared 的中文翻译） */
		search: {
			provider: 'local'
		},

		/** 导航栏 */
		nav: [
			{ text: 'Guide', link: '/en/guide/getting-started' },
			{ text: 'API', link: '/en/api/functions' },
			{ text: 'Changelog', link: '/en/changelog' },
			{
				text: 'Links',
				items: [
					{ text: 'Discussions', link: 'https://github.com/MengXi-Studio/unix-storage/discussions' },
					{ text: 'Releases', link: 'https://github.com/MengXi-Studio/unix-storage/releases' }
				]
			}
		],

		sidebar: {
			'/en/guide/': [
				{
					text: 'Getting Started',
					items: [{ text: 'Quick Start', link: '/en/guide/getting-started' }]
				},
				{
					text: 'Core Features',
					items: [
						{ text: 'TTL Expiration', link: '/en/guide/ttl' },
						{ text: 'Namespaces & Instances', link: '/en/guide/namespace' }
					]
				},
				{
					text: 'Advanced',
					items: [
						{ text: 'Error Handling', link: '/en/guide/error-handling' },
						{ text: 'Platform Support', link: '/en/guide/platform' }
					]
				}
			],
			'/en/api/': [
				{
					text: 'Core API',
					items: [
						{ text: 'Top-level Functions', link: '/en/api/functions' },
						{ text: 'StorageInstance', link: '/en/api/instance' }
					]
				},
				{
					text: 'Types',
					items: [{ text: 'Type Definitions', link: '/en/api/types' }]
				}
			]
		}
	}
}
