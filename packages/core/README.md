**中文** | [English](./README-en.md)

# @meng-xi/unix-storage

为 uni-app x 提供功能完善的本地缓存库（UTS 编写，一套 API 多端覆盖）。

基于 `uni.setStorage` 系列原生 API，提供 **Promise 化、TTL 过期、key 前缀命名空间、多实例** 能力；底层不重造存储栈，UTS 源码分发（Web / 小程序 → JS，Android → Kotlin，iOS → Swift），由 uni-app x 编译链现场编译。

## 为什么是 unix-storage

直接用 `uni.setStorage` 写业务，回调包装、过期轮转、key 命名防冲突、`clear` 误伤框架数据……每一项都要自己封装。unix-storage 把这些重复劳动收敛成一套库：

- **写过 axios？** 多实例（`createStorage` 对标 `axios.create`）、统一错误结构、三级配置合并心智完全对齐，看一眼 API 就能上手；
- **多端发布？** `uni.setStorage` 系列全端统一，库内确定性实现抹平剩余差异（如原生 `getStorage` 未命中的 fail 形态）；
- **在意数据安全？** key 前缀命名空间隔离，`clear` / 清理只作用于本命名空间，默认前缀规避 `uni-` / `dcloud_` 保留前缀。

## 特性

- **Promise 化** - `set` / `get` / `remove` / `clear` / `info` / `keys` / `clearExpired` 全量 async/await；未命中 / 已过期返回 `null` 不 reject
- **TTL 过期管理** - `set(key, data, ttl)` 毫秒级过期；读取惰性判断（过期即移除）；`clearExpired()` 全量扫描返回清理条数；TTL 三级回退（调用级 `ttl` → 实例 `defaultTTL` → 内置永不过期）
- **key 前缀命名空间** - 默认前缀 `mx_storage:`；`keys()` 剥前缀返回原始 key；`clear()` 仅清理本命名空间；非法保留前缀操作期 `ERR_PARAM` 拦截
- **多实例** - `createStorage(defaults)` 创建前缀 / TTL 隔离的实例；`configureStorage` 配置默认实例全局默认
- **统一可预测的错误结构** - `StorageError`（`ERR_PARAM` / `ERR_NATIVE`），原生 `errCode` 经 `nativeErrCode` 原值透传，`key` 挂载关联业务 key
- **兼容策略** - 读到非本库格式的数据按「无过期」原样返回，不报错不误删
- **强类型 UTS** - 配置字段 `| null` 空安全兜底，错误码字面量联合类型；`get<T>` 泛型静态标注

## 安装

**npm**——安装后将包内容同步到工程 `uni_modules/mx-storage/`（编译器不扫描 node_modules）：

```bash
pnpm add @meng-xi/unix-storage
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-storage uni_modules/mx-storage
```

> `packages/core` 为标准 **uni_modules UTS 插件**（`utssdk/` 官方目录结构 + `interface.uts` 对外声明），业务侧从 `@/uni_modules/mx-storage` 导入。

## 快速开始

### 1. 默认实例开箱即用

```uts
import { set, get } from '@/uni_modules/mx-storage'

// TTL 1 小时；null = 永不过期（或沿用实例 defaultTTL）
await set('token', { value: 'xxx' } as TokenInfo, 3600_000)

// 未命中 / 已过期返回 null，不 reject
const token = await get('token')

// 类型还原（UTSJSONObject 读回，官方路径）
const restored = JSON.parse<TokenInfo>(JSON.stringify(token))
```

### 2. TTL 与清理

```uts
import { set, get, remove, clearExpired } from '@/uni_modules/mx-storage'

await set('session', data, 60_000) // 60 秒过期
await get('session') // 过期：惰性移除并返回 null

const count = await clearExpired() // 全量扫描，返回清理条数
await remove('session') // 移除指定 key
```

### 3. 命名空间与多实例

```uts
import { keys, clear, createStorage } from '@/uni_modules/mx-storage'
import type { StorageDefaults } from '@/uni_modules/mx-storage'

await keys() // 本命名空间 key（剥前缀后返回原始 key）
await clear() // 仅清理本命名空间，不触碰其他数据

// 多实例隔离（前缀 / defaultTTL 独立）
const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
await cacheStore.set('user:1', user, null)
```

### 4. 统一错误处理

```uts
import { set } from '@/uni_modules/mx-storage'
import type { StorageError } from '@/uni_modules/mx-storage'

set('', data, null).catch((err) => {
	const e = err as StorageError
	// e.code: 'ERR_PARAM'（key 为空 / keyPrefix 保留前缀）| 'ERR_NATIVE'（原生失败）
	// e.errSubject 固定 'unix-storage'；e.nativeErrCode 原生 errCode 原值透传；e.key 关联业务原始 key
})
```

## 平台支持

| 平台       | 状态                                              |
| ---------- | ------------------------------------------------- |
| Web        | ✅ 22 项功能验证日志全部通过                       |
| 微信小程序 | 代码全端同构，待实测                               |
| Android    | 代码全端同构，待真机实测                           |
| iOS / 鸿蒙 | 代码已适配，受环境限制暂未实测                     |

## 相关链接

- [发布说明 versions/0.1.0.md](https://github.com/MengXi-Studio/unix-storage/blob/main/versions/0.1.0.md)
- [示例工程 packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/main/packages/playground)
- [设计文档 docs/design/store.md](https://github.com/MengXi-Studio/unix-storage/tree/main/docs/design)

欢迎反馈与共建：[GitHub](https://github.com/MengXi-Studio/unix-storage)
