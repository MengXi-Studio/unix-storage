# Installation

## Requirements

- A **uni-app x** project (uvue / UTS toolchain); HBuilderX must support UTS plugin compilation
- The plugin ships as UTS source — build artifacts are generated on the fly by the local toolchain (Web / Mini-program → JS, Android → Kotlin, iOS → Swift); no prebuilt artifacts are downloaded

## Install via npm

```bash
pnpm add @meng-xi/unix-storage
```

## Sync into uni_modules

The uni-app x compiler only scans the project's `uni_modules/` — **it does not scan `node_modules`**. After installing, sync the package into `uni_modules/ux-storage/`:

```bash
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-storage uni_modules/ux-storage
```

> Consider adding the sync command to your project's `package.json` scripts (e.g. `"sync:storage"`) and re-running it after dependency updates.

## Directory layout

The synced `uni_modules/ux-storage/` is a standard uni_modules UTS plugin:

```
uni_modules/ux-storage/
├── package.json
├── README.md / README-en.md / license.md
└── utssdk/
    ├── interface.uts          # Public types & API declarations (officially required)
    ├── index.uts              # Cross-platform root entry (inline public API declarations)
    └── storage/               # Implementation layer
        ├── adapter.uts        # Promise adapter over the uni.setStorage family
        ├── record.uts         # Record wrapping / detection / expiration checks
        ├── ttl.uts            # TTL three-level fallback and sweep
        ├── core.uts           # Business orchestration for the seven functions
        ├── instance.uts       # Default instance and multi-instance factory
        ├── types/index.uts    # Internal types
        ├── utils/error.uts    # Error construction
        └── constants/defaults.uts
```

The layered design is covered in [Implementation Notes](./internals).

## Importing

Import from `@/uni_modules/ux-storage` in your code:

```ts
import { set, get } from '@/uni_modules/ux-storage'
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults, StorageError } from '@/uni_modules/ux-storage'
```

## Next steps

- [Getting Started](./getting-started): the default instance, ready out of the box
