# TTL Expiration

unix-storage implements millisecond TTL through record wrapping: `set` stores business data inside a `{ data, expire }` timestamp wrapper, reads are **lazily checked** (`Date.now() > expire` → removed and returns `null`), and `clearExpired()` sweeps the whole namespace.

## Setting a TTL

The third `ttl` argument of `set` is the expiration in milliseconds; `null` means "fall back to the instance defaultTTL":

```ts
import { set, get } from '@/uni_modules/ux-storage'

await set('session', data, 60_000) // expires in 60s
await set('theme', 'dark', null)   // fall back to the instance defaultTTL (built-in = never expire)

await get('session') // expired: lazily removed, resolves null, does not reject
```

## Three-level TTL fallback

The effective TTL falls back through "call-level → instance → built-in", mirroring the unix-request / axios merging mental model:

| Priority | Source | Notes |
| --- | --- | --- |
| 1 | Call-level `ttl` | Passed explicitly to `set(key, data, ttl)` (non-null) |
| 2 | Instance `defaultTTL` | Configured via `createStorage` / `configureStorage` |
| 3 | Built-in default | `null` = never expire |

```ts
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

// Instance defaultTTL of 5 minutes: every set without an explicit ttl expires in 5 minutes
const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
await cacheStore.set('user:1', user, null)      // expires in 5 minutes
await cacheStore.set('user:2', user, 3_600_000) // call-level override: 1 hour
```

## Full sweep

Lazy expiration only triggers on reads; expired entries that are never read again keep occupying capacity. `clearExpired()` scans every key in the current namespace, removes expired records, and returns the removed count:

```ts
import { clearExpired } from '@/uni_modules/ux-storage'

const count = await clearExpired() // removed entries in this namespace
console.log(`Removed ${count} expired entries`)
```

::: warning Sweep scope
Like `clear()`, `clearExpired()` **only touches the current instance's namespace** (filtered by keyPrefix) — it never touches other namespaces or data written directly through native APIs.
:::

## Compatibility policy

Data not written by this library (legacy entries written straight through `uni.setStorage`) is returned **as-is** and treated as never-expiring: no errors, no accidental removal. Detection requires "an object containing both data / expire fields, where expire is number | null".
