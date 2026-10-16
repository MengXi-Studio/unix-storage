# Namespaces & Multiple Instances

## Key-prefix namespace

Every read/write uses the actual storage key = `keyPrefix + key`. The default prefix is `mx_storage:`, avoiding the reserved `uni-` / `dcloud_` platform prefixes; **invalid reserved prefixes are rejected with `ERR_PARAM` at operation time** (`createStorage` / `setConfig` are synchronous void and cannot reject).

```ts
import { set, keys, clear } from '@/uni_modules/ux-storage'

await set('user:1', user, null) // actual storage key = 'mx_storage:user:1'

await keys()   // ['user:1'] — original keys with the prefix stripped
await clear()  // clears only this namespace, removing filtered keys one by one
```

::: tip Working with native APIs
`info()` returns the raw `uni.getStorageInfo` structure (keys are platform-wide, not namespace-filtered); use `keys()` for the namespace view. Data across namespaces and business domains stays invisible to each other.
:::

## Multiple instances

`createStorage(defaults)` creates an isolated instance (prefix / defaultTTL), mirroring `axios.create`; the default instance works out of the box, and both return the exact same `StorageInstance` shape:

```ts
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
const draftStore = createStorage({ keyPrefix: 'draft:', defaultTTL: null } as StorageDefaults)

await cacheStore.set('user:1', user, null) // mx_storage:... and api_cache:... never see each other
await draftStore.set('page:1', draft, null)

await cacheStore.clear() // removes api_cache:* only; draft:* survives untouched
```

## Updating instance config

An instance's `setConfig` overrides that instance's defaults without affecting others:

```ts
cacheStore.setConfig({ keyPrefix: 'api_cache_v2:', defaultTTL: 60_000 } as StorageDefaults)
```

## Semantics at a glance

| Semantic | Behavior |
| --- | --- |
| Actual storage key | `keyPrefix + key` |
| `keys()` | Keys of this namespace, prefix stripped |
| `clear()` | Clears only this namespace (filtered, removed one by one) |
| `clearExpired()` | Sweeps this namespace, returns removed count |
| `info()` | Raw `uni.getStorageInfo` structure (platform-wide keys) |
| Foreign-format data | Returned as-is, treated as never-expiring, no errors |
