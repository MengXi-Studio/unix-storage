[中文](./README.md) | **English**

# @meng-xi/unix-storage

A fully-featured local storage library for uni-app x (written in UTS, one API set for all platforms).

Built on top of the native `uni.setStorage` API family, providing **Promise-based APIs, TTL expiration, key-prefix namespacing, and multiple instances**. The underlying storage stack is not reinvented; UTS source is distributed (Web / Mini-program → JS, Android → Kotlin, iOS → Swift) and compiled on the fly by the uni-app x toolchain.

## Why unix-storage

With raw `uni.setStorage`, you keep rewriting callback wrappers, expiration housekeeping, collision-safe key naming, and namespace-safe `clear`. unix-storage converges all of this into one library:

- **Used axios?** Multiple instances (`createStorage` mirrors `axios.create`), a unified error structure, and three-level config merging — familiar at first glance;
- **Multi-platform?** The `uni.setStorage` family is unified across platforms; the library deterministically smooths the remaining differences (e.g. the fail shape of `getStorage` on cache miss);
- **Care about data safety?** Key-prefix namespaces isolate domains: `clear` and sweeping only touch their own namespace, and the default prefix avoids the reserved `uni-` / `dcloud_` prefixes.

## Features

- **Promise-based** - `set` / `get` / `remove` / `clear` / `info` / `keys` / `clearExpired`, all async/await; miss / expired resolves `null` instead of rejecting
- **TTL expiration** - `set(key, data, ttl)` with millisecond precision; lazy checks on read (expired entries are removed); `clearExpired()` sweeps and returns the number of removed entries; three-level TTL fallback (call-level `ttl` → instance `defaultTTL` → built-in never-expire)
- **Key-prefix namespace** - default prefix `mx_storage:`; `keys()` returns original keys with the prefix stripped; `clear()` only touches its own namespace; reserved prefixes are rejected with `ERR_PARAM` at operation time
- **Multiple instances** - `createStorage(defaults)` creates instances with isolated prefix / TTL; `configureStorage` configures the default instance
- **Unified predictable errors** - `StorageError` (`ERR_PARAM` / `ERR_NATIVE`), native `errCode` passed through via `nativeErrCode`, `key` carries the related business key
- **Compatibility policy** - data not written by this library is returned as-is (treated as never-expiring), no errors, no accidental removal
- **Strongly-typed UTS** - nullable-safe config fields (`| null`), literal-union error codes, `get<T>` generic static annotation

## Installation

**npm** — after installing, sync the package into your project's `uni_modules/mx-storage/` (the compiler does not scan node_modules):

```bash
pnpm add @meng-xi/unix-storage
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-storage uni_modules/mx-storage
```

> `packages/core` is a standard **uni_modules UTS plugin** (official `utssdk/` layout + `interface.uts` declarations). Import from `@/uni_modules/mx-storage` in your code.

## Quick Start

### 1. Default instance, ready out of the box

```uts
import { set, get } from '@/uni_modules/mx-storage'

// TTL 1 hour; null = never expire (or fall back to the instance defaultTTL)
await set('token', { value: 'xxx' } as TokenInfo, 3600_000)

// Miss / expired resolves null, does not reject
const token = await get('token')

// Type restoration (reads back as UTSJSONObject, official path)
const restored = JSON.parse<TokenInfo>(JSON.stringify(token))
```

### 2. TTL and sweeping

```uts
import { set, get, remove, clearExpired } from '@/uni_modules/mx-storage'

await set('session', data, 60_000) // expires in 60s
await get('session') // expired: lazily removed, resolves null

const count = await clearExpired() // full sweep, returns removed count
await remove('session') // remove a single key
```

### 3. Namespaces and multiple instances

```uts
import { keys, clear, createStorage } from '@/uni_modules/mx-storage'
import type { StorageDefaults } from '@/uni_modules/mx-storage'

await keys() // keys of this namespace (prefix stripped)
await clear() // only clears this namespace, never touches other data

// Isolated instances (independent prefix / defaultTTL)
const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
await cacheStore.set('user:1', user, null)
```

### 4. Unified error handling

```uts
import { set } from '@/uni_modules/mx-storage'
import type { StorageError } from '@/uni_modules/mx-storage'

set('', data, null).catch((err) => {
	const e = err as StorageError
	// e.code: 'ERR_PARAM' (empty key / reserved keyPrefix) | 'ERR_NATIVE' (native failure)
	// e.errSubject is always 'unix-storage'; e.nativeErrCode passes the native errCode through; e.key carries the business key
})
```

## Platform Support

| Platform    | Status                                                  |
| ----------- | ------------------------------------------------------- |
| Web         | ✅ All 22 verification logs passed                      |
| WeChat Mini | Same codebase for all platforms, pending testing        |
| Android     | Same codebase for all platforms, pending device testing |
| iOS / Harmony | Adapted, untested due to environment limits           |

## Links

- [Release notes versions/0.1.0.md](https://github.com/MengXi-Studio/unix-storage/blob/main/versions/0.1.0.md)
- [Playground packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/main/packages/playground)
- [Design doc docs/design/store.md](https://github.com/MengXi-Studio/unix-storage/tree/main/docs/design)

Feedback and contributions are welcome: [GitHub](https://github.com/MengXi-Studio/unix-storage)
