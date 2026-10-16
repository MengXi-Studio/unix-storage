# Basic Usage

The default instance works out of the box. Seven top-level functions cover every storage scenario, and all of them return Promises.

## Writing: set

```ts
import { set } from '@/uni_modules/ux-storage'

await set('theme', 'dark', null)          // null: fall back to the instance defaultTTL (built-in = never expire)
await set('session', sessionData, 60_000) // expires in 60 seconds

// Any serializable value: string / number / boolean / object / array
await set('count', 42, null)
await set('user:1', { id: 1, name: 'mx' }, null)
```

Passing `null` as `data` is legal, but reading it back is indistinguishable from a miss (both resolve `null`) — avoid storing null in practice.

## Reading: get

```ts
import { get } from '@/uni_modules/ux-storage'

const theme = await get('theme') // resolves the value; null on miss / expiration

if (theme == null) {
	// Missed or expired — take the fallback path
}
```

::: tip A miss is not an error
Native `getStorage` fails on missing keys ("data not found"); the adapter has already translated that into `resolve(null)`, so business code only needs a null check.
:::

## Removing: remove

```ts
import { remove } from '@/uni_modules/ux-storage'

await remove('session') // removing a non-existent key does not throw
```

## Namespace view: keys

```ts
import { keys } from '@/uni_modules/ux-storage'

const list = await keys() // ['theme', 'user:1'] — this namespace's keys, prefix stripped
```

## Clearing: clear / clearExpired

```ts
import { clear, clearExpired } from '@/uni_modules/ux-storage'

await clear()                  // clears this namespace only, never touches other prefixes
const n = await clearExpired() // sweeps this namespace, removes expired records, returns the count
```

## Storage info: info

```ts
import { info } from '@/uni_modules/ux-storage'

const storageInfo = await info()
// storageInfo.keys — platform-wide keys (not namespace-filtered)
// storageInfo.currentSize — current usage (KB)
// storageInfo.limitSize — capacity limit (KB)
```

::: tip info vs keys
`info()` returns the raw `uni.getStorageInfo` structure (platform-wide keys); use `keys()` for the namespace view.
:::

## Global config & multiple instances

- `configureStorage(defaults)`: overrides the default instance's global defaults (e.g. once in `App.uvue` onLaunch)
- `createStorage(defaults)`: creates an isolated instance (independent prefix / default TTL) — see [Namespaces & Instances](./namespace)
