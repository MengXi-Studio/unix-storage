# Top-level Functions

Top-level APIs operate on the **default instance** (prefix `mx_storage:`, built-in TTL never-expire). `import { set, get, ... } from '@/uni_modules/ux-storage'`.

## set

```ts
export function set(key: string, data: any | null, ttl: number | null): Promise<void>
```

Writes an entry (wrapped with an expiration timestamp).

| Argument | Type | Notes |
| --- | --- | --- |
| `key` | `string` | Business key (actual storage key = prefix + key; empty rejects with `ERR_PARAM`) |
| `data` | `any \| null` | Business data (any serializable value; null is legal but reads back as null, same as a miss) |
| `ttl` | `number \| null` | Expiration in ms; `null` falls back to the instance defaultTTL (built-in never-expire) |

## get

```ts
export function get<T>(key: string): Promise<T | null>
```

Reads an entry. Miss / expired resolves `null`, does not reject. The generic `T` is a static annotation only (data flows as `any` with `as` casts); on Kotlin prefer `JSON.parse<T>(JSON.stringify(raw))` for type restoration.

## remove

```ts
export function remove(key: string): Promise<void>
```

Removes a single entry.

## clear

```ts
export function clear(): Promise<void>
```

Clears the whole namespace: filtered by prefix, removed one by one — **never touches other data**.

## info

```ts
export function info(): Promise<StorageInfo>
```

Storage info (raw `uni.getStorageInfo` structure; keys are platform-wide, not namespace-filtered — use `keys()` for the namespace view).

## keys

```ts
export function keys(): Promise<Array<string>>
```

Keys of this namespace, with the prefix stripped.

## clearExpired

```ts
export function clearExpired(): Promise<number>
```

Sweeps expired records in this namespace and returns the removed count.

## configureStorage

```ts
export const configureStorage: ConfigureStorage = function (defaults: StorageDefaults): void
```

Overrides the **default instance's** global defaults; a `null` field means "keep the built-in default".

```ts
configureStorage({ keyPrefix: null, defaultTTL: 60_000 } as StorageDefaults)
```

## createStorage

```ts
export const createStorage: CreateStorage = function (defaults: StorageDefaults | null): StorageInstance
```

Creates an instance (mirrors `axios.create`); `defaults` of `null` applies all built-in defaults. The returned instance matches the default instance exactly — see [StorageInstance](./instance).

## Entry constants

| Constant | Value | Notes |
| --- | --- | --- |
| `DEFAULT_KEY_PREFIX` | `'mx_storage:'` | Default key prefix |
| `STORAGE_ERR_SUBJECT` | `'unix-storage'` | Fixed StorageError.errSubject value |
