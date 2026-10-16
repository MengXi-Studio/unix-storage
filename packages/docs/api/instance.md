# StorageInstance 实例

`createStorage(defaults)` 返回的实例对象，与默认实例同构。方法闭包持有各自实例核心，实现多实例隔离。

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

## 方法

| 方法 | 签名 | 语义 |
| --- | --- | --- |
| `set` | `(key, data, ttl) => Promise<void>` | 写入（record 包裹过期时间戳；ttl null 沿用实例默认） |
| `get` | `(key) => Promise<any \| null>` | 读取；未命中 / 已过期返回 null，不 reject |
| `remove` | `(key) => Promise<void>` | 移除指定缓存 |
| `clear` | `() => Promise<void>` | 仅清理本命名空间（按前缀过滤后逐个移除） |
| `info` | `() => Promise<StorageInfo>` | 存储信息（`uni.getStorageInfo` 原样结构） |
| `keys` | `() => Promise<Array<string>>` | 本命名空间 key（剥前缀） |
| `clearExpired` | `() => Promise<number>` | 扫描清理本命名空间过期记录，返回条数 |
| `setConfig` | `(defaults) => void` | 覆盖实例默认配置 |

## 使用示例

```ts
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)

await cacheStore.set('user:1', user, null)   // 5 分钟过期（defaultTTL）
const user = await cacheStore.get('user:1')  // any | null

const list = await cacheStore.keys()         // ['user:1'] —— 剥前缀
const removed = await cacheStore.clearExpired()
await cacheStore.clear()                     // 只清 api_cache:*，其他命名空间不受影响

cacheStore.setConfig({ keyPrefix: 'api_cache_v2:', defaultTTL: 60_000 } as StorageDefaults)
```

::: tip 实例方法不提供泛型
实例 `get` 返回 `any | null`（data 以 any 流转）；泛型 `get<T>` 仅顶层 API 提供。业务侧按需 `JSON.parse<T>(JSON.stringify(raw))` 还原类型。
:::
