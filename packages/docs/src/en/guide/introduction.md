# Introduction

`@meng-xi/unix-storage` (uni_modules plugin id: `ux-storage`) is a fully-featured local storage library for uni-app x. It does not reinvent the storage stack — the native `uni.setStorage` API family is its only underlying dependency, and on top of that it delivers what business code actually needs: **Promise-based APIs, TTL expiration, key-prefix namespacing, and multiple instances**.

UTS source is distributed (Web / Mini-program → JS, Android → Kotlin, iOS → Swift) and compiled on the fly by the uni-app x toolchain — one codebase for every platform.

## Why it exists

When using the native `uni.setStorage` API family directly, business code typically has to solve these problems itself:

| Native API pain point | unix-storage answer |
| --- | --- |
| Callback style (success / fail), tedious async orchestration | All APIs are Promise-based, `await` all the way |
| No TTL — expiration logic is hand-rolled | `set(key, data, ttl)` millisecond expiration + lazy read-time checks + `clearExpired()` sweeping |
| Keys are globally shared across features | `keyPrefix` namespacing, default `mx_storage:`, all reads/writes/clears isolated by prefix |
| One global store, no per-domain configuration | `createStorage` multiple instances (mirrors `axios.create`), independent prefix / default TTL |
| Misses go through fail (`data not found`), every call site needs handling | The adapter translates it into "resolve(null)" — a miss is not an error |
| Inconsistent error shapes | Unified `StorageError` (`ERR_PARAM` / `ERR_NATIVE`) with filterable `errSubject` |

## Feature overview

- **Promise-based**: `set` / `get` / `remove` / `clear` / `info` / `keys` / `clearExpired` all return Promises
- **TTL expiration**: call-level → instance-level → built-in three-level fallback; lazy expiration on read + active sweeping
- **Namespacing**: actual storage key = `keyPrefix + key`; `keys()` returns original keys with the prefix stripped
- **Multiple instances**: `createStorage(defaults)` creates isolated instances, identical in shape to the default instance
- **Unified errors**: `StorageError` carries `code` / `errSubject` / `nativeErrCode` / `key`
- **Legacy-friendly**: data written directly through `uni.setStorage` is returned as-is — no errors, no accidental removal
- **Cross-platform by construction**: a pure orchestration layer with no per-platform directories; one UTS codebase for every uni-app x target

## What it does not do

Explicit v1 boundaries (design decisions, not omissions):

- **No LRU eviction**: capacity is managed by the business via `info()`
- **No in-memory dual engine**: reads and writes hit native storage directly, no memory cache layer
- **No synchronous APIs**: a unified Promise shape, avoiding a sync/async dual-track mental model

## Next steps

- [Installation](./installation): npm install and uni_modules sync
- [Getting Started](./getting-started): your first read/write in 5 minutes
