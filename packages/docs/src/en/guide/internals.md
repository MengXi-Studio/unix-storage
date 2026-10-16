# Implementation Notes

unix-storage is a pure orchestration layer: the native `uni.setStorage` API family is its only underlying dependency, and it has **no per-platform directories** (that API family is unified across platforms, so no per-platform implementations are needed). Understanding the pipeline helps with debugging and boundary assessment.

## Three layers

```
interface.uts   — public types & API declarations (officially required; single source of truth for types)
index.uts       — cross-platform root entry: inline public API declarations + forwarding to the implementation
storage/*       — implementation layer (functions carry the Impl suffix)
```

| Layer | File | Responsibility |
| --- | --- | --- |
| Declaration | `interface.uts` | Single source of truth for public types: `StorageError` / `StorageDefaults` / `StorageInstance` etc. |
| Entry | `index.uts` | Inline declarations of the seven top-level functions + `configureStorage` / `createStorage`, forwarding to the implementation |
| Impl | `storage/adapter.uts` | Manual Promise wrapping over the `uni.setStorage` family (the only native convergence point) |
| Impl | `storage/record.uts` | Record wrapping / detection / expiration checks |
| Impl | `storage/ttl.uts` | TTL three-level fallback, expire computation, sweeping |
| Impl | `storage/core.uts` | Business orchestration of the seven functions (key normalization → adapter → record / ttl) |
| Impl | `storage/instance.uts` | Default instance singleton + the `createStorage` multi-instance factory |

## Write pipeline: set

```
set(key, data, ttl)
  → normalizeKey: empty-key check + prefix validation (fail-fast ERR_PARAM)
  → resolveTTL: call-level ttl → instance defaultTTL → built-in null
  → buildRecord: wrap as { data, expire } (expire = Date.now() + ttl; null = never expire)
  → setStorageRaw: uni.setStorage writes the wrapped record
```

What actually gets stored is not the raw business data but the `{ data, expire }` wrapper — TTL needs no extra index; the record proves itself at read time.

## Read pipeline: get

```
get(key)
  → normalizeKey
  → getStorageRaw (uni.getStorage)
      · fail with 'data not found' in errMsg → resolve(null) (miss translation)
      · other fails → reject ERR_NATIVE
  → detectRecord: is this the library's record format?
      · foreign format → returned as-is (legacy data written directly via uni.setStorage)
  → isRecordExpired: Date.now() > expire means expired
      · expired → lazily removed, resolves null (removal failure does not block the null)
      · valid → resolve(record.data)
```

**Lazy expiration**: the expiration check only happens on reads — no background timers; expired entries that are never read again are removed by an explicit `clearExpired()` sweep.

## Namespacing internals

- The actual storage key = `keyPrefix + key`, joined in the core layer's `normalizeKey`; the adapter never sees the prefix
- `keys()` / `clear()` / `clearExpired()` fetch the **platform-wide key list** via `uni.getStorageInfoSync().keys`, filter by `startsWith(prefix)`, and `keys()` strips the prefix before returning
- `clear()` removes the filtered keys one by one through chained `removeStorage` calls; any failure rejects the whole operation (already-removed keys are not rolled back)
- `clearExpired()` reads each key's raw value → record detection → expiration check, removing only confirmed hits (foreign-format entries are skipped, never accidentally deleted)

## Why prefix validation happens at operation time

`createStorage` / `setConfig` are synchronous void functions — they **cannot reject**. Reserved prefixes (`uni-` / `dcloud_`) therefore do not fail there; the invalid config is recorded and every subsequent operation on that instance (normalizeKey / effectivePrefix) intercepts uniformly with `ERR_PARAM`.

## Multi-instance isolation

Instance methods returned by `createStorage` close over their own `StorageCore` (holding only `defaults`), keeping configs fully isolated; the default instance is the module-level singleton `defaultCore`, and `configureStorage` writes exactly that.

## UTS engineering red lines (cross-language compilation pitfalls)

- All `.uts` files in the plugin share one Kotlin package: same-named top-level symbols trigger silent export-symbol mangling (`__1`), hence the **Impl suffix** for functions and the **BUILTIN_ prefix** for internal constants
- uts-proxy v1 only parses the inline `export function` / `export const` in the entry `index.uts`; `export { x } from` re-export chains are invisible externally — hence all public APIs are declared inline
- Error codes are literal union types, not enums (UTS enums cannot cross uts-proxy)
- Config / argument fields are nullable (`| null`); the implementation layer normalizes nulls — no undefined
