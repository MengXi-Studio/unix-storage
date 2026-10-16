---
layout: home

title: '@meng-xi/unix-storage'
titleTemplate: Unix Storage Local Storage

hero:
  name: '@meng-xi/unix-storage'
  text: uni-app x local storage
  tagline: A full-featured local storage library for uni-app x
  image:
    src: /logo.svg
    alt: Unix Storage
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide/getting-started
    - theme: alt
      text: Introduction
      link: /en/guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/MengXi-Studio/unix-storage

features:
  - icon: ⚡️
    title: Promise-based
    details: set / get / remove / clear / info / keys / clearExpired, all async/await; miss and expired resolve null instead of rejecting; unified StorageError carries errSubject / nativeErrCode / key
  - icon: ⏱️
    title: TTL expiration
    details:
      'Record-wrapped timestamps with lazy checks on read (Date.now() > expire → removed); clearExpired sweeps and reports the removed count; three-level fallback: call-level ttl → instance defaultTTL → built-in
      never-expire'
  - icon: 🗂️
    title: Key namespaces
    details: 'Default prefix mx_storage: avoids the reserved uni- / dcloud_ prefixes, invalid prefixes rejected with ERR_PARAM; keys() strips the prefix; clear only touches its own namespace'
  - icon: 🏗️
    title: Multiple instances
    details: createStorage(defaults) creates instances with isolated prefix / TTL, mirroring axios.create; the default instance works out of the box, configureStorage sets global defaults
  - icon: 🛡️
    title: Compatibility policy
    details: Foreign-format data (legacy entries written straight through native APIs) is returned as-is and treated as never-expiring — no errors, no accidental removal
  - icon: 🧩
    title: UTS / TypeScript first
    details: Nullable-safe config fields (| null, null keeps built-in defaults), get<T> generic static annotation; all 22 functional verification logs passed on Web
---
