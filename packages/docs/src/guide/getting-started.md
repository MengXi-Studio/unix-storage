# 快速开始

`@meng-xi/unix-storage` 是为 uni-app x 提供的功能完善的本地缓存库：基于 `uni.setStorage` 系列原生 API，提供 **Promise 化、TTL 过期、key 前缀命名空间、多实例** 能力。底层不重造存储栈，UTS 源码分发（Web / 小程序 → JS，Android → Kotlin，iOS → Swift），由 uni-app x 编译链现场编译。

## 安装

**npm**——安装后将包内容同步到工程 `uni_modules/ux-storage/`（编译器不扫描 node_modules）：

```bash
pnpm add @meng-xi/unix-storage
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-storage uni_modules/ux-storage
```

> `packages/core` 为标准 **uni_modules UTS 插件**（官方 `utssdk/` 目录结构 + `interface.uts` 对外声明），业务侧从 `@/uni_modules/ux-storage` 导入。

## 默认实例开箱即用

```ts
import { set, get } from '@/uni_modules/ux-storage'

// TTL 1 小时；null = 永不过期（或沿用实例 defaultTTL）
await set('token', { value: 'xxx' } as TokenInfo, 3600_000)

// 未命中 / 已过期返回 null，不 reject
const token = await get('token')

// 类型还原（UTSJSONObject 读回，官方路径）
const restored = JSON.parse<TokenInfo>(JSON.stringify(token))
```

::: tip 泛型说明
`get<T>` 仅静态标注，data 以 any 流转 + as 断言，无运行时实例化需求。Web 端 `as` 直接可用；Kotlin 端推荐用 `JSON.parse<T>(JSON.stringify(raw))` 官方路径还原，规避 ClassCastException 风险。
:::

## 全局默认配置

`configureStorage` 配置默认实例全局默认（如 App.uvue onLaunch 中配置一次）；字段为 `null` 表示沿用内置默认：

```ts
import { configureStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

configureStorage({
	keyPrefix: null, // null 沿用内置默认 'mx_storage:'
	defaultTTL: null // null 永不过期
} as StorageDefaults)
```

## 下一步

- [TTL 过期管理](/guide/ttl)：过期语义与清理扫描
- [命名空间与多实例](/guide/namespace)：数据隔离的正确姿势
- [统一错误处理](/guide/error-handling)：StorageError 结构与错误码
