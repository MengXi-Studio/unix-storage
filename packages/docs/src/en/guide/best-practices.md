# Best Practices

## Key naming

Use a "domain:object:id" segmented style so keys are self-describing and easy to troubleshoot:

```ts
await set('user:profile:1', profile, null) // user domain / profile / user id
await set('cart:items:1001', items, null)  // cart domain
```

- The top-level prefix is already handled by the instance's `keyPrefix` — do not repeat it in business keys
- With multiple instances, separate domains by prefix (`api_cache:` / `draft:`); with a single instance, separate by key segments

## TTL strategy

| Data type | Recommendation |
| --- | --- |
| Sessions / tokens / short-lived cache | Explicit short TTL (minutes), paired with lazy read-time expiration |
| Theme / language / user preferences | `null` (never expire); update proactively on version or user action |
| API response cache | Instance-level `defaultTTL` as the baseline; call-level ttl overrides for hot entries |

Expired data is never released if never read — for batch-expiration scenarios (e.g. response caches), call `clearExpired()` at a suitable moment:

```ts
// In App.uvue onShow, or when entering the cache page
const removed = await clearExpired()
```

## Instance partitioning

Create instances per business domain instead of sharing one global instance:

```ts
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

export const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
export const draftStore = createStorage({ keyPrefix: 'draft:', defaultTTL: null } as StorageDefaults)
```

- Export instances at module level for reuse instead of creating them ad hoc
- `clear()` wipes the instance's prefix domain — clean partitioning is what makes "clear this domain" safe

## Capacity self-management

The library does no LRU eviction (a v1 design decision); capacity limits differ per platform — see [Platform Support](./platform). High-frequency writers should observe usage proactively:

```ts
const storageInfo = await info()
console.log(storageInfo.currentSize, storageInfo.limitSize) // KB
```

- Mind the ~10MB Mini Program limit; consider splitting large objects across keys or moving them to files / the server
- On Web `limitSize` is `Number.MAX_VALUE`, but volume control is still good practice

## Coexisting with legacy data

- Legacy entries written straight through `uni.setStorage`: the library returns them **as-is without deleting**, so migration can be gradual
- Migration path: read the old key → `set` it into the library (gaining TTL) → remove the old key
- Reverse caution: values written by this library are `{ data, expire }` wrappers — **do not** read this library's keys through native APIs and treat the wrapper as business data

## Always restore types via the official path

Across all platforms, restore typed objects with `JSON.parse<T>(JSON.stringify(raw))` — see [Type Restoration](./type-restoration).
