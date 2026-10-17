# Changelog

## [0.1.0] - 2026-10-15

First usable version: a local storage library for uni-app x built on the native `uni.setStorage` API family without reinventing the storage stack — folding TTL expiration, key naming hygiene, async orchestration, and multi-instance isolation into one axios-minded API set.

### Added

- **Promise-based full API**: `set` / `get<T>` / `remove` / `clear` / `info` / `keys` / `clearExpired`, all async/await; miss and expired resolve `null` instead of rejecting (the native `getStorage` "data not found" fail is translated into miss semantics inside the adapter)
- **TTL expiration**: records wrap `{ data, expire }` timestamps, reads are lazily checked (`Date.now() > expire` → removed and returns `null`); `clearExpired()` sweeps the namespace and returns the removed count; three-level fallback: call-level `ttl` → instance `defaultTTL` → built-in never-expire
- **Key-prefix namespace**: default prefix `mx_storage:` avoids the reserved `uni-` / `dcloud_` prefixes; invalid prefixes are rejected with `ERR_PARAM` at operation time; `keys()` returns original keys with the prefix stripped; `clear` filters by prefix and removes one by one — only its own namespace
- **Default instance + multiple instances**: the default instance works out of the box with global defaults via `configureStorage`; `createStorage(defaults)` creates prefix / TTL isolated instances mirroring `axios.create`, each with its own `setConfig`
- **Unified error shape [`StorageError`](/en/api/types)**: literal-union codes `ERR_PARAM` / `ERR_NATIVE`; `errSubject` is always `unix-storage`; the native `errCode` passes through untouched via `nativeErrCode`; `key` carries the related business key
- **Compatibility policy**: foreign-format data (legacy entries written straight through native APIs) is returned as-is and treated as never-expiring — no errors, no accidental removal
- **Type safety**: nullable-safe config fields (`| null`, null keeps built-in defaults), `get<T>` generic static annotation, public types re-exported through the plugin entry

### Platform support

- **Web**: build verified, all 22 functional verification logs passed (six verification pages: basic I/O / TTL / namespace & instances / global config / clearExpired / error paths)
- **Android**: cloud packaging release compiles with zero errors (Kotlin toolchain unblocked); on-device case verification pending
- **WeChat Mini Program**: same codebase for all platforms (the `uni.setStorage` family is unified), pending testing
- **iOS / HarmonyOS**: adapted, untested due to environment limits (iOS needs macOS, HarmonyOS needs DevEco Studio)

### Links

- [Sample project packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/master/packages/playground) (home navigation + six feature pages, verified via HBuilderX web publish / cloud packaging)
- [Design doc docs/design/store.md](https://github.com/MengXi-Studio/unix-storage/tree/master/docs/design)
