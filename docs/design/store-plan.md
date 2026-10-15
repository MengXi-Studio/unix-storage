# unix-storage 可执行设计方案（v0.1.0）

> 依据：[store.md](./store.md)（uni-app x 缓存 API 调研结论）+ [unix-request](https://github.com/MengXi-Studio/unix-request) 架构范式。
> 状态：**已确认（2026-10-15）** —— 疑问清单 §9 已全部作答，按 §7 步骤执行。

---

## 1. 定位与范围

**定位**：uni-app x 本地缓存/存储库。npm 包名 `@meng-xi/unix-storage`，uni_modules 插件 id `mx-storage`（对齐 unix-request 的 `@meng-xi/unix-request` / `mx-request` 约定）。

**技术底座**：以 `uni.setStorage` 系列 API 为唯一底层依赖，不重造存储栈。库的价值 = 弥补原生 API 在**过期管理、命名规范、异步体验、类型安全**上的不足（store.md 调研结论收敛）。

**V1 收敛四件事**：

1. **Promise 化** —— 回调风格包装为 async/await，统一错误 reject
2. **TTL 过期** —— record 包裹时间戳，读取惰性判断 + 全量扫描清理
3. **key 前缀命名空间** —— 默认前缀规避 `uni-` / `dcloud_` 保留前缀，clear/清理只作用于本命名空间
4. **多实例** —— `createStorage(defaults)` 工厂 + 默认实例开箱即用（对标 axios.create / createRequest 心智）

**明确不做（范围外）**：

| 项 | 理由 |
| --- | --- |
| 请求缓存插件 | 属 unix-request 生态插件层职责，后续独立版本 |
| LRU 容量自动淘汰 | 平台容量上限差异大（H5 5MB / 小程序 10MB），成本高收益低；提供 `info()` 由业务自管 |
| 内存缓存双引擎 | 过度设计，本地存储场景收益存疑 |
| pinia 状态持久化 | uni-app x 不支持 pinia（store.md 提到的 unistorage 方案属 uni-app 旧生态） |

---

## 2. 架构对齐（unix-request 范式映射）

| unix-request | unix-storage | 说明 |
| --- | --- | --- |
| `packages/core`（npm 包，本身即标准 uni_modules 目录） | `packages/core` | 同构 |
| `utssdk/index.uts` 入口编排（内联 `export function` / `export const`） | 同 | 红线继承 |
| `utssdk/interface.uts` 对外类型内联声明 | 同 | uts-proxy V1 只解析此文件 |
| `utssdk/request/{core,instance,shortcut,...}` 实现层 | `utssdk/storage/{core,instance,adapter,ttl,...}` | 实现函数一律 `Impl` 后缀 |
| `createRequest` / `defaultCore` | `createStorage` / `defaultCore` | 多实例 + 模块级单例 |
| `RequestError` 统一错误 | `StorageError` | errSubject 固定 `unix-storage` |
| `scripts/sync-uni-modules.mjs`（dest `mx-request`） | 同名脚本（dest `mx-storage`） | KEEP 逻辑一致 |
| `packages/playground` + `versions/0.1.0.md` + 双语 README | 同构 | 工程化对齐 |

**存储无平台差异，无需平台目录端**：`uni.setStorage` 系列全端统一（与 `uni.request` 同理，unix-request 也是纯编排层无平台目录）。

---

## 3. 仓库结构（目标）

```
unix-storage/
├── package.json                    # 根：pnpm workspace 声明
├── pnpm-workspace.yaml             # packages/*
├── tsconfig.json / .npmrc / .prettierrc / .editorconfig   # 已有
├── versions/
│   └── 0.1.0.md                    # 发布说明（unix-request 同款）
├── scripts/
│   └── sync-uni-modules.mjs        # core → playground/uni_modules/mx-storage
├── packages/
│   ├── core/                       # @meng-xi/unix-storage（即 uni_modules 插件目录）
│   │   ├── package.json            # main: utssdk/index.uts
│   │   ├── README.md / README-en.md / license.md
│   │   └── utssdk/
│   │       ├── index.uts           # 入口编排：内联声明全部对外 API + export type 转发
│   │       ├── interface.uts       # 对外类型内联声明（uts-proxy 唯一解析点）
│   │       └── storage/
│   │           ├── types/index.uts         # 实现层类型（从 interface.uts 转发，满足名义类型系统）
│   │           ├── constants/defaults.uts  # BUILTIN_ 前缀内置默认
│   │           ├── adapter.uts             # uni storage 原生 API 的 Promise 包装
│   │           ├── record.uts              # StorageRecord 包裹 / 解包 / 过期判断
│   │           ├── ttl.uts                 # 惰性过期 + clearExpired 全量扫描
│   │           ├── core.uts                # set/get/... 业务编排（normalize → adapter → ttl）
│   │           ├── instance.uts            # defaultCore / createStorageImpl / buildInstance
│   │           └── utils/error.uts         # ERR_ 前缀错误构建
│   └── playground/                 # uni-app x 验证工程
│       ├── manifest.json / pages.json / main.uts
│       ├── pages/index/index.uvue  # 验证页面（按功能分组）
│       └── uni_modules/mx-storage/ # sync 脚本产物（package.json + changelog.md 手工维护）
└── docs/design/                    # 本文档 + store.md
```

playground 创建方式：复制 unix-request 的 playground 配置骨架（manifest.json / main.uts / pages.json）裁剪改造，页面全部重写。

---

## 4. 对外 API 设计（草案）

### 4.1 类型声明（interface.uts 内联）

```uts
/** 统一错误码（字面量联合，UTS enum 无法跨 uts-proxy —— 红线继承） */
export type StorageErrorCode = 'ERR_PARAM' | 'ERR_NATIVE'

/** 统一错误结构（对标 RequestError 模式） */
export type StorageError = {
	code: StorageErrorCode
	errSubject: string          // 固定 'unix-storage'
	errMsg: string
	nativeErrCode: number | null  // 原生 fail errCode 原值透传
	key: string | null
}

/** 实例/全局默认配置（字段全可空，null = 沿用内置默认 —— 红线继承：可选字段生成 null-safe 编码） */
export type StorageDefaults = {
	/** key 前缀（内置默认 'mx_storage:'；禁止 uni- / dcloud_ 开头） */
	keyPrefix: string | null
	/** 默认 TTL 毫秒（null = 永不过期） */
	defaultTTL: number | null
}

/** 存储信息（uni.getStorageInfo 原样结构） */
export type StorageInfo = {
	keys: Array<string>
	currentSize: number
	limitSize: number
}

/** 多实例对象（createStorage 返回，与默认实例同构） */
export type StorageInstance = {
	set: (key: string, data: any | null, ttl: number | null) => Promise<void>
	get: (key: string) => Promise<any | null>       // 未命中/已过期返回 null，不 reject
	remove: (key: string) => Promise<void>
	clear: () => Promise<void>                      // 仅清理本命名空间
	info: () => Promise<StorageInfo>
	keys: () => Promise<Array<string>>              // 本命名空间的 key 列表（剥前缀后返回原始 key）
	clearExpired: () => Promise<number>             // 扫描本命名空间，返回清理条数
	setConfig: (defaults: StorageDefaults) => void
}
```

### 4.2 顶层 API（index.uts 内联声明）

```uts
/* 泛型 API：export function 具名声明（M4 云打包实证形态，红线继承） */
export function set(key: string, data: any | null, ttl: number | null): Promise<void>
export function get<T>(key: string): Promise<T | null>
export function remove(key: string): Promise<void>
export function clear(): Promise<void>
export function info(): Promise<StorageInfo>
export function keys(): Promise<Array<string>>
export function clearExpired(): Promise<number>

/* 非泛型 API：官方 const 模式 */
export const configureStorage: ConfigureStorage = function (defaults: StorageDefaults): void
export const createStorage: CreateStorage = function (defaults: StorageDefaults | null): StorageInstance
```

### 4.3 使用示例

```uts
import { set, get, createStorage } from '@/uni_modules/mx-storage'

// 默认实例开箱即用
await set('token', { value: 'xxx' } as TokenInfo, 3600_000)  // TTL 1 小时
const token = await get<TokenInfo>('token')                   // 过期/未命中 → null
await set('theme', 'dark', null)                              // 永不过期

// 多实例隔离（前缀独立，互不可见）
const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
await cacheStore.set('user:1', user, null)
```

### 4.4 关键语义约定

| 语义 | 约定 |
| --- | --- |
| TTL 合并 | 三级回退：调用级 `ttl` 参数 → 实例 `defaultTTL` → 内置（null 永不过期），对齐 unix-request 三级合并心智 |
| record 包裹 | `{ data: any, expire: number \| null }`（expire = 过期时间戳 ms），仅 set 路径写入 |
| 过期判断 | 惰性：get 时 `Date.now() > expire` 则移除并返回 null |
| key 命名空间 | 实际存储 key = `keyPrefix + key`；`keys()` 返回剥前缀的原始 key |
| clear 范围 | **仅清理本命名空间**（getStorageInfoSync().keys 过滤前缀后逐个 remove），不触碰其他数据 —— 待确认 Q4 |
| 兼容策略 | get 读到非 record 格式（非本库写入）的数据 → 按"无过期"原样返回，不报错 —— 待确认 Q5 |
| 泛型 | `get<T>` 仅静态标注，data 以 any 流转 + as 断言（unix-request 同款，无运行时实例化需求） |

---

## 5. UTS 红线继承清单（unix-request 实战沉淀）

1. 所有 `.uts` 同 Kotlin package：实现函数一律 `Impl` 后缀，内部同语义常量 `BUILTIN_` / `ERR_` 前缀，防导出符号静默重整（`__1`）
2. 禁止 `export { x } from` 转发链对外暴露 API；对外类型仅在 `interface.uts` 内联声明，实现层经 `storage/types/index.uts` 转发引用
3. 配置/入参类型除主键外全部可选（`?` + `| null`），实现层统一判空兜底
4. 错误码/枚举一律字面量联合 `type`，不用 UTS enum
5. 泛型 API 用顶层 `export function apiName<T>` 具名声明；非泛型用 `export const apiName: ApiType = function`
6. 对象类型一律 `type`（对象字面量不能赋给 interface）；嵌套结构提取独立 type；无 undefined（用 null）；条件语句必须布尔；`UTSJSONObject` 下标访问 + `as` 断言；无声明提升，先声明后使用

---

## 6. Spike 验证点（编码前完成，写入 LESSONS_LEARNED 前置证据）

| # | 验证项 | 方式 | 风险 |
| --- | --- | --- | --- |
| S1 | `uni.setStorage` 在 UTS 下的 Promise 形态是否原生可用；若不可用则确认 success/fail 回调手动包装方案 | playground 最小页 + HBuilderX 运行日志 | 低（unix-request core.uts 已有回调包装先例，直接沿用） |
| S2 | 任意 `type` 对象 set → get 往返：嵌套 type、null 字段、`UTSJSONObject` 读回 as 断言路径 | 同上 | 中（Kotlin 序列化往返是 TTL record 的前提） |
| S3 | `getStorageInfoSync().keys` 全量 key 遍历 + `String.startsWith` 前缀过滤（clearExpired / clear / keys 依赖） | 同上 | 低 |

---

## 7. 实施步骤（疑问作答确认后逐项执行）

| 步骤 | 内容 | 产出 |
| --- | --- | --- |
| P0 工程初始化 | 根 pnpm-workspace.yaml；packages/core 骨架（package.json / license / 双语 README 占位）；playground 从 unix-request 裁剪 | 可被 HBuilderX 打开的空工程 |
| P1 Spike | §6 三个验证点，playground 页面实测 | 验证结论写入 LESSONS_LEARNED |
| P2 core 实现 | interface.uts → index.uts → storage/* 全量实现（类型 → 常量 → adapter → record → ttl → core → instance） | core 完成 |
| P3 sync 脚本 | 复制 unix-request 脚本改 dest `mx-storage`；playground 侧手工 package.json（id: mx-storage）+ changelog.md | `pnpm sync:uni-modules` 可用 |
| P4 运行验证 | playground 验证页按功能分组（基础存取 / TTL / 前缀 / 多实例 / clearExpired / 错误路径）；HBuilderX CLI 运行（先按核心协议 §1.2 解析官方 CLI 文档再构造命令）；**app-android + web 两端**（Q6 结论） | DoD 全勾 |
| P5 文档收尾 | README / README-en / versions/0.1.0.md / changelog | 可发布状态 |

---

## 8. DoD（继承核心协议）

- [ ] HBuilderX 编译通过（app-android，无语法错误）
- [ ] 实际运行（HBuilderX CLI 拉取运行日志）
- [ ] 日志验证：set/get 往返、TTL 过期返回 null、clearExpired 计数、前缀隔离正确
- [ ] 控制台无运行时报错
- [ ] 临时调试日志已清理

---

## 9. 疑问清单（已作答 2026-10-15）

| # | 疑问 | 结论 |
| --- | --- | --- |
| Q1 | V1 功能范围 | ✅ 锁定：Promise 化 + TTL + 前缀命名空间 + 多实例；LRU / 内存双引擎 / 请求缓存 / pinia 持久化明确不做 |
| Q2 | 命名三件套 | 按默认：npm `@meng-xi/unix-storage`、插件 id `mx-storage`、errSubject `unix-storage` |
| Q3 | 同步族 API | ✅ V1 不提供，按需后补 |
| Q4 | `clear()` 语义 | ✅ 仅清理本命名空间（按 keyPrefix 过滤后逐个 remove） |
| Q5 | 非本库格式数据处理 | 按默认：原样返回，按无过期处理，不报错 |
| Q6 | 运行验证平台 | ✅ app-android + web 两端 |
| Q7 | 实例级 `defaultTTL` | 按默认：保留（与 keyPrefix 同属实例级心智） |
