# 类型定义

对外类型经插件入口转发（`import type { ... } from '@/uni_modules/ux-storage'`），唯一定义源为插件 `utssdk/interface.uts`（内联声明，满足 uts-proxy 解析与 HBuilderX 语法提示）。

## StorageErrorCode

```ts
/** 统一错误码（字面量联合；原生 fail errCode 由 nativeErrCode 原值透传不翻译） */
export type StorageErrorCode = 'ERR_PARAM' | 'ERR_NATIVE'
```

## StorageError

```ts
export type StorageError = {
	/** 库内错误码（字面量联合） */
	code: StorageErrorCode
	/** 固定主题，便于业务过滤 */
	errSubject: string
	/** 错误描述 */
	errMsg: string
	/** 原生 fail errCode 原值透传，库内错误为 null */
	nativeErrCode: number | null
	/** 关联的业务原始 key（未含前缀；与 key 无关的错误为 null） */
	key: string | null
}
```

## StorageDefaults

```ts
/** 全局 / 实例默认配置；字段值 null 表示沿用内置默认 */
export type StorageDefaults = {
	/** key 前缀（内置默认 'mx_storage:'；禁止 uni- / dcloud_ 保留前缀开头） */
	keyPrefix: string | null
	/** 默认 TTL 毫秒（null = 永不过期） */
	defaultTTL: number | null
}
```

## StorageInfo

```ts
/** 存储信息（uni.getStorageInfo 原样结构；keys 为全端全量 key） */
export type StorageInfo = {
	keys: Array<string>
	/** 当前占用（KB） */
	currentSize: number
	/** 容量上限（KB） */
	limitSize: number
}
```

## StorageInstance

```ts
export type StorageInstance = {
	set: (key: string, data: any | null, ttl: number | null) => Promise<void>
	get: (key: string) => Promise<any | null>
	remove: (key: string) => Promise<void>
	clear: () => Promise<void>
	info: () => Promise<StorageInfo>
	keys: () => Promise<Array<string>>
	clearExpired: () => Promise<number>
	setConfig: (defaults: StorageDefaults) => void
}
```

详见 [StorageInstance 实例](/api/instance)。

## ConfigureStorage / CreateStorage

```ts
/** configureStorage 函数类型（默认实例全局默认配置） */
export type ConfigureStorage = (defaults: StorageDefaults) => void

/** createStorage 函数类型（多实例工厂，defaults 为 null 时全用内置默认） */
export type CreateStorage = (defaults: StorageDefaults | null) => StorageInstance
```

::: warning UTS 类型红线
对象类型一律 `type`（对象字面量不能赋给 interface）；字段值可空用 `| null`（无 undefined）；错误码用字面量联合而非 enum。业务侧构造配置对象时按 `configureStorage({ ... } as StorageDefaults)` 形态书写。
:::
