# Types

Public types are re-exported through the plugin entry (`import type { ... } from '@/uni_modules/ux-storage'`), with the plugin's `utssdk/interface.uts` as the single source of truth (inline declarations, required by uts-proxy parsing and HBuilderX hints).

## StorageErrorCode

```ts
/** Unified error codes (literal union; native fail errCode passes through untouched via nativeErrCode) */
export type StorageErrorCode = 'ERR_PARAM' | 'ERR_NATIVE'
```

## StorageError

```ts
export type StorageError = {
	/** Library error code (literal union) */
	code: StorageErrorCode
	/** Fixed subject for business-side filtering */
	errSubject: string
	/** Error description */
	errMsg: string
	/** Native fail errCode passed through; null for library errors */
	nativeErrCode: number | null
	/** Related business key (prefix not included; null for key-independent errors) */
	key: string | null
}
```

## StorageDefaults

```ts
/** Global / instance defaults; a null field means "keep the built-in default" */
export type StorageDefaults = {
	/** Key prefix (built-in default 'mx_storage:'; reserved uni- / dcloud_ prefixes are forbidden) */
	keyPrefix: string | null
	/** Default TTL in ms (null = never expire) */
	defaultTTL: number | null
}
```

## StorageInfo

```ts
/** Storage info (raw uni.getStorageInfo structure; keys are platform-wide) */
export type StorageInfo = {
	keys: Array<string>
	/** Current usage (KB) */
	currentSize: number
	/** Capacity limit (KB) */
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

See [StorageInstance](./instance) for details.

## ConfigureStorage / CreateStorage

```ts
/** configureStorage function type (default instance global defaults) */
export type ConfigureStorage = (defaults: StorageDefaults) => void

/** createStorage function type (multi-instance factory; null defaults apply built-ins) */
export type CreateStorage = (defaults: StorageDefaults | null) => StorageInstance
```

::: warning UTS typing rules
Object types are always `type` (object literals cannot be assigned to interfaces); nullable values use `| null` (no undefined); error codes are literal unions instead of enums. Build config objects as `configureStorage({ ... } as StorageDefaults)`.
:::
