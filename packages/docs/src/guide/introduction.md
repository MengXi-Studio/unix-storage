# 介绍

`@meng-xi/unix-storage`（uni_modules 插件 id：`ux-storage`）是为 uni-app x 打造的功能完善的本地缓存库。它不重造存储栈——以 `uni.setStorage` 系列原生 API 为唯一底层依赖，在此之上补齐业务真正需要的能力：**Promise 化、TTL 过期、key 前缀命名空间、多实例**。

UTS 源码分发（Web / 小程序 → JS，Android → Kotlin，iOS → Swift），由 uni-app x 编译链现场编译，全端同一套代码。

## 为什么需要它

直接使用 `uni.setStorage` 系列原生 API 时，业务通常要自己解决这些问题：

| 原生 API 的痛点 | unix-storage 的答案 |
| --- | --- |
| 回调风格（success / fail），异步编排繁琐 | 全 API Promise 化，`await` 一路到底 |
| 没有 TTL，过期逻辑业务自己写 | `set(key, data, ttl)` 毫秒级过期 + 读时惰性判断 + `clearExpired()` 全量清理 |
| key 全局共享，多业务互相踩踏 | `keyPrefix` 命名空间，默认 `mx_storage:`，读写清理全按前缀隔离 |
| 单一全局存储，无法按业务拆分配置 | `createStorage` 多实例（对标 `axios.create`），前缀 / 默认 TTL 独立 |
| 未命中走 fail（`data not found`），每个调用点都要兜 | adapter 层统一转译为「resolve(null)」，未命中不是错误 |
| 错误形态不统一 | 统一 `StorageError`（`ERR_PARAM` / `ERR_NATIVE`），`errSubject` 可过滤来源 |

## 特性总览

- **Promise 化**：`set` / `get` / `remove` / `clear` / `info` / `keys` / `clearExpired` 全部返回 Promise
- **TTL 过期**：调用级 → 实例级 → 内置三级回退；读时惰性过期 + 主动扫描清理
- **命名空间**：实际存储 key = `keyPrefix + key`；`keys()` 剥前缀返回原始 key
- **多实例**：`createStorage(defaults)` 创建隔离实例，与默认实例完全同构
- **统一错误**：`StorageError` 携带 `code` / `errSubject` / `nativeErrCode` / `key`
- **兼容存量**：业务直写 `uni.setStorage` 的数据原样返回，不报错、不误删
- **全端同构**：纯编排层、无平台目录端，一套 UTS 源码走遍 uni-app x 全端

## 它不做什么

明确的 V1 边界（设计决策，非遗漏）：

- **不做 LRU 自动淘汰**：容量由业务通过 `info()` 自管
- **不做内存双引擎**：直接读写原生存储，无内存缓存层
- **不提供同步 API**：统一 Promise 形态，避免同步 / 异步双轨心智

## 下一步

- [安装](./installation)：npm 安装与 uni_modules 同步
- [快速开始](./getting-started)：5 分钟跑通第一个存取
