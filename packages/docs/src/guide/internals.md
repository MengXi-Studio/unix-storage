# 实现原理

unix-storage 是纯编排层：以 `uni.setStorage` 系列原生 API 为唯一底层依赖，自身**无平台目录端**（该系列 API 全端统一，无需按平台分端实现）。理解管线有助于排查问题与评估边界。

## 三层结构

```
interface.uts   —— 对外类型与 API 声明（官方必需；类型唯一定义源）
index.uts       —— 跨平台根入口：对外 API 内联声明 + 转发到实现层
storage/*       —— 实现层（函数一律 Impl 后缀）
```

| 层 | 文件 | 职责 |
| --- | --- | --- |
| 声明 | `interface.uts` | `StorageError` / `StorageDefaults` / `StorageInstance` 等对外类型唯一定义源 |
| 入口 | `index.uts` | 顶层七函数 + `configureStorage` / `createStorage` 内联声明，转发到实现层 |
| 实现 | `storage/adapter.uts` | `uni.setStorage` 系列的手动 Promise 包装（唯一原生收敛点） |
| 实现 | `storage/record.uts` | record 包裹构造 / 探测 / 过期判断 |
| 实现 | `storage/ttl.uts` | TTL 三级回退解析、expire 计算、清理扫描 |
| 实现 | `storage/core.uts` | 七函数业务编排（key 归一化 → adapter → record / ttl） |
| 实现 | `storage/instance.uts` | 默认实例单例 + `createStorage` 多实例工厂 |

## 写入管线：set

```
set(key, data, ttl)
  → normalizeKey：key 判空 + 前缀合法性校验（fail-fast 抛 ERR_PARAM）
  → resolveTTL：调用级 ttl → 实例 defaultTTL → 内置 null
  → buildRecord：包裹 { data, expire }（expire = Date.now() + ttl；null = 永不过期）
  → setStorageRaw：uni.setStorage 写入包裹后的 record
```

实际存储的值不是业务数据本身，而是 `{ data, expire }` 包裹——TTL 无需额外索引，读时自证。

## 读取管线：get

```
get(key)
  → normalizeKey
  → getStorageRaw（uni.getStorage）
      · fail 且 errMsg 含 'data not found' → resolve(null)（未命中转译）
      · 其余 fail → reject ERR_NATIVE
  → detectRecord：探测是否本库 record 格式
      · 非本库格式 → 原样返回（兼容业务直写 uni.setStorage 的存量数据）
  → isRecordExpired：Date.now() > expire 即过期
      · 过期 → 惰性移除并 resolve(null)（移除失败不阻塞 null 返回）
      · 未过期 → resolve(record.data)
```

**惰性过期**：过期判断只发生在读取时，无后台定时器；未被再次读取的过期数据靠 `clearExpired()` 主动清理。

## 命名空间实现

- 实际存储 key = `keyPrefix + key`，拼接在 core 层 `normalizeKey` 完成，adapter 不感知前缀
- `keys()` / `clear()` / `clearExpired()` 经 `uni.getStorageInfoSync().keys` 拿**全端全量 key**，再按 `startsWith(prefix)` 过滤出本命名空间，`keys()` 返回前再剥前缀
- `clear()` 对过滤后的 key 逐个 `removeStorage` 链式删除，任一失败整体 reject（已删项不回滚）
- `clearExpired()` 逐 key 读原值 → record 探测 → 过期判断，命中才移除（非本库格式直接跳过，不误删外部数据）

## 前缀校验为什么在操作期

`createStorage` / `setConfig` 是同步 void 函数，**无法 reject**；`uni-` / `dcloud_` 保留前缀不在这里报错，而是记下非法配置，在该实例的**每次操作**（normalizeKey / effectivePrefix）统一以 `ERR_PARAM` 拦截。

## 多实例隔离

`createStorage` 返回的实例方法通过闭包持有各自的 `StorageCore`（仅含 `defaults`），配置全隔离；默认实例是模块级单例 `defaultCore`，`configureStorage` 写的正是它的 defaults。

## UTS 工程红线（跨语言编译的坑）

- 插件内所有 `.uts` 文件同属一个 Kotlin package：同名 top-level 符号会触发导出符号静默重整（`__1`），故实现函数一律 **Impl 后缀**、内部常量一律 **BUILTIN_ 前缀**
- uts-proxy V1 只解析入口 `index.uts` 的内联 `export function` / `export const`，`export { x } from` 转发链对外不可见——所以对外 API 全部内联声明
- 错误码用字面量联合 type 而非 enum（UTS enum 无法跨 uts-proxy）
- 配置 / 入参字段值可空（`| null`），实现层统一判空兜底，无 undefined
