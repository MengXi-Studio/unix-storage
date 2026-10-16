# StorageInstance

The object returned by `createStorage(defaults)`, shape-identical to the default instance. Each instance's methods close over its own core, giving per-instance isolation.

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

## Methods

| Method | Signature | Behavior |
| --- | --- | --- |
| `set` | `(key, data, ttl) => Promise<void>` | Writes (record-wrapped timestamp; ttl null falls back to the instance default) |
| `get` | `(key) => Promise<any \| null>` | Reads; miss / expired resolves null, does not reject |
| `remove` | `(key) => Promise<void>` | Removes a single entry |
| `clear` | `() => Promise<void>` | Clears only this namespace (filtered, removed one by one) |
| `info` | `() => Promise<StorageInfo>` | Storage info (raw `uni.getStorageInfo` structure) |
| `keys` | `() => Promise<Array<string>>` | Keys of this namespace (prefix stripped) |
| `clearExpired` | `() => Promise<number>` | Sweeps expired records in this namespace, returns the count |
| `setConfig` | `(defaults) => void` | Overrides the instance defaults |

## Example

```ts
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)

await cacheStore.set('user:1', user, null)   // expires in 5 minutes (defaultTTL)
const user = await cacheStore.get('user:1')  // any | null

const list = await cacheStore.keys()         // ['user:1'] — prefix stripped
const removed = await cacheStore.clearExpired()
await cacheStore.clear()                     // clears api_cache:* only; other namespaces untouched

cacheStore.setConfig({ keyPrefix: 'api_cache_v2:', defaultTTL: 60_000 } as StorageDefaults)
```

::: tip No generics on instance methods
Instance `get` returns `any | null` (data flows as `any`); the generic `get<T>` exists only on the top-level API. Restore types as needed via `JSON.parse<T>(JSON.stringify(raw))`.
:::
