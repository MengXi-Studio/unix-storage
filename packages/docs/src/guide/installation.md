# 安装

## 环境要求

- **uni-app x** 项目（uvue / UTS 编译链），HBuilderX 需支持 UTS 插件编译
- 插件以 UTS 源码分发，编译产物由本地工具链现场生成（Web / 小程序 → JS，Android → Kotlin，iOS → Swift），无预编译产物下载

## npm 安装

```bash
pnpm add @meng-xi/unix-storage
```

## 同步到 uni_modules

uni-app x 编译器只扫描工程内 `uni_modules/`，**不扫描 `node_modules`**。安装后需把包内容同步为 `uni_modules/ux-storage/`：

```bash
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-storage uni_modules/ux-storage
```

> 建议把同步命令写进工程 `package.json` 的 scripts（如 `"sync:storage"`），依赖更新后重新执行一次即可。

## 目录结构

同步后的 `uni_modules/ux-storage/` 是标准 uni_modules UTS 插件：

```
uni_modules/ux-storage/
├── package.json
├── README.md / README-en.md / license.md
└── utssdk/
    ├── interface.uts          # 对外类型与 API 声明（官方必需）
    ├── index.uts              # 跨平台根入口（对外 API 内联声明）
    └── storage/               # 实现层
        ├── adapter.uts        # uni.setStorage 系列的 Promise 适配
        ├── record.uts         # record 包裹构造 / 探测 / 过期判断
        ├── ttl.uts            # TTL 三级回退与清理扫描
        ├── core.uts           # 七函数业务编排
        ├── instance.uts       # 默认实例与多实例工厂
        ├── types/index.uts    # 内部类型
        ├── utils/error.uts    # 错误构造
        └── constants/defaults.uts
```

分层设计详见[实现原理](./internals)。

## 导入使用

业务侧从 `@/uni_modules/ux-storage` 导入：

```ts
import { set, get } from '@/uni_modules/ux-storage'
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults, StorageError } from '@/uni_modules/ux-storage'
```

## 下一步

- [快速开始](./getting-started)：默认实例开箱即用
