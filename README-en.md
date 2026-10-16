[中文](./README.md) | **English**

<div align="center">
  <a href="https://github.com/MengXi-Studio/unix-storage">
    <img alt="MengXi Studio Logo" width="215" src="https://github.com/MengXi-Studio/unix-storage/blob/master/packages/docs/src/public/logo.png">
  </a>
  <a href="https://github.com/MengXi-Studio/unix-storage">
    <img alt="WeChat Official Account QR" width="215" src="https://github.com/MengXi-Studio/unix-storage/blob/master/packages/docs/src/public/QR_code.jpg">
  </a>
  <br>
  <h1>@meng-xi/unix-storage</h1>
  <p>A fully-featured local storage library for uni-app x (written in UTS, one API set for all platforms)</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/unix-storage.svg)](./license.md) [![npm](https://img.shields.io/npm/v/@meng-xi/unix-storage?color=blue)](https://www.npmjs.com/package/@meng-xi/unix-storage)
![npm](https://img.shields.io/npm/dt/@meng-xi/unix-storage?color=green)

</div>

## Why unix-storage

With raw `uni.setStorage`, you keep rewriting callback wrappers, expiration housekeeping, collision-safe key naming, and namespace-safe `clear` — then do it all over again in the next project. unix-storage converges all of this into one library:

- **Used axios?** Multiple instances (`createStorage` mirrors `axios.create`), a unified error structure, and three-level config merging — familiar at first glance;
- **Multi-platform?** The `uni.setStorage` family is unified across platforms and the library is a pure orchestration layer (no per-platform directories); remaining differences such as the fail shape of `getStorage` on cache miss are deterministically smoothed inside the library;
- **Care about data safety?** Key-prefix namespaces isolate domains: `clear` and sweeping only touch their own namespace, and the default prefix avoids the reserved `uni-` / `dcloud_` prefixes.

The native `uni.setStorage` API family is the only underlying dependency — the storage stack is not reinvented. UTS source is distributed (Web / Mini-program → JS, Android → Kotlin, iOS → Swift) and compiled on the fly by the uni-app x toolchain.

## Features

- **axios mindset, out of the box** - seven top-level functions (`set` / `get` / `remove` / `clear` / `info` / `keys` / `clearExpired`) on the default instance; `createStorage` for isolated instances, `configureStorage` for global defaults
- **TTL expiration** - `set(key, data, ttl)` with millisecond precision; lazy checks on read (expired entries are removed); `clearExpired()` sweeps and returns the removed count; three-level fallback (call-level `ttl` → instance `defaultTTL` → built-in never-expire)
- **Key-prefix namespace** - default prefix `mx_storage:`; `keys()` returns original keys with the prefix stripped; `clear()` only touches its own namespace; reserved prefixes are rejected with `ERR_PARAM` at operation time
- **A miss is not an error** - the native "data not found" fail is translated into `resolve(null)` at the adapter layer; business code only needs a null check instead of handling fail at every call site
- **Unified predictable errors** - `StorageError` (`ERR_PARAM` / `ERR_NATIVE`), native `errCode` passed through via `nativeErrCode`, `errSubject` for source filtering across libraries, `key` carrying the related business key
- **Legacy-friendly** - data not written by this library is returned as-is (treated as never-expiring), no errors, no accidental removal — migrate gradually without risk
- **Generics & type restoration** - `get<T>` static annotation; typed objects read back as `UTSJSONObject`, restored uniformly via the official `JSON.parse<T>(JSON.stringify(raw))` path
- **Strongly-typed UTS** - nullable-safe config fields (`| null`), literal-union error codes; identical codebase across platforms with no per-platform directories

## Installation

**npm** — after installing, sync the package into your project's `uni_modules/ux-storage/` (the compiler does not scan node_modules):

```bash
pnpm add @meng-xi/unix-storage
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-storage uni_modules/ux-storage
```

> `packages/core` is a standard **uni_modules UTS plugin** (official `utssdk/` layout + `interface.uts` declarations). Import from `@/uni_modules/ux-storage` in your code.

## Quick Start

### 1. Default instance, ready out of the box

```uts
import { set, get, configureStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

// Configure global defaults once at startup (e.g. App.uvue onLaunch; null keeps built-in defaults)
configureStorage({
	keyPrefix: null, // null keeps the built-in default 'mx_storage:'
	defaultTTL: null // null = never expire
} as StorageDefaults)

// TTL 1 hour; null = never expire (or fall back to the instance defaultTTL)
await set('token', { value: 'xxx' } as TokenInfo, 3600_000)

// Miss / expired resolves null, does not reject
const token = await get('token')

// Type restoration (reads back as UTSJSONObject, official path)
const restored = JSON.parse<TokenInfo>(JSON.stringify(token))
```

### 2. TTL and sweeping

```uts
import { set, get, remove, clearExpired } from '@/uni_modules/ux-storage'

await set('session', data, 60_000) // expires in 60s
await get('session') // expired: lazily removed, resolves null

const count = await clearExpired() // full sweep, returns removed count
await remove('session') // remove a single key
```

### 3. Namespaces and multiple instances

```uts
import { keys, clear, createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

await keys() // keys of this namespace (prefix stripped)
await clear() // only clears this namespace, never touches other data

// Isolated instances (independent prefix / defaultTTL)
const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
await cacheStore.set('user:1', user, null)
```

### 4. Unified error handling

```uts
import { set } from '@/uni_modules/ux-storage'
import type { StorageError } from '@/uni_modules/ux-storage'

set('', data, null).catch((err) => {
	const e = err as StorageError
	// e.code: 'ERR_PARAM' (empty key / reserved keyPrefix) | 'ERR_NATIVE' (native failure)
	// e.errSubject is always 'unix-storage'; e.nativeErrCode passes the native errCode through; e.key carries the business key
})
```

### Verification

The repo ships with a playground [packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/master/packages/playground). Its verification page logs `[verify]` output in six functional groups (basic CRUD / TTL / prefix namespace / multiple instances / clearExpired / error paths), with all 22 checks passing on Web:

```bash
pnpm install
cd packages/playground
pnpm build:web
npx serve --single dist/build/h5
```

For WeChat Mini Program / Android, open `packages/playground` in HBuilderX and run the same test suite.

## Community & Support

Want the design rationale and implementation details (record wrapping and lazy expiration, namespacing internals, UTS cross-language compilation pitfalls)? The WeChat Official Account「**梦曦工作室**」(MengXi Studio) publishes a series of deep dives — scan to follow:

<p align="center">
  <img alt="WeChat Official Account QR" width="180" src="https://github.com/MengXi-Studio/unix-storage/blob/master/packages/docs/src/public/QR_code.jpg">
</p>

- 📖 [Documentation](https://mengxi-studio.github.io/unix-storage/en/) (guide + API reference + changelog, bilingual)
- 🐛 [Issues](https://github.com/MengXi-Studio/unix-storage/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-storage/discussions)

## Exports

- APIs: `set` / `get` / `remove` / `clear` / `info` / `keys` / `clearExpired` / `configureStorage` / `createStorage`
- Constants: `DEFAULT_KEY_PREFIX` / `STORAGE_ERR_SUBJECT`
- Types: `StorageErrorCode` / `StorageError` / `StorageDefaults` / `StorageInfo` / `StorageInstance` / `ConfigureStorage` / `CreateStorage`

## Documentation

📖 The complete from-intro-to-mastery documentation (guide + API reference + changelog):

**[https://mengxi-studio.github.io/unix-storage/en/](https://mengxi-studio.github.io/unix-storage/en/)**

Suggested reading: start with the [Introduction](https://mengxi-studio.github.io/unix-storage/en/guide/introduction.html) and [Quick Start](https://mengxi-studio.github.io/unix-storage/en/guide/getting-started.html), then go deeper along
[Basic Usage](https://mengxi-studio.github.io/unix-storage/en/guide/basic-usage.html) → [TTL Expiration](https://mengxi-studio.github.io/unix-storage/en/guide/ttl.html) → [Namespaces & Instances](https://mengxi-studio.github.io/unix-storage/en/guide/namespace.html) →
[Error Handling](https://mengxi-studio.github.io/unix-storage/en/guide/error-handling.html); for API details see the [API Reference](https://mengxi-studio.github.io/unix-storage/en/api/functions.html).

## Changelog

📝 **[https://github.com/MengXi-Studio/unix-storage/blob/master/packages/docs/src/changelog.md](https://github.com/MengXi-Studio/unix-storage/blob/master/packages/docs/src/changelog.md)**

## License

[MIT](./license.md)
