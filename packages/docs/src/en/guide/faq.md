# FAQ

## Can I mix this with native `uni.setStorage` APIs?

Yes. The library only claims the namespace defined by `keyPrefix`; native reads/writes on other keys are unaffected. Data not written by this library is returned as-is under a "never expires" policy. Mind the direction: **reading this library's keys through native APIs** returns the `{ data, expire }` wrapper — take `.data` yourself.

## What are the capacity limits per platform?

About 5MB on H5, about 10MB on Mini Programs; on Web, `uni.getStorageInfoSync().limitSize` returns `Number.MAX_VALUE` (no limit concept). Read it at runtime via `info()` and manage capacity in business code (the library does no LRU eviction).

## Why does the get generic still need JSON.parse restoration?

Typed objects read back as `UTSJSONObject` after the storage serialization round trip (official uni-app x "type data storage" docs), and the `get<T>` generic is a static annotation with no runtime instantiation. Restore uniformly via the official `JSON.parse<T>(JSON.stringify(raw))` path — see [Type Restoration](./type-restoration).

## Will clear() delete other features' data?

No. `clear()` / `clearExpired()` fetch the platform-wide key list via `getStorageInfoSync().keys`, filter with `startsWith(keyPrefix)`, and remove only this namespace's keys. Other prefixes and data written directly by business code are left untouched.

## Why does a miss resolve null instead of rejecting?

Native `getStorage` fails on missing keys ("data not found"); the adapter translates exactly that case into `resolve(null)` — a miss is a normal business branch, not an exception. Rejection happens only for invalid arguments (`ERR_PARAM`) and underlying storage failures (`ERR_NATIVE`).

## Why doesn't createStorage reject an invalid prefix immediately?

`createStorage` / `setConfig` are synchronous void functions and cannot reject; a reserved prefix (`uni-` / `dcloud_`) is intercepted with `ERR_PARAM` on every subsequent operation of that instance — see [Namespaces & Instances](./namespace).

## When will Mini Programs / Android be supported?

The codebase is identical across platforms (pure orchestration layer, no per-platform directories), and all 22 verification logs pass on Web. WeChat Mini Program and Android are pending real testing; iOS / HarmonyOS are untested due to environment limits. You can verify yourself with the repo's [packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/main/packages/playground) — see [Platform Support](./platform).

## Will you add sync APIs / an in-memory engine / LRU?

Explicitly out of scope for v1 (design decisions, not omissions): a unified Promise shape to avoid a dual-track mental model, no in-memory dual engine, no LRU eviction. Bring feature requests to [Discussions](https://github.com/MengXi-Studio/unix-storage/discussions).
