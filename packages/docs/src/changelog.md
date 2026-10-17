# 更新日志

## [0.1.0] - 2026-10-15

首个可用版本：以 `uni.setStorage` 系列为唯一底层依赖的 uni-app x 本地缓存库，不重造存储栈，将业务每次都要手写的过期管理、key 命名规范、异步编排、多实例隔离收敛为一套 axios 心智的 API。

### 新增

- **Promise 化全量 API**：`set` / `get<T>` / `remove` / `clear` / `info` / `keys` / `clearExpired` 全部 async/await；未命中与已过期返回 `null` 不 reject（原生 `getStorage` 的 `data not found` fail 在 adapter 层统一转译为未命中语义）
- **TTL 过期管理**：record 包裹 `{ data, expire }` 过期时间戳，读取惰性判断（`Date.now() > expire` 即移除并返回 `null`）；`clearExpired()` 扫描本命名空间返回清理条数；三级回退：调用级 `ttl` → 实例 `defaultTTL` → 内置永不过期
- **key 前缀命名空间**：默认前缀 `mx_storage:` 规避 `uni-` / `dcloud_` 保留前缀；非法保留前缀在操作期以 `ERR_PARAM` 拦截；`keys()` 剥前缀返回原始 key；`clear` 按前缀过滤逐个移除，仅清理本命名空间
- **默认实例 + 多实例**：默认实例开箱即用，全局默认经 `configureStorage` 配置；`createStorage(defaults)` 创建前缀 / TTL 隔离的实例，心智对标 `axios.create`，实例 `setConfig` 覆盖自身默认
- **统一错误结构 [`StorageError`](/api/types)**：`ERR_PARAM` / `ERR_NATIVE` 字面量联合错误码；`errSubject` 固定 `unix-storage`；原生 `errCode` 经 `nativeErrCode` 原值透传不翻译；`key` 携带关联业务 key
- **兼容策略**：非本库格式数据（业务直写原生 API 的存量）按「无过期」原样返回，不报错不误删
- **类型安全**：配置字段 `| null` 空安全兜底（null 沿用内置默认），`get<T>` 泛型静态标注，类型定义经插件入口转发

### 平台支持

- **Web**：编译产物验证通过，22 项功能验证日志全部通过（基础存取 / TTL / 命名空间与多实例 / 全局配置 / clearExpired / 错误路径六个验证页）
- **Android**：云打包 release 编译零错误（Kotlin 编译链打通），真机用例验证待进行
- **微信小程序**：代码全端同构（`uni.setStorage` 系列全端统一），待实测
- **iOS / 鸿蒙**：代码已适配，受环境限制暂未实测（iOS 需 macOS、鸿蒙需 DevEco Studio）

### 相关链接

- [示例项目 packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/master/packages/playground)（首页导航 + 六个功能验证页，HBuilderX 发行 Web / 云打包验证）
- [设计文档 docs/design/store.md](https://github.com/MengXi-Studio/unix-storage/tree/master/docs/design)
