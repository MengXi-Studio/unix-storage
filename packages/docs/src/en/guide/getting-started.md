# Getting Started

`@meng-xi/unix-storage` is a fully-featured local storage library for uni-app x: built on the native `uni.setStorage` API family, it provides **Promise-based APIs, TTL expiration, key-prefix namespacing, and multiple instances**. The underlying storage stack is not reinvented; UTS source is distributed (Web / Mini-program → JS, Android → Kotlin, iOS → Swift) and compiled on the fly by the uni-app x toolchain.

## Installation

**npm** — after installing, sync the package into your project's `uni_modules/ux-storage/` (the compiler does not scan node_modules):

```bash
pnpm add @meng-xi/unix-storage
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-storage uni_modules/ux-storage
```

> `packages/core` is a standard **uni_modules UTS plugin** (official `utssdk/` layout + `interface.uts` declarations). Import from `@/uni_modules/ux-storage` in your code.

## Default instance, ready out of the box

```ts
import { set, get } from '@/uni_modules/ux-storage'

// TTL 1 hour; null = never expire (or fall back to the instance defaultTTL)
await set('token', { value: 'xxx' } as TokenInfo, 3600_000)

// Miss / expired resolves null, does not reject
const token = await get('token')

// Type restoration (reads back as UTSJSONObject, official path)
const restored = JSON.parse<TokenInfo>(JSON.stringify(token))
```

::: tip About generics
`get<T>` is a static annotation only — data flows as `any` with `as` casts, no runtime instantiation. On Web `as` works directly; on Kotlin prefer the official `JSON.parse<T>(JSON.stringify(raw))` path to avoid ClassCastException risks.
:::

## Global defaults

`configureStorage` configures the default instance's global defaults (e.g. once in `App.uvue` onLaunch); a `null` field means "keep the built-in default":

```ts
import { configureStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

configureStorage({
	keyPrefix: null, // null keeps the built-in default 'mx_storage:'
	defaultTTL: null // null = never expire
} as StorageDefaults)
```

## Next steps

- [TTL Expiration](./ttl): expiration semantics and sweeping
- [Namespaces & Instances](./namespace): proper data isolation
- [Error Handling](./error-handling): the StorageError shape and error codes
