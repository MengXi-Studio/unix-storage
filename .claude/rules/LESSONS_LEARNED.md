# 经验教训记录（Strict：仅记录经运行验证的坑）

## 2026-10-15 P0/P1 工程初始化 + Spike（HBuilderX 5.26 / Node v22.23.0 / Windows）

### 工程骨架（playground 裁剪自 unix-request）

1. **App.uvue 必须含 `<template>` 或非空 `<script>` 块**：仅 `<style>` 报「At least one <template> or <script> is required」；空 `<script setup lang="uts"></script>` 同样被剔除后报错。最小可用形态：`<script setup lang="uts"> onLaunch(() => {}) </script>`（App.uvue 内生命周期 onLaunch 全局可用，无需 import）。
2. **uni-app x 5.26 npm 链 web 产物目录为 `dist/build/h5`**（非旧版 `dist/build/web`）。

### vite / npm 构建链

3. **`import uni from '@dcloudio/vite-plugin-uni'` 在 Node 22.23 + vite 5.2.8 下报 `uni is not a function`**：vite config bundle 的 ESM-CJS 互操作拿到的命名空间只含 `runDev/runBuild/shouldMoveSourceMapFromCache/default`（CJS 包带 `__esModule: true`），可调用实现在 `.default`。修复：`const uni = (uniPkg as any).default ?? uniPkg`。unix-request 同环境复现同错（非本项目特有，怀疑 Node 版本升级所致，其历史构建环境 Node 版本更低）。
4. **playground tsconfig lib 仅 ESNext 无 DOM**，vite.config.ts 会被 uts 类型检查器扫描 —— config 内写 `console.log` 报 TS2584（warning 级不阻断构建），调试日志用完即删。
5. **`import { createSSRApp } from 'vue'` 曾报 warning「'vue' has no exported member named 'createVueApp'」**：与 App.uvue 空 script 问题同期出现，App.uvue 修复后 build 通过且 warning 未再阻断，主因为伴随错误（待 Android 链复核）。

### HBuilderX CLI（core-protocol §1.2 文档解析结论）

6. **命令形态（官方 cli/launch-app.md、logcat-app.md）**：`D:\HBuilderX\cli.exe launch app-android --project <项目名或绝对路径>`（HBuilderX 5.0+，纯 CLI 运行默认；`--compile true` 只编译）；`cli logcat app-android --project <...> --mode full|lastBuild|prevBuild`（默认 prevBuild，取上一轮构建日志；拿当次运行日志用 full）。运行前须 `cli open`，`cli devices list` 需 IDE 已启动。
7. **launch / publish 校验有效 appid**（unix-request LESSONS 4 继承确认）：unix-storage playground 暂复用 `__UNI__1927897`（unix-request），后续发布前应在 GUI 重新获取独立 appid。

### Spike 结论（web 端运行验证，10 条 [spike] 日志全过、无 storage 报错；Android 端待设备补测）

8. **S1 Promise 形态**：`await uni.setStorage({...} as SetStorageOptions)` 原生可用（不传回调）；`await uni.getStorage({...})` 原生可用但 **返回完整结构 `{ data, errMsg, errSubject }` 而非 data 本身**（web 端实测）。跨端一致的安全路径 = **手动 Promise 包装**（success/fail 回调形态，success 回调参数 res.data 两端契约一致），adapter 据此实现。
9. **S2 序列化往返**：嵌套 type + null 字段对象 set→get 往返数据完整（`{"value":"tk-123","expire":null,"profile":{"nickname":"mengxi","avatar":null}}`）；**type 读回为 UTSJSONObject（官方文档「类型数据的存取说明」明确），还原统一用 `JSON.parse<T>(JSON.stringify(raw))`**（官方路径，`as T` web 端可用但 Kotlin 端有 ClassCastException 风险，库实现不用）；UTSJSONObject 下标访问兜底可用。
10. **S3 前缀过滤**：`uni.getStorageInfoSync().keys` 全量 key + `String.startsWith` 过滤正确；web 端 keys 含框架 `__DC_STAT_UUID`，库的命名空间过滤天然规避。
11. **uni.getStorage 对不存在 key 走 fail**：errMsg `getStorage:fail data not found`（官方文档明确）→ adapter 的 get 未命中语义 = fail 时按 errMsg 判定 resolve(null)，其他 fail 照常 reject。

## 2026-10-15 P2–P4 core 实现 + Web 全功能验证（22 条 [verify] 日志全过）

### Web 构建链

12. **`pnpm build:web`（uni build）默认找 `src/manifest.json` 直接 ENOENT**：必须设置 `UNI_INPUT_DIR` 环境变量指向 playground 目录（大写盘符 `E:\...`），再执行构建。esbuild 需在沙箱外跑（临时文件写 `E:\_tmp_*` 等沙箱外路径）。
13. **.uts 插件文件在 web 构建链报 `Cannot find name 'UniError' / 'UTSJSONObject'` warning**：TS 视图 linter 噪音，不阻断构建（DONE Build complete），运行时由 web polyfill 正常提供，22 条日志零报错实证。

### 实现层（运行验证）

14. **闭包自引用 / 闭包计数器捕获在 Kotlin 端是雷**（unix-request taskHolder 自引用教训同源）：批量删除 / clearExpired 扫描统一用**顶层函数递归 + resolve/reject 用零参包装闭包传递**（adapter.removeBatchNext / ttl.scanNext 模式），web 端验证通过，Android 同构规避。
15. **web 端 `uni.getStorageInfoSync().limitSize` 返回 Number.MAX_VALUE（1.79e308 KB）**：web 无容量上限，`info()` 的 limitSize 平台差异大，业务勿硬编码断言。
16. **record 探测（detectRecord）**：try-cast UTSJSONObject + `UTSJSONObject.keys()` 探活（keys 长度 0 视为非对象）+ data/expire 双字段判定 + expire try-cast number；web 端 22 条日志实证 record 往返、非 record 原样返回（Q5）、惰性过期、clearExpired 计数全对。
17. **Web 端验证结论矩阵**：TTL 三级回退（调用级/实例 defaultTTL/configureStorage 全局）、前缀隔离（keys 剥前缀、clear 仅本命名空间、跨实例不泄漏）、错误路径（空 key / 保留前缀均 ERR_PARAM 且 errSubject=unix-storage、key 正确挂载）全部符合 store-plan §4.4 语义。Android 端待设备补测（重点关注：get<VToken> 直接成员访问的 CCE 风险——安全路径为 JSON.parse<T>(JSON.stringify(raw))）。
