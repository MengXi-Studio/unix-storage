# 顶层函数

顶层 API 作用于**默认实例**（前缀 `mx_storage:`、TTL 内置永不过期）。`import { set, get, ... } from '@/uni_modules/ux-storage'`。

## set

```ts
export function set(key: string, data: any | null, ttl: number | null): Promise<void>
```

写入缓存（record 包裹过期时间戳）。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `key` | `string` | 业务 key（实际存储 key = 前缀 + key；空值 reject `ERR_PARAM`） |
| `data` | `any \| null` | 业务数据（任意可序列化值；null 合法，但读取与未命中同样返回 null） |
| `ttl` | `number \| null` | 过期毫秒；`null` 沿用实例 defaultTTL（内置永不过期） |

## get

```ts
export function get<T>(key: string): Promise<T | null>
```

读取缓存。未命中 / 已过期返回 `null`，不 reject。泛型 `T` 仅静态标注（data 以 any 流转 + as 断言）；Kotlin 端类型还原推荐 `JSON.parse<T>(JSON.stringify(raw))`。

## remove

```ts
export function remove(key: string): Promise<void>
```

移除指定缓存。

## clear

```ts
export function clear(): Promise<void>
```

清理本命名空间全部缓存：按前缀过滤后逐个移除，**不触碰其他数据**。

## info

```ts
export function info(): Promise<StorageInfo>
```

存储信息（`uni.getStorageInfo` 原样结构；keys 为全端全量 key，不做命名空间过滤——命名空间视角用 `keys()`）。

## keys

```ts
export function keys(): Promise<Array<string>>
```

本命名空间 key 列表，剥前缀后返回原始 key。

## clearExpired

```ts
export function clearExpired(): Promise<number>
```

扫描清理本命名空间已过期记录，返回清理条数。

## configureStorage

```ts
export const configureStorage: ConfigureStorage = function (defaults: StorageDefaults): void
```

覆盖**默认实例**全局默认配置；字段为 `null` 表示沿用内置默认。

```ts
configureStorage({ keyPrefix: null, defaultTTL: 60_000 } as StorageDefaults)
```

## createStorage

```ts
export const createStorage: CreateStorage = function (defaults: StorageDefaults | null): StorageInstance
```

创建缓存实例（对标 `axios.create`）；`defaults` 为 `null` 时全用内置默认。返回实例与默认实例同构，详见 [StorageInstance 实例](/api/instance)。

## 入口常量

| 常量 | 值 | 说明 |
| --- | --- | --- |
| `DEFAULT_KEY_PREFIX` | `'mx_storage:'` | 默认 key 前缀 |
| `STORAGE_ERR_SUBJECT` | `'unix-storage'` | 统一错误 errSubject 固定值 |
