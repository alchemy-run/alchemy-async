## v0.70.2

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Add observability wrangler config types &nbsp;-&nbsp; by **utopy** in https://github.com/sam-goodwin/alchemy/issues/1052 [<samp>(2ba2e)</samp>](https://github.com/sam-goodwin/alchemy/commit/2ba2e05f)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Hard-code the Permission Group mappings &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1061 [<samp>(efda9)</samp>](https://github.com/sam-goodwin/alchemy/commit/efda9cfb)
  - Ensure D1 migrations run on fresh installs in local dev mode &nbsp;-&nbsp; by **Jordan Coeyman** in https://github.com/sam-goodwin/alchemy/issues/897 [<samp>(8aaff)</samp>](https://github.com/sam-goodwin/alchemy/commit/8aaff1a6)
  - Remove bindings on worker versions on delete &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/975 [<samp>(c5dd5)</samp>](https://github.com/sam-goodwin/alchemy/commit/c5dd57be)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.70.1...v0.70.2)

---

## v0.70.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cli**:
  - Support selecting profile &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1050 [<samp>(9a9dc)</samp>](https://github.com/sam-goodwin/alchemy/commit/9a9dca93)
  - Globally disable telemetry &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1046 [<samp>(0d66a)</samp>](https://github.com/sam-goodwin/alchemy/commit/0d66ab6a)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Remove catalog dependencies from tanstack template &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1058 [<samp>(a06cd)</samp>](https://github.com/sam-goodwin/alchemy/commit/a06cd16e)
- **cloudflare**:
  - Better defaults for docker socket path for cf containers &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/1054 [<samp>(ba834)</samp>](https://github.com/sam-goodwin/alchemy/commit/ba83423f)
  - Update the expectations in the Bun SPA test so it passes + some cosmetic improvments &nbsp;-&nbsp; by **Andrew Jefferson** in https://github.com/sam-goodwin/alchemy/issues/1051 [<samp>(b2934)</samp>](https://github.com/sam-goodwin/alchemy/commit/b29349fc)
  - Vite dev server hangs &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1060 [<samp>(774fa)</samp>](https://github.com/sam-goodwin/alchemy/commit/774faa68)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.70.0...v0.70.1)

---

## v0.70.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **clickhouse**:
  - Clickhouse Service resource &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/989 [<samp>(40b6f)</samp>](https://github.com/sam-goodwin/alchemy/commit/40b6f634)
- **cloudflare**:
  - Add logpush support to worker metadata and configuration &nbsp;-&nbsp; by **Jacob M-G Evans** in https://github.com/sam-goodwin/alchemy/issues/1034 [<samp>(a2792)</samp>](https://github.com/sam-goodwin/alchemy/commit/a2792c0c)
  - A bun SPA resource which uses bun HMR for dev and bun build for deploy &nbsp;-&nbsp; by **Andrew Jefferson** in https://github.com/sam-goodwin/alchemy/issues/1030 [<samp>(1641d)</samp>](https://github.com/sam-goodwin/alchemy/commit/1641da34)
  - Add lite, standard-1,2,3,4 Container instance types &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1048 [<samp>(6c7cf)</samp>](https://github.com/sam-goodwin/alchemy/commit/6c7cf810)
- **coinbase**:
  - Add Coinbase CDP provider - EVM account & smartAccount resources &nbsp;-&nbsp; by **Nick Balestra-Foster** in https://github.com/sam-goodwin/alchemy/issues/1012 [<samp>(2a170)</samp>](https://github.com/sam-goodwin/alchemy/commit/2a170217)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Use miniflare entry for proxy &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1033 [<samp>(97107)</samp>](https://github.com/sam-goodwin/alchemy/commit/971072d2)
  - Make Website dev command optional &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1047 [<samp>(8a633)</samp>](https://github.com/sam-goodwin/alchemy/commit/8a63378a)
- **planetscale**:
  - Errors swallowed by hey-api &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1035 [<samp>(0f54e)</samp>](https://github.com/sam-goodwin/alchemy/commit/0f54ec66)
- **telemetry**:
  - Migrate user id & avoid generating id if telemetry disabled &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1039 [<samp>(35d9a)</samp>](https://github.com/sam-goodwin/alchemy/commit/35d9add9)
  - Hash origin url &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/1044 [<samp>(289f6)</samp>](https://github.com/sam-goodwin/alchemy/commit/289f6527)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.69.1...v0.70.0)

---

## v0.69.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - Add Tail Consumers &nbsp;-&nbsp; by **Jacob M-G Evans** and **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1021 [<samp>(e31c9)</samp>](https://github.com/sam-goodwin/alchemy/commit/e31c9ea1)
  - Add httpMetadata prop to bucket put fn &nbsp;-&nbsp; by **Leonardo E. Dominguez** in https://github.com/sam-goodwin/alchemy/issues/1024 [<samp>(ac7b7)</samp>](https://github.com/sam-goodwin/alchemy/commit/ac7b7c99)
  - Add scheduled event handler for local workers &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1011 [<samp>(2ae06)</samp>](https://github.com/sam-goodwin/alchemy/commit/2ae068b7)
- **docker**:
  - Container health checks &nbsp;-&nbsp; by **João Victor** in https://github.com/sam-goodwin/alchemy/issues/1029 [<samp>(632dc)</samp>](https://github.com/sam-goodwin/alchemy/commit/632dcf3a)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Set ALCHEMY_ROOT for dev command in Website &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1027 [<samp>(9b56f)</samp>](https://github.com/sam-goodwin/alchemy/commit/9b56fd22)
  - Update tanstack start to support latest RC version &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/1028 [<samp>(809bf)</samp>](https://github.com/sam-goodwin/alchemy/commit/809bf2d3)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.69.0...v0.69.1)

---

## v0.69.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **aws**:
  - Trigger replace when changing an immutable property in Cloud Control &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1006 [<samp>(2a376)</samp>](https://github.com/sam-goodwin/alchemy/commit/2a376419)
- **cloudflare**:
  - Support data catalog on buckets &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/1009 [<samp>(e008d)</samp>](https://github.com/sam-goodwin/alchemy/commit/e008d24f)
  - Bucket object resource &nbsp;-&nbsp; by **Leonardo E. Dominguez** in https://github.com/sam-goodwin/alchemy/issues/1016 [<samp>(d8fdf)</samp>](https://github.com/sam-goodwin/alchemy/commit/d8fdf4db)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Set max_batch_timeout in wrangler.json &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1019 [<samp>(43a6b)</samp>](https://github.com/sam-goodwin/alchemy/commit/43a6b3b3)
  - Build.command and dev.command should be optional &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1014 [<samp>(258e5)</samp>](https://github.com/sam-goodwin/alchemy/commit/258e509e)
  - Export R2Object &nbsp;-&nbsp; by **Leonardo E. Dominguez** in https://github.com/sam-goodwin/alchemy/issues/1023 [<samp>(ff4ba)</samp>](https://github.com/sam-goodwin/alchemy/commit/ff4ba21c)
  - Support R2 methods in dev mode &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1022 [<samp>(6c102)</samp>](https://github.com/sam-goodwin/alchemy/commit/6c102be9)
- **neon**:
  - Remove this(..) syntax &nbsp;-&nbsp; by **utopy** in https://github.com/sam-goodwin/alchemy/issues/1007 [<samp>(4efaa)</samp>](https://github.com/sam-goodwin/alchemy/commit/4efaa959)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.68.0...v0.69.0)

---

## v0.68.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Remove Resource symbols and this(..) syntax &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1003 [<samp>(d967c)</samp>](https://github.com/sam-goodwin/alchemy/commit/d967c0dc)
- **cli**: Alchemy auth command for cloudflare &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/956 [<samp>(f9fab)</samp>](https://github.com/sam-goodwin/alchemy/commit/f9fab978)
- **cloudflare**: Add head, get, list, put and delete methods to R2Bucket &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/974 [<samp>(d5e96)</samp>](https://github.com/sam-goodwin/alchemy/commit/d5e96354)
- **neon**: Branch resource & rewrite project &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/995 [<samp>(87555)</samp>](https://github.com/sam-goodwin/alchemy/commit/87555813)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Use fs.rm instead of fs.rmdir &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(1ad11)</samp>](https://github.com/sam-goodwin/alchemy/commit/1ad119e0)
- **cloudflare**:
  - Wasm bundling fails when imported from nested directory &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/982 [<samp>(454b9)</samp>](https://github.com/sam-goodwin/alchemy/commit/454b9624)
  - Minify internal workers &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/992 [<samp>(097d0)</samp>](https://github.com/sam-goodwin/alchemy/commit/097d04da)
  - Use capnweb for miniflare remote bindings &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/990 [<samp>(fda5a)</samp>](https://github.com/sam-goodwin/alchemy/commit/fda5ae74)
  - Avoid storing assets in state &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/991 [<samp>(784fb)</samp>](https://github.com/sam-goodwin/alchemy/commit/784fb090)
  - Preserve string literal types in bound.ts &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/1002 [<samp>(d2cc6)</samp>](https://github.com/sam-goodwin/alchemy/commit/d2cc61a8)
- **core**:
  - Correct websocket proxying &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/998 [<samp>(ae899)</samp>](https://github.com/sam-goodwin/alchemy/commit/ae899629)
- **docker**:
  - Enable buildkit &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/993 [<samp>(1d8aa)</samp>](https://github.com/sam-goodwin/alchemy/commit/1d8aa6f1)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.67.0...v0.68.0)

---

## v0.67.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - Add SecretRef to reference existing secrets &nbsp;-&nbsp; by **Andrew Jefferson** in https://github.com/sam-goodwin/alchemy/issues/966 [<samp>(f0dc0)</samp>](https://github.com/sam-goodwin/alchemy/commit/f0dc083d)
  - Tunnel &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/959 [<samp>(2b2b3)</samp>](https://github.com/sam-goodwin/alchemy/commit/2b2b3710)
  - Minify nextjs to reduce likelihood of cloudflare limits &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/972 [<samp>(fad12)</samp>](https://github.com/sam-goodwin/alchemy/commit/fad1216f)
  - HyperdriveRef &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/971 [<samp>(84dbe)</samp>](https://github.com/sam-goodwin/alchemy/commit/84dbe727)
  - Service binding named entrypoints &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/969 [<samp>(36e73)</samp>](https://github.com/sam-goodwin/alchemy/commit/36e73f17)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**: Ignore turbo.json when finding workspace root &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/965 [<samp>(5020d)</samp>](https://github.com/sam-goodwin/alchemy/commit/5020d8ab)
- **cloudflare**: Remove ai gateway binding type &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/963 [<samp>(261f7)</samp>](https://github.com/sam-goodwin/alchemy/commit/261f7d21)
- **core**: Commands run by scope.spawn are properly mirrored to stdio &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/942 [<samp>(100fe)</samp>](https://github.com/sam-goodwin/alchemy/commit/100fe08d)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.66.0...v0.67.0)

---

## v0.66.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **core**: Support multi-app, interconnected monorepos &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/953 [<samp>(8fdcf)</samp>](https://github.com/sam-goodwin/alchemy/commit/8fdcf883)
- **stripe**: Bump stripe dependency, remove coupon from Customer &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/930 [<samp>(a1c0c)</samp>](https://github.com/sam-goodwin/alchemy/commit/a1c0c0e9)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**: Fix ./env.d.ts in next.js init script &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(fb401)</samp>](https://github.com/sam-goodwin/alchemy/commit/fb401175)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.65.1...v0.66.0)

---

## v0.65.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Use default import for picocolors &nbsp;-&nbsp; by **Rahul Mishra** in https://github.com/sam-goodwin/alchemy/issues/950 [<samp>(c6c53)</samp>](https://github.com/sam-goodwin/alchemy/commit/c6c53c54)
- **core**: Correct definition of memoize defaultKeyFn &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/952 [<samp>(d870a)</samp>](https://github.com/sam-goodwin/alchemy/commit/d870a5d3)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.65.0...v0.65.1)

---

## v0.65.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cli**:
  - Allow Debugging via the CLI &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/895 [<samp>(78b6e)</samp>](https://github.com/sam-goodwin/alchemy/commit/78b6ecd6)
- **cloudflare**:
  - Adopt hyperdrive &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/923 [<samp>(380db)</samp>](https://github.com/sam-goodwin/alchemy/commit/380dbf63)
  - Nextjs resource &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/884 [<samp>(37917)</samp>](https://github.com/sam-goodwin/alchemy/commit/379172ed)
- **planetscale**:
  - Postgres support &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/918 [<samp>(d6716)</samp>](https://github.com/sam-goodwin/alchemy/commit/d671649f)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Support alchemy.run.mts &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/925 [<samp>(eac8f)</samp>](https://github.com/sam-goodwin/alchemy/commit/eac8fb1b)
- **cloudflare**:
  - Enforce stateToken requirement in CloudflareStateStore &nbsp;-&nbsp; by **Matt ‘TK’ Taylor** in https://github.com/sam-goodwin/alchemy/issues/927 [<samp>(fbf23)</samp>](https://github.com/sam-goodwin/alchemy/commit/fbf23d2d)
  - Use "text/javascript" mime type for assets &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/931 [<samp>(82284)</samp>](https://github.com/sam-goodwin/alchemy/commit/822847f7)
  - Improve asset upload error handling and add retries &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/939 [<samp>(ac05f)</samp>](https://github.com/sam-goodwin/alchemy/commit/ac05f4ca)
  - Fix support for producer only queue bindings for wranglerjson &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/934 [<samp>(80dd6)</samp>](https://github.com/sam-goodwin/alchemy/commit/80dd605a)
  - Handle "?module" suffix in wasm imports &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/948 [<samp>(5bb7f)</samp>](https://github.com/sam-goodwin/alchemy/commit/5bb7f065)
- **core**:
  - Remove Symbol from Secret &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/922 [<samp>(9c3be)</samp>](https://github.com/sam-goodwin/alchemy/commit/9c3be8fb)
  - Deterministic cache keys for function memoization &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/929 [<samp>(96b8f)</samp>](https://github.com/sam-goodwin/alchemy/commit/96b8f594)
  - Pass dedent tests &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/940 [<samp>(2c1a5)</samp>](https://github.com/sam-goodwin/alchemy/commit/2c1a5fc8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.64.0...v0.65.0)

---

## v0.64.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Flatten Website scope hierarchy &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/885 [<samp>(0640a)</samp>](https://github.com/sam-goodwin/alchemy/commit/0640ad86)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Remove hard-coded physical names from templates &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(91cc6)</samp>](https://github.com/sam-goodwin/alchemy/commit/91cc6321)
- **cloudflare**:
  - Upgrade @clouflare/workers-types peer &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/915 [<samp>(059c0)</samp>](https://github.com/sam-goodwin/alchemy/commit/059c0165)
  - Sync node compat plugin with workers-sdk &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/916 [<samp>(15cca)</samp>](https://github.com/sam-goodwin/alchemy/commit/15cca8cb)
  - Drill jurisdiction through to Binding and wrangler.json &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/920 [<samp>(ab3d9)</samp>](https://github.com/sam-goodwin/alchemy/commit/ab3d9d09)
  - Set bucket jurisdiction to undefined instead of 'default' &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(8a132)</samp>](https://github.com/sam-goodwin/alchemy/commit/8a132c5f)
  - Mark cloudflare:workers as external &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(3bb5b)</samp>](https://github.com/sam-goodwin/alchemy/commit/3bb5bd24)
  - Mark cloudflare:* as external &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(8c8bd)</samp>](https://github.com/sam-goodwin/alchemy/commit/8c8bd266)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.63.1...v0.64.0)

---

## v0.63.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Support importing find-process on plain node &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/912 [<samp>(6bfe9)</samp>](https://github.com/sam-goodwin/alchemy/commit/6bfe96c2)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.63.0...v0.63.1)

---

## v0.63.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Generate physical names from app, stage and resource ID &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/893 [<samp>(0b9c5)</samp>](https://github.com/sam-goodwin/alchemy/commit/0b9c57e4)
- **cli**:
  - Add hono template in create command &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/898 [<samp>(b7d9d)</samp>](https://github.com/sam-goodwin/alchemy/commit/b7d9db71)
  - Support --adopt flag to blanket adopt resources &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/900 [<samp>(50a84)</samp>](https://github.com/sam-goodwin/alchemy/commit/50a84fde)
- **cloudflare**:
  - R2 bucket lifecycle and lock rules &nbsp;-&nbsp; by **John Royal** and **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/901 [<samp>(bf81a)</samp>](https://github.com/sam-goodwin/alchemy/commit/bf81aba4)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Allow React Router apps to be deployed in SPA mode &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/883 [<samp>(771cd)</samp>](https://github.com/sam-goodwin/alchemy/commit/771cd994)
  - Skip path validation during astro output type check &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/892 [<samp>(5a7d7)</samp>](https://github.com/sam-goodwin/alchemy/commit/5a7d7cf9)
  - WranglerJson type instantiation &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/905 [<samp>(36d36)</samp>](https://github.com/sam-goodwin/alchemy/commit/36d36237)
  - Set `spa: false` for astro resource &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/903 [<samp>(8dc29)</samp>](https://github.com/sam-goodwin/alchemy/commit/8dc29c2b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.62.3...v0.63.0)

---

## v0.62.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Incljude .wrangler/ in .gitignore &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(f7f0c)</samp>](https://github.com/sam-goodwin/alchemy/commit/f7f0cb55)
- **cloudflare**:
  - Use correct D1 databaseId value in phases &nbsp;-&nbsp; by **Rhayxz** in https://github.com/sam-goodwin/alchemy/issues/889 [<samp>(09aec)</samp>](https://github.com/sam-goodwin/alchemy/commit/09aecfd5)
  - Allow overwriting `spa: true` in vite apps &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/882 [<samp>(39598)</samp>](https://github.com/sam-goodwin/alchemy/commit/39598369)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.62.2...v0.62.3)

---

## v0.62.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**: Always substitute {projectName} &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(8bb7e)</samp>](https://github.com/sam-goodwin/alchemy/commit/8bb7e695)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.62.1...v0.62.2)

---

## v0.62.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cli**:
  - Configure CloudflareStateStore for templates if GitHub actions chosen &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/878 [<samp>(f7451)</samp>](https://github.com/sam-goodwin/alchemy/commit/f74517c3)
  - Susbtitute projectName construct stage-specific names &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/880 [<samp>(1d089)</samp>](https://github.com/sam-goodwin/alchemy/commit/1d089d9b)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Templates should not modify the alchemy app stage &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/876 [<samp>(9a482)</samp>](https://github.com/sam-goodwin/alchemy/commit/9a482493)
  - Adapt CI workflows to the user's chosen package manager &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/877 [<samp>(9a409)</samp>](https://github.com/sam-goodwin/alchemy/commit/9a409b54)
  - Set CLOUDFLARE_EMAIL, ALCHEMY_PASSWORD, ALCHEMY_STATE_TOKEN in github worklow template &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/879 [<samp>(d3cc9)</samp>](https://github.com/sam-goodwin/alchemy/commit/d3cc984e)
- **cloudflare**:
  - Alchemy svelte plugin is a no-op when run within the svelte language server &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/875 [<samp>(74f7d)</samp>](https://github.com/sam-goodwin/alchemy/commit/74f7df65)
- **core**:
  - Clean up processes created with idempotentSpawn &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/874 [<samp>(d8266)</samp>](https://github.com/sam-goodwin/alchemy/commit/d8266d49)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.62.0...v0.62.1)

---

## v0.62.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **aws**: AWS credentials with global or scoped overrides &nbsp;-&nbsp; by **yehudacohen** in https://github.com/sam-goodwin/alchemy/issues/841 [<samp>(f7541)</samp>](https://github.com/sam-goodwin/alchemy/commit/f7541f85)
- **cli**: Append .alchemy to .gitignore during init &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/858 [<samp>(e802b)</samp>](https://github.com/sam-goodwin/alchemy/commit/e802b672)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Replace kleur with picocolors &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/862 [<samp>(f8d26)</samp>](https://github.com/sam-goodwin/alchemy/commit/f8d26494)
  - Remove deprecation warning in execute-alchemy.ts &nbsp;-&nbsp; by **Sam Goodwin** and **sam** in https://github.com/sam-goodwin/alchemy/issues/871 [<samp>(31847)</samp>](https://github.com/sam-goodwin/alchemy/commit/31847b19)
- **cloudflare**:
  - Fix worker asset and no-bundle filepaths on windows &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/861 [<samp>(75b05)</samp>](https://github.com/sam-goodwin/alchemy/commit/75b053f1)
  - Idempotent spawn of vite dev that dies on SIGTERM &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/865 [<samp>(6b2b7)</samp>](https://github.com/sam-goodwin/alchemy/commit/6b2b7e5b)
  - Delete large r2 buckets &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/864 [<samp>(783e2)</samp>](https://github.com/sam-goodwin/alchemy/commit/783e2376)
  - Handle transient errors in CloudflareStateStore &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(d0f5a)</samp>](https://github.com/sam-goodwin/alchemy/commit/d0f5ab20)
- **core**:
  - Spawn now properly handles quiet mode, partial lines and total extraction &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/872 [<samp>(10b20)</samp>](https://github.com/sam-goodwin/alchemy/commit/10b202df)
  - Support multiple instances of alchemy in a monorepo environment &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/867 [<samp>(07782)</samp>](https://github.com/sam-goodwin/alchemy/commit/07782706)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.61.0...v0.62.0)

---

## v0.61.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **core**: Idempotent spawn for resumable and tailable processes &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/842 [<samp>(d57e6)</samp>](https://github.com/sam-goodwin/alchemy/commit/d57e61ed)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Improve exit signal handling &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/839 [<samp>(fe90a)</samp>](https://github.com/sam-goodwin/alchemy/commit/fe90a00c)
  - Use --env-file-if-exists for alchemy deploy &nbsp;-&nbsp; by **Rahul Mishra** in https://github.com/sam-goodwin/alchemy/issues/845 [<samp>(8f5f8)</samp>](https://github.com/sam-goodwin/alchemy/commit/8f5f869e)
  - Replace `--env-file-if-exists` with file detection &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/854 [<samp>(a6adc)</samp>](https://github.com/sam-goodwin/alchemy/commit/a6adcbb5)
  - Ensure exit code 0 for sigint &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/855 [<samp>(1955e)</samp>](https://github.com/sam-goodwin/alchemy/commit/1955e9ab)
  - Init scripts use alchemy plugins &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(9ce92)</samp>](https://github.com/sam-goodwin/alchemy/commit/9ce929bc)
- **cloudflare**:
  - Use glob instead of fs.glob for node 20 compatibility &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/847 [<samp>(31bf3)</samp>](https://github.com/sam-goodwin/alchemy/commit/31bf34b3)
  - R2 bucket destroy fails if bucket does not exist and `empty: true` &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/849 [<samp>(0c234)</samp>](https://github.com/sam-goodwin/alchemy/commit/0c2349aa)
  - Register durable object bindings for websites &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/853 [<samp>(8fa72)</samp>](https://github.com/sam-goodwin/alchemy/commit/8fa72abc)
  - Set wrangler config in svelte adapter &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(195ee)</samp>](https://github.com/sam-goodwin/alchemy/commit/195ee2e0)
  - Upgrade rwsdk version in template and example to latest &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(75bca)</samp>](https://github.com/sam-goodwin/alchemy/commit/75bcaf57)
- **core**:
  - Restart process if PID has changed &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(25f23)</samp>](https://github.com/sam-goodwin/alchemy/commit/25f23ef4)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.60.2...v0.61.0)

---

## v0.60.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Properly set --watch for alchemy dev &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/836 [<samp>(2200a)</samp>](https://github.com/sam-goodwin/alchemy/commit/2200aaf)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.60.1...v0.60.2)

---

## v0.60.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Propagate compatibility preset to wrangler.jsonc &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/835 [<samp>(6535d)</samp>](https://github.com/sam-goodwin/alchemy/commit/6535deb)
  - Overwrite NODE_ENV when running vite dev &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/832 [<samp>(edcca)</samp>](https://github.com/sam-goodwin/alchemy/commit/edcca4a)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.60.0...v0.60.1)

---

## v0.60.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: WAF Ruleset resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/826 [<samp>(8c3d5)</samp>](https://github.com/sam-goodwin/alchemy/commit/8c3d59a)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**:
  - Fail in CI if using the local state store &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/828 [<samp>(06502)</samp>](https://github.com/sam-goodwin/alchemy/commit/06502fe)
  - Set props to {} on first create &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(32f74)</samp>](https://github.com/sam-goodwin/alchemy/commit/32f749d)
  - Instrumented state store should not swallot store errors &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/830 [<samp>(2a751)</samp>](https://github.com/sam-goodwin/alchemy/commit/2a75179)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.59.2...v0.60.0)

---

## v0.59.2

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Zone Bot Management &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/825 [<samp>(b1c69)</samp>](https://github.com/sam-goodwin/alchemy/commit/b1c69a0b)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Correct wrangler.json assets config &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/827 [<samp>(9c967)</samp>](https://github.com/sam-goodwin/alchemy/commit/9c967f6b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.59.1...v0.59.2)

---

## v0.59.1

*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.59.0...v0.59.1)

---

## v0.59.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - Allow local connection string for hyperdrive &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/801 [<samp>(6934a)</samp>](https://github.com/sam-goodwin/alchemy/commit/6934a87f)
  - Clear miniflare data on destroy &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/804 [<samp>(ed8df)</samp>](https://github.com/sam-goodwin/alchemy/commit/ed8df405)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Use explicit Worker credentials to create local proxy worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/812 [<samp>(e5269)</samp>](https://github.com/sam-goodwin/alchemy/commit/e5269f09)
  - Cache Cloudflare Api based on options to avoid expensive credential resoliution &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/821 [<samp>(a5114)</samp>](https://github.com/sam-goodwin/alchemy/commit/a5114b34)
  - Avoid creating or deleting remote resources in local mode &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/764 [<samp>(b0027)</samp>](https://github.com/sam-goodwin/alchemy/commit/b0027fd8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.58.0...v0.59.0)

---

## v0.58.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Tunnel &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/810 [<samp>(f7973)</samp>](https://github.com/sam-goodwin/alchemy/commit/f7973e83)
- **core**: Eager resource replacements can delete resources with children &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/809 [<samp>(4b32f)</samp>](https://github.com/sam-goodwin/alchemy/commit/4b32ff6f)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Do not leak plain text secret in console.log or toString &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/808 [<samp>(685e9)</samp>](https://github.com/sam-goodwin/alchemy/commit/685e91d9)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.57.2...v0.58.0)

---

## v0.57.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Import Rpc from @cloudflare/workers-types in Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/807 [<samp>(42e5d)</samp>](https://github.com/sam-goodwin/alchemy/commit/42e5d7e)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.57.1...v0.57.2)

---

## v0.57.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Shorter command description &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/797 [<samp>(a5f6a)</samp>](https://github.com/sam-goodwin/alchemy/commit/a5f6ad9d)
- **cloudflare**:
  - Use catalog to ensure same @cloudflare/workers-types &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/795 [<samp>(943ac)</samp>](https://github.com/sam-goodwin/alchemy/commit/943ac1c6)
  - Handle symlink directories in Worker Assets &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/798 [<samp>(be636)</samp>](https://github.com/sam-goodwin/alchemy/commit/be636dc9)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.57.0...v0.57.1)

---

## v0.57.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Alchemy vite plugin &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/758 [<samp>(f58bc)</samp>](https://github.com/sam-goodwin/alchemy/commit/f58bcd38)
- **random**: Add RandomString resource and alchemy/random export &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/785 [<samp>(73bc9)</samp>](https://github.com/sam-goodwin/alchemy/commit/73bc99c7)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - From xdg-app-paths to env-paths &nbsp;-&nbsp; by **Justin Bennett** in https://github.com/sam-goodwin/alchemy/issues/779 [<samp>(86246)</samp>](https://github.com/sam-goodwin/alchemy/commit/86246832)
  - Improve error logging when failing to create an empty worker &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/751 [<samp>(beb9a)</samp>](https://github.com/sam-goodwin/alchemy/commit/beb9ab9c)
- **core**:
  - Synchronous alchemy.env and alchemy.secret.env &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/786 [<samp>(a3989)</samp>](https://github.com/sam-goodwin/alchemy/commit/a398935b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.56.0...v0.57.0)

---

## v0.56.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Add nodejs_compat_populate_process_env to node preset &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/762 [<samp>(b487a)</samp>](https://github.com/sam-goodwin/alchemy/commit/b487af8b)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Add process.env to cloudflare:workers shim &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/742 [<samp>(807a5)</samp>](https://github.com/sam-goodwin/alchemy/commit/807a50e4)
  - Correct miniflare worker name in proxy &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/777 [<samp>(68546)</samp>](https://github.com/sam-goodwin/alchemy/commit/6854651e)
  - Worker bundling no longer fails on windows &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/780 [<samp>(44946)</samp>](https://github.com/sam-goodwin/alchemy/commit/44946012)
  - Resolve wrangler main and assets relative to cwd &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/783 [<samp>(916b6)</samp>](https://github.com/sam-goodwin/alchemy/commit/916b6573)
- **core**:
  - Move execa from peer to dep &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/771 [<samp>(277da)</samp>](https://github.com/sam-goodwin/alchemy/commit/277da985)
  - Handle dangling processes &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/770 [<samp>(e765f)</samp>](https://github.com/sam-goodwin/alchemy/commit/e765f2d4)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.55.3...v0.56.0)

---

## v0.55.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**: Bundle execa in alchemy CLI &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/759 [<samp>(0b90a)</samp>](https://github.com/sam-goodwin/alchemy/commit/0b90a18)
- **cloudflare**: Add back esbuild alias plugin &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/753 [<samp>(fad6a)</samp>](https://github.com/sam-goodwin/alchemy/commit/fad6a9c)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.55.2...v0.55.3)

---

## v0.55.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Add worker/ to vite template tsconfig.json &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(0df20)</samp>](https://github.com/sam-goodwin/alchemy/commit/0df204fc)
  - Remove command from Vite resource in vite template &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(9fb33)</samp>](https://github.com/sam-goodwin/alchemy/commit/9fb33f2b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.55.1...v0.55.2)

---

## v0.55.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**: Resolve zod version conflict &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/750 [<samp>(f2f7a)</samp>](https://github.com/sam-goodwin/alchemy/commit/f2f7a9dd)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.55.0...v0.55.1)

---

## v0.55.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **aws**: EC2 networking resources (VPC, NAT, IGW, Subnet, Route) &nbsp;-&nbsp; by **yehudacohen** in https://github.com/sam-goodwin/alchemy/issues/657 [<samp>(e634a)</samp>](https://github.com/sam-goodwin/alchemy/commit/e634a953)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.54.0...v0.55.0)

---

## v0.54.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cli**: Add init command for existing projects &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/710 [<samp>(1e443)</samp>](https://github.com/sam-goodwin/alchemy/commit/1e443051)
- **cloudflare**: Wasm support + prisma example &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/741 [<samp>(2af8f)</samp>](https://github.com/sam-goodwin/alchemy/commit/2af8fa5f)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**:
  - Hard exit after sub-process exits &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(77516)</samp>](https://github.com/sam-goodwin/alchemy/commit/77516791)
- **cloudflare**:
  - Do not try to delete local D1 database &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(e81f7)</samp>](https://github.com/sam-goodwin/alchemy/commit/e81f7a20)
  - Align bundle platform, mainFields and conditions with wrangler &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/745 [<samp>(b683b)</samp>](https://github.com/sam-goodwin/alchemy/commit/b683b17f)
  - Nuxt example fails in dev &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/743 [<samp>(39cf6)</samp>](https://github.com/sam-goodwin/alchemy/commit/39cf6669)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.53.0...v0.54.0)

---

## v0.53.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Use queue name instead of queue id for queue consumers &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/740 [<samp>(3b7ba)</samp>](https://github.com/sam-goodwin/alchemy/commit/3b7ba776)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.52.0...v0.53.0)

---

## v0.52.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Local d1 migrations and do not create DB in dev &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/722 [<samp>(5fc11)</samp>](https://github.com/sam-goodwin/alchemy/commit/5fc1150a)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Explicit usage of workers-types &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/736 [<samp>(08a09)</samp>](https://github.com/sam-goodwin/alchemy/commit/08a09bc8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.51.3...v0.52.0)

---

## v0.51.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Include oldOutput in destroy when eagerly replacing &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/734 [<samp>(ac365)</samp>](https://github.com/sam-goodwin/alchemy/commit/ac3654f5)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.51.2...v0.51.3)

---

## v0.51.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Dev mode supports livestore &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/700 [<samp>(abf32)</samp>](https://github.com/sam-goodwin/alchemy/commit/abf32e0d)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.51.1...v0.51.2)

---

## v0.51.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Fetch all zones in findZoneForHostname &nbsp;-&nbsp; by **Andrew Jefferson** in https://github.com/sam-goodwin/alchemy/issues/729 [<samp>(ede6e)</samp>](https://github.com/sam-goodwin/alchemy/commit/ede6e53c)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.51.0...v0.51.1)

---

## v0.51.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: API Shield, Schema and API Gateway Operation &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/719 [<samp>(e963b)</samp>](https://github.com/sam-goodwin/alchemy/commit/e963b975)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Remove customViteReactPlugin from tanstack template &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/727 [<samp>(3bc50)</samp>](https://github.com/sam-goodwin/alchemy/commit/3bc50a37)
  - Certificate pack no longer returns undefined properties and can be replaced &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/714 [<samp>(a2170)</samp>](https://github.com/sam-goodwin/alchemy/commit/a2170b32)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.50.0...v0.51.0)

---

## v0.50.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Inherit process.env when executing build &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/726 [<samp>(4dcbe)</samp>](https://github.com/sam-goodwin/alchemy/commit/4dcbe346)
  - Don't require r2 access credentials to auto-empty bucket &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/725 [<samp>(63f6a)</samp>](https://github.com/sam-goodwin/alchemy/commit/63f6a6d3)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.49.1...v0.50.0)

---

## v0.49.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **core**: Configure parallel delete on Scope and Provider &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/718 [<samp>(b2c3f)</samp>](https://github.com/sam-goodwin/alchemy/commit/b2c3ff15)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Create route if it does not exist during update &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/716 [<samp>(7ea53)</samp>](https://github.com/sam-goodwin/alchemy/commit/7ea532b2)
- **core**:
  - Replace should use old resource state when deleting &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/715 [<samp>(9d91e)</samp>](https://github.com/sam-goodwin/alchemy/commit/9d91ea04)
  - Update zod peer dependency to support both v3 and v4 &nbsp;-&nbsp; by **Fabian Hedin** in https://github.com/sam-goodwin/alchemy/issues/720 [<samp>(cfcc8)</samp>](https://github.com/sam-goodwin/alchemy/commit/cfcc86c4)
  - Skip should not mark outer scope as skipped &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/721 [<samp>(976d1)</samp>](https://github.com/sam-goodwin/alchemy/commit/976d1b86)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.49.0...v0.49.1)

---

## v0.49.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: RateLimit binding for Cloudflare Workers &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/709 [<samp>(f0cf6)</samp>](https://github.com/sam-goodwin/alchemy/commit/f0cf654)
- **core**: Force updates &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/713 [<samp>(7013f)</samp>](https://github.com/sam-goodwin/alchemy/commit/7013fc6)
- **replace**: Replace no longer requires await &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/712 [<samp>(38e20)</samp>](https://github.com/sam-goodwin/alchemy/commit/38e20a2)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Fix tanstack build and dev command &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/702 [<samp>(77d6c)</samp>](https://github.com/sam-goodwin/alchemy/commit/77d6cf0)
- **core**: Don't log if scope skipped &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(5d103)</samp>](https://github.com/sam-goodwin/alchemy/commit/5d103b1)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.48.3...v0.49.0)

---

## v0.48.4

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Fix tanstack build and dev command &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/702 [<samp>(77d6c)</samp>](https://github.com/sam-goodwin/alchemy/commit/77d6cf0d)
- **core**: Don't log if scope skipped &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(5d103)</samp>](https://github.com/sam-goodwin/alchemy/commit/5d103b18)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.48.3...v0.48.4)

---

## v0.48.3

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Support cpu_ms limit on Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/707 [<samp>(090e4)</samp>](https://github.com/sam-goodwin/alchemy/commit/090e4a2)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.48.2...v0.48.3)

---

## v0.48.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Do not delete nested resources of a skipped resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/704 [<samp>(b25c7)</samp>](https://github.com/sam-goodwin/alchemy/commit/b25c739b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.48.1...v0.48.2)

---

## v0.48.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Support durable object websockets in miniflare &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/697 [<samp>(4ddd1)</samp>](https://github.com/sam-goodwin/alchemy/commit/4ddd1b75)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Improve atomicity of d1 migrations &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/694 [<samp>(d3a74)</samp>](https://github.com/sam-goodwin/alchemy/commit/d3a7466f)
  - Correct workers compatibility date &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/693 [<samp>(0bbe3)</samp>](https://github.com/sam-goodwin/alchemy/commit/0bbe341d)
  - Miniflare websocket requests don't include url path &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/701 [<samp>(6959f)</samp>](https://github.com/sam-goodwin/alchemy/commit/6959faad)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.48.0...v0.48.1)

---

## v0.48.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Replace `dev: "prefer-local &nbsp;-&nbsp; by **5df4c8f7** [<samp>(remot)</samp>](https://github.com/sam-goodwin/alchemy/commit/remote"` with `local: boolean`, `watch: boolean` (#641))

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.47.0...v0.48.0)

---

## v0.47.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Add Smart placement support to Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/691 [<samp>(db5d5)</samp>](https://github.com/sam-goodwin/alchemy/commit/db5d59fe)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Deprecate WorkerProps.env &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(8ea38)</samp>](https://github.com/sam-goodwin/alchemy/commit/8ea3803a)
  - Zones force alwaysUseHttps &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/679 [<samp>(da47b)</samp>](https://github.com/sam-goodwin/alchemy/commit/da47b1c9)
  - Wrangler config being read from incorrect path &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/683 [<samp>(7c325)</samp>](https://github.com/sam-goodwin/alchemy/commit/7c32546f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.46.1...v0.47.0)

---

## v0.46.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Add naked import of esbuild/bundle to resolve destroy error &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/674 [<samp>(f8c11)</samp>](https://github.com/sam-goodwin/alchemy/commit/f8c11092)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.46.0...v0.46.1)

---

## v0.46.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **aws**:
  - Support aws endpoint environment variable &nbsp;-&nbsp; by **Cristian Pallarés** in https://github.com/sam-goodwin/alchemy/issues/644 [<samp>(781fe)</samp>](https://github.com/sam-goodwin/alchemy/commit/781fe919)
- **cli**:
  - `deploy`, `destroy`, `dev` and `run` commands &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/636 [<samp>(1ca1c)</samp>](https://github.com/sam-goodwin/alchemy/commit/1ca1c093)
  - Add github actions in templates and git init step &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/624 [<samp>(932a5)</samp>](https://github.com/sam-goodwin/alchemy/commit/932a5f9c)
- **cloudflare**:
  - SQLite-backed durable object state store &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/630 [<samp>(af055)</samp>](https://github.com/sam-goodwin/alchemy/commit/af0558c7)
  - Add MySQL support to Hyperdrive resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/635 [<samp>(9cfc8)</samp>](https://github.com/sam-goodwin/alchemy/commit/9cfc8cff)
  - Use functions instead of classes for static bindings &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/588 [<samp>(819f6)</samp>](https://github.com/sam-goodwin/alchemy/commit/819f6260)
  - Login automatically or via cli &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/631 [<samp>(c59aa)</samp>](https://github.com/sam-goodwin/alchemy/commit/c59aadce)
  - Add compatibility presets to Cloudflare Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/526 [<samp>(5cdcb)</samp>](https://github.com/sam-goodwin/alchemy/commit/5cdcb22a)
  - Rename workers &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/619 [<samp>(2b518)</samp>](https://github.com/sam-goodwin/alchemy/commit/2b518bb9)
  - CloudflareStateStore and deprecate DOStateStore &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/665 [<samp>(779cf)</samp>](https://github.com/sam-goodwin/alchemy/commit/779cf6c9)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **aws**:
  - Revert AWS_ENDPOINT environment variable &nbsp;-&nbsp; by **Cristian Pallarés** in https://github.com/sam-goodwin/alchemy/issues/663 [<samp>(fd307)</samp>](https://github.com/sam-goodwin/alchemy/commit/fd3071e9)
- **cli**:
  - Remove negated flags &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/672 [<samp>(254bd)</samp>](https://github.com/sam-goodwin/alchemy/commit/254bd5a1)
- **cloudflare**:
  - Update keyword for adopting an existing vectorize index &nbsp;-&nbsp; by **Sergey Bekrin** in https://github.com/sam-goodwin/alchemy/issues/650 [<samp>(3d2c0)</samp>](https://github.com/sam-goodwin/alchemy/commit/3d2c097e)
  - Adopt Container when binding to a Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/661 [<samp>(fb9d9)</samp>](https://github.com/sam-goodwin/alchemy/commit/fb9d9d87)
  - Remote worker tail crash &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/642 [<samp>(d47b6)</samp>](https://github.com/sam-goodwin/alchemy/commit/d47b65d8)
- **test**:
  - Replace tests no longer have race condition &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/653 [<samp>(45df4)</samp>](https://github.com/sam-goodwin/alchemy/commit/45df403d)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.45.6...v0.46.0)

---

## v0.45.6

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**: Move build script to .ts &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/648 [<samp>(93ba3)</samp>](https://github.com/sam-goodwin/alchemy/commit/93ba3a2a)
- **cloudflare**: Build cloudflare container for linux/amd64 &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/651 [<samp>(dd947)</samp>](https://github.com/sam-goodwin/alchemy/commit/dd9479b0)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.45.5...v0.45.6)

---

## v0.45.5

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Adopt Worker with Queue event source &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/646 [<samp>(75d69)</samp>](https://github.com/sam-goodwin/alchemy/commit/75d6944f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.45.4...v0.45.5)

---

## v0.45.4

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Add duplex: "half" in miniflare http server &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/643 [<samp>(bfc4f)</samp>](https://github.com/sam-goodwin/alchemy/commit/bfc4f1a2)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.45.3...v0.45.4)

---

## v0.45.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Inline sourceMap for dev mode to avoid syntax error &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/639 [<samp>(4884d)</samp>](https://github.com/sam-goodwin/alchemy/commit/4884de08)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.45.2...v0.45.3)

---

## v0.45.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Set cwd on Worker dev command &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/638 [<samp>(31ee8)</samp>](https://github.com/sam-goodwin/alchemy/commit/31ee81ea)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.45.1...v0.45.2)

---

## v0.45.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **sqlite**: Include drizzle folder in NPM package &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/625 [<samp>(3c059)</samp>](https://github.com/sam-goodwin/alchemy/commit/3c059619)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.45.0...v0.45.1)

---

## v0.45.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - Default source_map to true for Workers &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/610 [<samp>(73652)</samp>](https://github.com/sam-goodwin/alchemy/commit/7365264c)
  - Remote worker hot reload + tail &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/543 [<samp>(815f2)</samp>](https://github.com/sam-goodwin/alchemy/commit/815f2c61)
  - Container.adopt &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/615 [<samp>(b327e)</samp>](https://github.com/sam-goodwin/alchemy/commit/b327e754)
- **sqlite**:
  - Sqlite state store with drizzle &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/593 [<samp>(f05e6)</samp>](https://github.com/sam-goodwin/alchemy/commit/f05e65e2)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Handle "./" in esbuild paths &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/614 [<samp>(4560f)</samp>](https://github.com/sam-goodwin/alchemy/commit/4560f904)
  - Normalize paths on windows &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/616 [<samp>(3f354)</samp>](https://github.com/sam-goodwin/alchemy/commit/3f354b42)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.44.4...v0.45.0)

---

## v0.44.4

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Update workers.dev URL when adopting a Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/611 [<samp>(f95ab)</samp>](https://github.com/sam-goodwin/alchemy/commit/f95ab4f0)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.44.3...v0.44.4)

---

## v0.44.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**: Setup postinstall script before installing vibe-rules &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(31643)</samp>](https://github.com/sam-goodwin/alchemy/commit/31643384)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.44.2...v0.44.3)

---

## v0.44.2

### &nbsp;&nbsp;&nbsp;🚀 Features

- **core**: Warning if pendingDeletions has corrupted resources &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/589 [<samp>(018b6)</samp>](https://github.com/sam-goodwin/alchemy/commit/018b6340)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **alchemy-web**:
  - Remove bad posthog domain &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/591 [<samp>(4c9fb)</samp>](https://github.com/sam-goodwin/alchemy/commit/4c9fbce1)
- **cli**:
  - Install vibe-rules dependency in project templates &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(44d9e)</samp>](https://github.com/sam-goodwin/alchemy/commit/44d9e520)
- **core**:
  - Remove redundant state.set &nbsp;-&nbsp; by **Sam Goodwin** and **sam** in https://github.com/sam-goodwin/alchemy/issues/600 [<samp>(63b7d)</samp>](https://github.com/sam-goodwin/alchemy/commit/63b7d6e2)
  - Prevent telemetry failures from causing system failures &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/602 [<samp>(4caf6)</samp>](https://github.com/sam-goodwin/alchemy/commit/4caf6ab8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.44.1...v0.44.2)

---

## v0.44.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Do not working with replace &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/587 [<samp>(16264)</samp>](https://github.com/sam-goodwin/alchemy/commit/16264513)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.44.0...v0.44.1)

---

## v0.44.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cli**:
  - Support vibe-rules integration &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/484 [<samp>(02388)</samp>](https://github.com/sam-goodwin/alchemy/commit/02388806)
- **cloudflare**:
  - Add transform?: { wrangler } hook to WranglerJson resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/559 [<samp>(68fe1)</samp>](https://github.com/sam-goodwin/alchemy/commit/68fe11fd)
  - Enable experimental_remote to target preview resources &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/573 [<samp>(0f4fd)</samp>](https://github.com/sam-goodwin/alchemy/commit/0f4fd88c)
  - Add esbuild plugin to detect node:* imports and warn about compatibility flags &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/527 [<samp>(28ced)</samp>](https://github.com/sam-goodwin/alchemy/commit/28ced5ee)
  - Add adopt property to ContainerApplication for existing app adoption &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/570 [<samp>(2054a)</samp>](https://github.com/sam-goodwin/alchemy/commit/2054a07e)
- **core**:
  - Simplify Scope's arguments and re-enable CI/CD &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/563 [<samp>(e63c7)</samp>](https://github.com/sam-goodwin/alchemy/commit/e63c7077)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Remove colons from nodejs-import-warning test &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/586 [<samp>(7fd8b)</samp>](https://github.com/sam-goodwin/alchemy/commit/7fd8b947)
- **cloudflare**:
  - Error on duplicate DO or Container Stable ID in bindings &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/561 [<samp>(75c7e)</samp>](https://github.com/sam-goodwin/alchemy/commit/75c7e9e6)
  - Set experimental_remote: true for dispatch namespace &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(4b12e)</samp>](https://github.com/sam-goodwin/alchemy/commit/4b12e354)
- **docker**:
  - Race condition in authorizing to docker registry &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/562 [<samp>(825ae)</samp>](https://github.com/sam-goodwin/alchemy/commit/825aef5f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.43.5...v0.44.0)

---

## v0.43.5

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Remove debug logs from create CLI &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(d41eb)</samp>](https://github.com/sam-goodwin/alchemy/commit/d41ebae7)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.43.4...v0.43.5)

---

## v0.43.4

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Include .env in astro, typescript and astro project templates &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/557 [<samp>(ee009)</samp>](https://github.com/sam-goodwin/alchemy/commit/ee009e2a)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.43.3...v0.43.4)

---

## v0.43.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Favor wrangler.main over main in Website &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/556 [<samp>(1c023)</samp>](https://github.com/sam-goodwin/alchemy/commit/1c023ab4)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.43.2...v0.43.3)

---

## v0.43.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Do not resolve wrangler.main before calling WranglerJson in Website &nbsp;-&nbsp; by **Michael K** [<samp>(cea1d)</samp>](https://github.com/sam-goodwin/alchemy/commit/cea1da04)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.43.1...v0.43.2)

---

## v0.43.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **os**: Allow secrets in Exec environment variables &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/538 [<samp>(911f7)</samp>](https://github.com/sam-goodwin/alchemy/commit/911f7ec0)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Node LTS compatibility - replace Promise.withResolvers &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/521 [<samp>(cb3af)</samp>](https://github.com/sam-goodwin/alchemy/commit/cb3af3aa)
- **cloudflare**:
  - Resolve wrangler.jsonc relative to worker cwd &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/519 [<samp>(e1b4c)</samp>](https://github.com/sam-goodwin/alchemy/commit/e1b4cdec)
  - Adopt inner CustomDomain and Route if Worker.adopt &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/540 [<samp>(c21c5)</samp>](https://github.com/sam-goodwin/alchemy/commit/c21c55a5)
  - Don't delete a versioned Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/541 [<samp>(fef08)</samp>](https://github.com/sam-goodwin/alchemy/commit/fef086f8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.43.0...v0.43.1)

---

## v0.43.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Align migration table of D1Database with wrangler & Drizzle &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/473 [<samp>(813c9)</samp>](https://github.com/sam-goodwin/alchemy/commit/813c92e6)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.42.1...v0.43.0)

---

## v0.42.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Pass through props.url from Website to Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/516 [<samp>(dfb9f)</samp>](https://github.com/sam-goodwin/alchemy/commit/dfb9f106)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.42.0...v0.42.1)

---

## v0.42.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - Miniflare container bindings &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/493 [<samp>(6740e)</samp>](https://github.com/sam-goodwin/alchemy/commit/6740eab1)
  - Resource for orange-js &nbsp;-&nbsp; by **Zeb Piasecki** in https://github.com/sam-goodwin/alchemy/issues/228 [<samp>(a5363)</samp>](https://github.com/sam-goodwin/alchemy/commit/a53638fe)
  - Add RedirectRule resource for Cloudflare single redirects &nbsp;-&nbsp; by **Justin Bennett** in https://github.com/sam-goodwin/alchemy/issues/500 [<samp>(55f13)</samp>](https://github.com/sam-goodwin/alchemy/commit/55f13ec0)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **fs**: Fix using "*" in filepaths on windows &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/512 [<samp>(c0c22)</samp>](https://github.com/sam-goodwin/alchemy/commit/c0c221b5)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.41.2...v0.42.0)

---

## v0.41.2

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Cloudflare Advanced Certificate Pack resource &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/487 [<samp>(b3a2f)</samp>](https://github.com/sam-goodwin/alchemy/commit/b3a2f425)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.41.1...v0.41.2)

---

## v0.41.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Consistent ports for miniflare dev server &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/496 [<samp>(5564c)</samp>](https://github.com/sam-goodwin/alchemy/commit/5564cb91)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.41.0...v0.41.1)

---

## v0.41.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Containers &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/476 [<samp>(43e88)</samp>](https://github.com/sam-goodwin/alchemy/commit/43e88e95)
- **github**: Add repo webhook resource &nbsp;-&nbsp; by **Justin Bennett** in https://github.com/sam-goodwin/alchemy/issues/477 [<samp>(2c997)</samp>](https://github.com/sam-goodwin/alchemy/commit/2c997d6f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.40.1...v0.41.0)

---

## v0.40.1

*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.40.0...v0.40.1)

---

## v0.40.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Miniflare dev server &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/396 [<samp>(3d219)</samp>](https://github.com/sam-goodwin/alchemy/commit/3d21941c)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: DOStateStore undefined fix &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/480 [<samp>(7d909)</samp>](https://github.com/sam-goodwin/alchemy/commit/7d9095e0)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.39.1...v0.40.0)

---

## v0.39.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Stage scope not being adopted &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/469 [<samp>(b949a)</samp>](https://github.com/sam-goodwin/alchemy/commit/b949aade)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.39.0...v0.39.1)

---

## v0.39.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Support Worker.domains for custom domains &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/468 [<samp>(7a357)</samp>](https://github.com/sam-goodwin/alchemy/commit/7a357763)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.38.1...v0.39.0)

---

## v0.38.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Do state store fails to upload &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/465 [<samp>(ca966)</samp>](https://github.com/sam-goodwin/alchemy/commit/ca966235)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.38.0...v0.38.1)

---

## v0.38.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cli**:
  - Complete cli overhaul with trpc-cli, zod, and clack/prompts &nbsp;-&nbsp; by **Aman Varshney** in https://github.com/sam-goodwin/alchemy/issues/405 [<samp>(dea9e)</samp>](https://github.com/sam-goodwin/alchemy/commit/dea9ed1e)
- **cloudflare**:
  - Pin default worker compatibility date to build time &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/460 [<samp>(10035)</samp>](https://github.com/sam-goodwin/alchemy/commit/100355b0)
  - Add URL support to WorkerStub &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/464 [<samp>(4fda9)</samp>](https://github.com/sam-goodwin/alchemy/commit/4fda99da)
- **core**:
  - Replace Resource &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/417 [<samp>(27133)</samp>](https://github.com/sam-goodwin/alchemy/commit/271331e1)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.37.2...v0.38.0)

---

## v0.37.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Defensively resolve __dirname and worker.ts > worker.js in DOStateStore &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/452 [<samp>(c63fd)</samp>](https://github.com/sam-goodwin/alchemy/commit/c63fdd60)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.37.1...v0.37.2)

---

## v0.37.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Relax Durable Object RPC type constraint &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/445 [<samp>(107e7)</samp>](https://github.com/sam-goodwin/alchemy/commit/107e79de)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: DOStateStore init uploads a worker and not a version &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/447 [<samp>(30cc6)</samp>](https://github.com/sam-goodwin/alchemy/commit/30cc6424)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.37.0...v0.37.1)

---

## v0.37.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Add `run_worker_first: string[]` option &nbsp;-&nbsp; by **Rahul Mishra** in https://github.com/sam-goodwin/alchemy/issues/440 [<samp>(d4b0d)</samp>](https://github.com/sam-goodwin/alchemy/commit/d4b0de34)
- **stripe**: Price meter support &nbsp;-&nbsp; by **Nick Balestra-Foster** in https://github.com/sam-goodwin/alchemy/issues/410 [<samp>(9315d)</samp>](https://github.com/sam-goodwin/alchemy/commit/9315d742)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Adopt DO that have migration tags &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/437 [<samp>(bcbd7)</samp>](https://github.com/sam-goodwin/alchemy/commit/bcbd7fdb)
  - Website resource respects cwd prop for wrangler.jsonc placement &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/443 [<samp>(bef17)</samp>](https://github.com/sam-goodwin/alchemy/commit/bef17985)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.36.0...v0.37.0)

---

## v0.36.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **docker**: Docker provider &nbsp;-&nbsp; by **Pavitra Golchha** in https://github.com/sam-goodwin/alchemy/issues/189 [<samp>(6f973)</samp>](https://github.com/sam-goodwin/alchemy/commit/6f973983)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cli**: Improve package manager handling in create-alchemy &nbsp;-&nbsp; by **Nico Baier** in https://github.com/sam-goodwin/alchemy/issues/423 [<samp>(d0c7c)</samp>](https://github.com/sam-goodwin/alchemy/commit/d0c7ce83)
- **core**: Allow colors in CI environments, only disable for NO_COLOR &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/429 [<samp>(a194a)</samp>](https://github.com/sam-goodwin/alchemy/commit/a194ab5a)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.35.1...v0.36.0)

---

## v0.35.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **fs**: Better support for windows file system &nbsp;-&nbsp; by **Michael K** in https://github.com/sam-goodwin/alchemy/issues/430 [<samp>(8dd9f)</samp>](https://github.com/sam-goodwin/alchemy/commit/8dd9f196)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.35.0...v0.35.1)

---

## v0.35.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Set force=true when deleting a Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/432 [<samp>(2b21d)</samp>](https://github.com/sam-goodwin/alchemy/commit/2b21d41e)
  - Call wfp endpoint when deleting workers &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/434 [<samp>(d109d)</samp>](https://github.com/sam-goodwin/alchemy/commit/d109d984)
- **core**:
  - Ensure alchemy providers are globally registered &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/433 [<samp>(b0528)</samp>](https://github.com/sam-goodwin/alchemy/commit/b05284f6)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.34.3...v0.35.0)

---

## v0.34.3

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - Support RPC type in WorkerStub &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/425 [<samp>(0b682)</samp>](https://github.com/sam-goodwin/alchemy/commit/0b682dac)
  - Support adopting Queue Consumer &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/431 [<samp>(82b2d)</samp>](https://github.com/sam-goodwin/alchemy/commit/82b2d018)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.34.2...v0.34.3)

---

## v0.34.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Export WorkerStub &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/424 [<samp>(34cb0)</samp>](https://github.com/sam-goodwin/alchemy/commit/34cb09b8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.34.1...v0.34.2)

---

## v0.34.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **aws**: S3StateStore &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/419 [<samp>(73b90)</samp>](https://github.com/sam-goodwin/alchemy/commit/73b907b5)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.34.0...v0.34.1)

---

## v0.34.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Add preview IDs for KV, D1, and R2 in wrangler.json &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/413 [<samp>(4a59d)</samp>](https://github.com/sam-goodwin/alchemy/commit/4a59d3a3)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.33.1...v0.34.0)

---

## v0.33.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Use dispatch namespace asset upload for WFP &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/412 [<samp>(bf6b5)</samp>](https://github.com/sam-goodwin/alchemy/commit/bf6b5b80)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.33.0...v0.33.1)

---

## v0.33.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **stripe**: Add Full Tier Support for Stripe Prices &nbsp;-&nbsp; by **Nick Balestra-Foster** in https://github.com/sam-goodwin/alchemy/issues/406 [<samp>(7691c)</samp>](https://github.com/sam-goodwin/alchemy/commit/7691c2ce)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Configure Websites to support SSR by default &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/409 [<samp>(72521)</samp>](https://github.com/sam-goodwin/alchemy/commit/72521e8f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.32.1...v0.33.0)

---

## v0.32.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Fix SSR for astro by setting not_found_hanlding=none &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/407 [<samp>(7750f)</samp>](https://github.com/sam-goodwin/alchemy/commit/7750f024)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.32.0...v0.32.1)

---

## v0.32.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Add Worker version/preview support with labels &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/351 [<samp>(615fc)</samp>](https://github.com/sam-goodwin/alchemy/commit/615fc9d1)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.31.0...v0.32.0)

---

## v0.31.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Bug in create vitejs &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(4efe2)</samp>](https://github.com/sam-goodwin/alchemy/commit/4efe232e)
- Move required and internal peerDeps to deps &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/402 [<samp>(31d92)</samp>](https://github.com/sam-goodwin/alchemy/commit/31d924d2)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.30.1...v0.31.0)

---

## v0.30.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - Auto-create default secrets store &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/395 [<samp>(3251d)</samp>](https://github.com/sam-goodwin/alchemy/commit/3251d1e1)
  - Add SecretKey binding support for Cloudflare Workers &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/385 [<samp>(08278)</samp>](https://github.com/sam-goodwin/alchemy/commit/082785a1)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Secret binding type &nbsp;-&nbsp; by **Tyler van Hensbergen** in https://github.com/sam-goodwin/alchemy/issues/398 [<samp>(724d9)</samp>](https://github.com/sam-goodwin/alchemy/commit/724d9c26)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.30.0...v0.30.1)

---

## v0.30.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Implement alchemy create CLI &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/376 [<samp>(85a8e)</samp>](https://github.com/sam-goodwin/alchemy/commit/85a8e2f8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.29.3...v0.30.0)

---

## v0.29.3

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Allow binding individual secrets &nbsp;-&nbsp; by **Tyler van Hensbergen** in https://github.com/sam-goodwin/alchemy/issues/393 [<samp>(39483)</samp>](https://github.com/sam-goodwin/alchemy/commit/394833a4)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Ensure global Secret list is stored on globalThis &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(8733a)</samp>](https://github.com/sam-goodwin/alchemy/commit/8733a38f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.29.2...v0.29.3)

---

## v0.29.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Use Symbol instead of instanceof for checking Secret and Scope &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/391 [<samp>(be1c1)</samp>](https://github.com/sam-goodwin/alchemy/commit/be1c156e)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.29.1...v0.29.2)

---

## v0.29.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **core**: Ensure Scope AsyncLocalStorage is unique singleton even with multiple alchemy instances &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/390 [<samp>(1c113)</samp>](https://github.com/sam-goodwin/alchemy/commit/1c113177)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.29.0...v0.29.1)

---

## v0.29.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Add automatic CLI argument parsing to alchemy() function &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/356 [<samp>(ddf55)</samp>](https://github.com/sam-goodwin/alchemy/commit/ddf55085)
- **github**: Add GitHub Comment resource for issue and PR comments &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/365 [<samp>(a4a82)</samp>](https://github.com/sam-goodwin/alchemy/commit/a4a82185)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Handle null upload result &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/367 [<samp>(d6681)</samp>](https://github.com/sam-goodwin/alchemy/commit/d66817af)
  - SecretsStore adoption logic to check existing store before creating &nbsp;-&nbsp; by **Tyler van Hensbergen** in https://github.com/sam-goodwin/alchemy/issues/378 [<samp>(3d542)</samp>](https://github.com/sam-goodwin/alchemy/commit/3d542533)
  - 404 error when deploying dofs state store &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/379 [<samp>(f5b7e)</samp>](https://github.com/sam-goodwin/alchemy/commit/f5b7e5d9)
- **core**:
  - Export Scope class &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(78877)</samp>](https://github.com/sam-goodwin/alchemy/commit/788773ca)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.28.0...v0.29.0)

---

## v0.28.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Remove interactive CLI that brought in Ink and React from alchemy dependency and &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/360 [<samp>(e7797)</samp>](https://github.com/sam-goodwin/alchemy/commit/e77976f7)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.27.0...v0.28.0)

---

## v0.27.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Rename dispatchNamespace property to namespace &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(3e6c6)</samp>](https://github.com/sam-goodwin/alchemy/commit/3e6c6f6f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.26.1...v0.27.0)

---

## v0.26.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Implement DispatchNamespace resource and Worker dispatch namespace support &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/343 [<samp>(0a13a)</samp>](https://github.com/sam-goodwin/alchemy/commit/0a13aa15)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.26.0...v0.26.1)

---

## v0.26.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Anonymous telemetry with opt-out &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/302 [<samp>(d2c53)</samp>](https://github.com/sam-goodwin/alchemy/commit/d2c53f5c)
- Add fancy deployment CLI &nbsp;-&nbsp; by **Rahul Mishra** in https://github.com/sam-goodwin/alchemy/issues/315 [<samp>(5efac)</samp>](https://github.com/sam-goodwin/alchemy/commit/5efac184)
- **cloudflare**:
  - Add Cloudflare Email Routing resources &nbsp;-&nbsp; by **Sam Goodwin** and **sam-goodwin** in https://github.com/sam-goodwin/alchemy/issues/314 [<samp>(5a3df)</samp>](https://github.com/sam-goodwin/alchemy/commit/5a3df036)
  - Add adopt support to Pipeline resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/318 [<samp>(c9f23)</samp>](https://github.com/sam-goodwin/alchemy/commit/c9f2387b)
  - Add SvelteKit on Cloudflare Workers guide using Alchemy &nbsp;-&nbsp; by **Jordan Coeyman** in https://github.com/sam-goodwin/alchemy/issues/271 [<samp>(c516c)</samp>](https://github.com/sam-goodwin/alchemy/commit/c516c47d)
  - Add Astro resource for Cloudflare deployment &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/330 [<samp>(dbea5)</samp>](https://github.com/sam-goodwin/alchemy/commit/dbea5738)
  - Add routes support to Worker and Website resources &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/336 [<samp>(510e2)</samp>](https://github.com/sam-goodwin/alchemy/commit/510e29a4)
  - Add Cloudflare Images binding support &nbsp;-&nbsp; in https://github.com/sam-goodwin/alchemy/issues/239 [<samp>(a785d)</samp>](https://github.com/sam-goodwin/alchemy/commit/a785d28f)
  - Secrets Store and Secret &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/296 [<samp>(b1979)</samp>](https://github.com/sam-goodwin/alchemy/commit/b1979873)
- **planetscale**:
  - Planetscale databases & branch &nbsp;-&nbsp; by **NickBlow** in https://github.com/sam-goodwin/alchemy/issues/268 [<samp>(3b79a)</samp>](https://github.com/sam-goodwin/alchemy/commit/3b79a49a)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Fallback to console if no scope is available &nbsp;-&nbsp; by **Rahul Mishra** in https://github.com/sam-goodwin/alchemy/issues/325 [<samp>(34e0a)</samp>](https://github.com/sam-goodwin/alchemy/commit/34e0aa8b)
- Log tasks in destroy &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(f2465)</samp>](https://github.com/sam-goodwin/alchemy/commit/f2465b42)
- Use logical OR operator for BRANCH_PREFIX fallback &nbsp;-&nbsp; by **Sam Goodwin** and **sam-goodwin** in https://github.com/sam-goodwin/alchemy/issues/327 [<samp>(66990)</samp>](https://github.com/sam-goodwin/alchemy/commit/66990e81)
- **aws**:
  - Include output attributes in generated resource types &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/322 [<samp>(b87b3)</samp>](https://github.com/sam-goodwin/alchemy/commit/b87b3560)
- **cloudflare**:
  - Filter duplicate compat flags &nbsp;-&nbsp; by **NickBlow** in https://github.com/sam-goodwin/alchemy/issues/300 [<samp>(5d53c)</samp>](https://github.com/sam-goodwin/alchemy/commit/5d53c52f)
  - Error on R2Bucket name change during update &nbsp;-&nbsp; in https://github.com/sam-goodwin/alchemy/issues/246 [<samp>(640d7)</samp>](https://github.com/sam-goodwin/alchemy/commit/640d71ed)
- **telemetry**:
  - Remove file buffer to resolve "enoent" error &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/333 [<samp>(eb8e5)</samp>](https://github.com/sam-goodwin/alchemy/commit/eb8e5f59)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.25.0...v0.26.0)

---

## v0.25.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Add getZoneByDomain function &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/313 [<samp>(17f55)</samp>](https://github.com/sam-goodwin/alchemy/commit/17f558b8)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **aws**: Update fast-json-patch import for Node.js compatibility &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/316 [<samp>(d0ea5)</samp>](https://github.com/sam-goodwin/alchemy/commit/d0ea5a6c)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.24.1...v0.25.0)

---

## v0.24.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - DOFS state store &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/266 [<samp>(19dea)</samp>](https://github.com/sam-goodwin/alchemy/commit/19deabd)
  - Support binding to an external worker by name &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/280 [<samp>(383e4)</samp>](https://github.com/sam-goodwin/alchemy/commit/383e420)
  - Allow skipping or memoizing build in Website &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/281 [<samp>(087b2)</samp>](https://github.com/sam-goodwin/alchemy/commit/087b2f0)
- **fs**:
  - Allow overriding .alchemy dir &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/274 [<samp>(24896)</samp>](https://github.com/sam-goodwin/alchemy/commit/2489642)
- **stripe**:
  - Implement 10 missing Stripe resources for terraform parity &nbsp;-&nbsp; in https://github.com/sam-goodwin/alchemy/issues/251 [<samp>(c938b)</samp>](https://github.com/sam-goodwin/alchemy/commit/c938be6)
  - Add adoption pattern to all Stripe resources &nbsp;-&nbsp; in https://github.com/sam-goodwin/alchemy/issues/275 [<samp>(18ae6)</samp>](https://github.com/sam-goodwin/alchemy/commit/18ae67a)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.24.0...v0.24.1)

---

## v0.24.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Add dead letter queue support to Cloudflare Queue &nbsp;-&nbsp; in https://github.com/sam-goodwin/alchemy/issues/243 [<samp>(bdd12)</samp>](https://github.com/sam-goodwin/alchemy/commit/bdd12e1)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **aws**: AWS Control API type generation &nbsp;-&nbsp; by **Tyler van Hensbergen** in https://github.com/sam-goodwin/alchemy/issues/265 [<samp>(12835)</samp>](https://github.com/sam-goodwin/alchemy/commit/12835a2)
- **cloudflare**: Version Metadata Type Mapping &nbsp;-&nbsp; in https://github.com/sam-goodwin/alchemy/issues/252 [<samp>(32035)</samp>](https://github.com/sam-goodwin/alchemy/commit/32035e3)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.23.0...v0.24.0)

---

## v0.23.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **aws**:
  - SSMParameter &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(3202a)</samp>](https://github.com/sam-goodwin/alchemy/commit/3202a51)
- **cloudflare**:
  - Implement Cloudflare Version Metadata binding &nbsp;-&nbsp; in https://github.com/sam-goodwin/alchemy/issues/240 [<samp>(de057)</samp>](https://github.com/sam-goodwin/alchemy/commit/de05723)
  - Support cross-binding to Workflow &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/254 [<samp>(abaea)</samp>](https://github.com/sam-goodwin/alchemy/commit/abaeae7)
  - Default Worker.url to true &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/255 [<samp>(d9403)</samp>](https://github.com/sam-goodwin/alchemy/commit/d94031a)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Export analytics engine dataset binding from cloudflare &nbsp;-&nbsp; by **Oliver Stenbom** in https://github.com/sam-goodwin/alchemy/issues/267 [<samp>(2f79e)</samp>](https://github.com/sam-goodwin/alchemy/commit/2f79e9e)
- **aws**:
  - Include types.d.ts file in lib &nbsp;-&nbsp; by **Tyler van Hensbergen** in https://github.com/sam-goodwin/alchemy/issues/264 [<samp>(47bc4)</samp>](https://github.com/sam-goodwin/alchemy/commit/47bc4d3)
  - Include typeName when destroying Cloud Control Resources &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/256 [<samp>(cb4b9)</samp>](https://github.com/sam-goodwin/alchemy/commit/cb4b966)
- **cloudflare**:
  - Always write wrangler.json &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(b1830)</samp>](https://github.com/sam-goodwin/alchemy/commit/b183081)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.22.3...v0.23.0)

---

## v0.22.4

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Implement Cloudflare Version Metadata binding &nbsp;-&nbsp; in https://github.com/sam-goodwin/alchemy/issues/240 [<samp>(de057)</samp>](https://github.com/sam-goodwin/alchemy/commit/de05723)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Always write wrangler.json &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(b1830)</samp>](https://github.com/sam-goodwin/alchemy/commit/b183081)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.22.3...v0.22.4)
---
## v0.22.3

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Worker supports noBundle to upload multiple modules &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/238 [<samp>(672e5)</samp>](https://github.com/sam-goodwin/alchemy/commit/672e508)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.22.2...v0.22.3)
---
## v0.22.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Always write wrangler.json &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/235 [<samp>(3c8b4)</samp>](https://github.com/sam-goodwin/alchemy/commit/3c8b4e8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.22.1...v0.22.2)
---
## v0.22.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Bundle wasm modules &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/231 [<samp>(df72e)</samp>](https://github.com/sam-goodwin/alchemy/commit/df72e58)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Pass through custom loaders to bundleWorker &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(fca7c)</samp>](https://github.com/sam-goodwin/alchemy/commit/fca7cba)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.22.0...v0.22.1)
---
## v0.22.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: React Router and generate Website's wrangler.json before build &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/225 [<samp>(e44e5)</samp>](https://github.com/sam-goodwin/alchemy/commit/e44e5b4)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.21.0...v0.22.0)
---
## v0.21.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - Determine DO class migrations using server-side state &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/222 [<samp>(d7c0d)</samp>](https://github.com/sam-goodwin/alchemy/commit/d7c0d2c)
  - Worker RPC binding types &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/223 [<samp>(05535)</samp>](https://github.com/sam-goodwin/alchemy/commit/055354c)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.20.1...v0.21.0)
---
## v0.20.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Support binding to a DO hosted in another Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/219 [<samp>(4d8ac)</samp>](https://github.com/sam-goodwin/alchemy/commit/4d8ac51)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.20.0...v0.20.1)
---
## v0.20.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Durable Object RPC types &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/212 [<samp>(78bab)</samp>](https://github.com/sam-goodwin/alchemy/commit/78bab20)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Better documentation for missing Secret password &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/211 [<samp>(78c2a)</samp>](https://github.com/sam-goodwin/alchemy/commit/78c2ab3)
- **cloudflare**:
  - Do not include eventSources when uploading stub worker during delete phase &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/216 [<samp>(c8fb3)</samp>](https://github.com/sam-goodwin/alchemy/commit/c8fb357)
  - Do not polyfill non-node.js modules &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/214 [<samp>(423e8)</samp>](https://github.com/sam-goodwin/alchemy/commit/423e8ca)
  - Improve error message when failing to resolve Cloudflare Account ID &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/213 [<samp>(15c9a)</samp>](https://github.com/sam-goodwin/alchemy/commit/15c9adc)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.19.0...v0.20.0)
---
## v0.19.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Default Website.wrangler to true &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/210 [<samp>(b8b29)</samp>](https://github.com/sam-goodwin/alchemy/commit/b8b29b4)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.18.0...v0.19.0)
---
## v0.18.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Add AWS Cloud Control API support &nbsp;-&nbsp; by **Naor Peled** in https://github.com/sam-goodwin/alchemy/issues/132 [<samp>(08d3a)</samp>](https://github.com/sam-goodwin/alchemy/commit/08d3a17)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.17.2...v0.18.0)
---
## v0.17.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **vercel**: Do not patch name or resourceConfig in Project &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/206 [<samp>(7d2c8)</samp>](https://github.com/sam-goodwin/alchemy/commit/7d2c8d5)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.17.1...v0.17.2)
---
## v0.17.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Set d1 read replication on create &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/204 [<samp>(c3aee)</samp>](https://github.com/sam-goodwin/alchemy/commit/c3aee63)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.17.0...v0.17.1)
---
## v0.17.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Bootstrap &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/169 [<samp>(78603)</samp>](https://github.com/sam-goodwin/alchemy/commit/78603bb)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.10...v0.17.0)
---
## v0.16.10

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Cloudflare workers analytics engine binding &nbsp;-&nbsp; by **Oliver Stenbom** in https://github.com/sam-goodwin/alchemy/issues/187 [<samp>(be2cb)</samp>](https://github.com/sam-goodwin/alchemy/commit/be2cb82)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- VercelProject 400 with gitRepository &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/202 [<samp>(d0f1a)</samp>](https://github.com/sam-goodwin/alchemy/commit/d0f1ae7)
- **cloudflare**:
  - Pass cwd to Exec in Website &nbsp;-&nbsp; by **Nick Balestra-Foster** in https://github.com/sam-goodwin/alchemy/issues/196 [<samp>(a0437)</samp>](https://github.com/sam-goodwin/alchemy/commit/a043730)
  - Write cron triggers to wrangler.json &nbsp;-&nbsp; by **sam** and **Jonas Templestein** in https://github.com/sam-goodwin/alchemy/issues/203 [<samp>(74208)</samp>](https://github.com/sam-goodwin/alchemy/commit/7420885)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.9...v0.16.10)
---
## v0.16.9

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Allow no-op update of vectorize index and metadata index &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/198 [<samp>(de74c)</samp>](https://github.com/sam-goodwin/alchemy/commit/de74c4c)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.8...v0.16.9)
---
## v0.16.8

### &nbsp;&nbsp;&nbsp;🚀 Features

- **vercel**: Add Project and ProjectDomain Resources &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/191 [<samp>(67692)</samp>](https://github.com/sam-goodwin/alchemy/commit/67692ab)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.7...v0.16.8)
---
## v0.16.7

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Add Cloudflare AccountId resource &nbsp;-&nbsp; by **Andrew Jefferson** and **Bun Peek** in https://github.com/sam-goodwin/alchemy/issues/195 [<samp>(bf037)</samp>](https://github.com/sam-goodwin/alchemy/commit/bf037e9)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Open up policy and scope types for AccountApiToken &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/194 [<samp>(ab27b)</samp>](https://github.com/sam-goodwin/alchemy/commit/ab27bac)
  - Update vectorize_indexes to vectorize in wrangler.json.ts &nbsp;-&nbsp; by **Ryan Mierzejewski** in https://github.com/sam-goodwin/alchemy/issues/197 [<samp>(deb7e)</samp>](https://github.com/sam-goodwin/alchemy/commit/deb7ed1)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.6...v0.16.7)
---
## v0.16.6

### &nbsp;&nbsp;&nbsp;🚀 Features

- **sentry**: Team, Project, ClientKey &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/190 [<samp>(94814)</samp>](https://github.com/sam-goodwin/alchemy/commit/9481450)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.5...v0.16.6)
---
## v0.16.5

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Allow binding to a KV namespace by UUID &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/188 [<samp>(e3fc3)</samp>](https://github.com/sam-goodwin/alchemy/commit/e3fc34b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.4...v0.16.5)
---
## v0.16.4

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Alchemy.run throws exception when phase === "read" &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/184 [<samp>(753b8)</samp>](https://github.com/sam-goodwin/alchemy/commit/753b889)
- **cloudflare**: Default to ./dist/client for Vite.js &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/182 [<samp>(5e470)</samp>](https://github.com/sam-goodwin/alchemy/commit/5e470c4)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.3...v0.16.4)
---
## v0.16.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Allow D1 update read replication mode when primary location hint is explcitly set &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/181 [<samp>(9a87b)</samp>](https://github.com/sam-goodwin/alchemy/commit/9a87b2f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.2...v0.16.3)
---
## v0.16.2

### &nbsp;&nbsp;&nbsp;🚀 Features

- **os**: Memoize exec from file patterns &nbsp;-&nbsp; by **John Royal** in https://github.com/sam-goodwin/alchemy/issues/180 [<samp>(fd737)</samp>](https://github.com/sam-goodwin/alchemy/commit/fd73742)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.1...v0.16.2)
---
## v0.16.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Move core Resource properties to Symbols &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/177 [<samp>(500e2)</samp>](https://github.com/sam-goodwin/alchemy/commit/500e22f)
- **cloudflare**: Use Worker name for Worker to Worker binding &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/178 [<samp>(fbc9a)</samp>](https://github.com/sam-goodwin/alchemy/commit/fbc9a77)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.16.0...v0.16.1)
---
## v0.16.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Do not always write a Scope and validate READ phase &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/176 [<samp>(2e135)</samp>](https://github.com/sam-goodwin/alchemy/commit/2e1352f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.14...v0.16.0)
---
## v0.15.14

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Scope.phase is undefined when initializing stateStore &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/173 [<samp>(963a3)</samp>](https://github.com/sam-goodwin/alchemy/commit/963a37b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.13...v0.15.14)
---
## v0.15.13

### &nbsp;&nbsp;&nbsp;🚀 Features

- **upstash**: Add alchemy/upstash with UpstashRedis Resource &nbsp;-&nbsp; by **Eric Clemmons** [<samp>(0f26f)</samp>](https://github.com/sam-goodwin/alchemy/commit/0f26fad)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.12...v0.15.13)
---
## v0.15.12

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Auto-resolve permission group IDs in AccountApiToken and simplify interface &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/171 [<samp>(f5e07)</samp>](https://github.com/sam-goodwin/alchemy/commit/f5e0751)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.11...v0.15.12)
---
## v0.15.11

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Clone D1 Database &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/170 [<samp>(b7da2)</samp>](https://github.com/sam-goodwin/alchemy/commit/b7da276)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.10...v0.15.11)
---
## v0.15.10

### &nbsp;&nbsp;&nbsp;🚀 Features

- Add Lookup Key to Stripe Price &nbsp;-&nbsp; by **NickBlow** in https://github.com/sam-goodwin/alchemy/issues/162 [<samp>(7f7a1)</samp>](https://github.com/sam-goodwin/alchemy/commit/7f7a18d)
- **aws**: Support lambda layers in aws/Function &nbsp;-&nbsp; by **Austin Blythe** in https://github.com/sam-goodwin/alchemy/issues/161 [<samp>(329c1)</samp>](https://github.com/sam-goodwin/alchemy/commit/329c1da)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.9...v0.15.10)
---
## v0.15.9

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Include workflows in wrangler.json &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/160 [<samp>(9bb74)</samp>](https://github.com/sam-goodwin/alchemy/commit/9bb74ba)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.8...v0.15.9)
---
## v0.15.8

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Mark cloudflare:workflows as external &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/159 [<samp>(5146d)</samp>](https://github.com/sam-goodwin/alchemy/commit/5146d5f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.7...v0.15.8)
---
## v0.15.7

### &nbsp;&nbsp;&nbsp;🚀 Features

- **stripe**: Meter Resource &nbsp;-&nbsp; by **NickBlow** in https://github.com/sam-goodwin/alchemy/issues/155 [<samp>(ff080)</samp>](https://github.com/sam-goodwin/alchemy/commit/ff08054)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.6...v0.15.7)
---
## v0.15.6

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - `adopt` and `delete` switches for KV namespace &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/153 [<samp>(60236)</samp>](https://github.com/sam-goodwin/alchemy/commit/602369f)
  - Route resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/154 [<samp>(55ec3)</samp>](https://github.com/sam-goodwin/alchemy/commit/55ec3da)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Include migrations for DOs new_classes and new_sqlite_classes in generated wrangler.json &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/156 [<samp>(eed04)</samp>](https://github.com/sam-goodwin/alchemy/commit/eed044b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.5...v0.15.6)
---
## v0.15.5

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Add preview_* properties to wrangler json type &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/129 [<samp>(66f01)</samp>](https://github.com/sam-goodwin/alchemy/commit/66f012f)
  - Use worker name for self binding &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(bf300)</samp>](https://github.com/sam-goodwin/alchemy/commit/bf300d4)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.4...v0.15.5)
---
## v0.15.4

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Allow binding a Worker to itself &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/151 [<samp>(e0d50)</samp>](https://github.com/sam-goodwin/alchemy/commit/e0d50ae)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Do not apply new_class_migration to a Workflow &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/152 [<samp>(b5d9f)</samp>](https://github.com/sam-goodwin/alchemy/commit/b5d9f73)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.3...v0.15.4)
---
## v0.15.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- CF_ACCOUNT_ID and include status code in CloudflareApiError &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/141 [<samp>(26a66)</samp>](https://github.com/sam-goodwin/alchemy/commit/26a6656)
- Support resolving account ID for account access token &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/142 [<samp>(ae143)</samp>](https://github.com/sam-goodwin/alchemy/commit/ae14370)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.2...v0.15.3)
---
## v0.15.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- CreateRequire if require is not defined &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/139 [<samp>(d96dd)</samp>](https://github.com/sam-goodwin/alchemy/commit/d96dd0f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.1...v0.15.2)
---
## v0.15.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Use / as delimiter when listing in r2 rest state store &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/138 [<samp>(57a45)</samp>](https://github.com/sam-goodwin/alchemy/commit/57a4584)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.15.0...v0.15.1)
---
## v0.15.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Propagate state store to nested scopes &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/136 [<samp>(a52a4)</samp>](https://github.com/sam-goodwin/alchemy/commit/a52a438)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.14.1...v0.15.0)
---
## v0.14.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **aws**: Parse Function handler properly &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/137 [<samp>(b9c15)</samp>](https://github.com/sam-goodwin/alchemy/commit/b9c15eb)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.14.0...v0.14.1)
---
## v0.14.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Respect CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/133 [<samp>(c81b8)</samp>](https://github.com/sam-goodwin/alchemy/commit/c81b813)
- **cloudflare**: Align with wrangler bundling for v1, aliases, als &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/125 [<samp>(46758)</samp>](https://github.com/sam-goodwin/alchemy/commit/4675892)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.13.0...v0.14.0)
---
## v0.13.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Read phase for reconstructing state without applying changes &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/128 [<samp>(4f8b8)</samp>](https://github.com/sam-goodwin/alchemy/commit/4f8b8da)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.21...v0.13.0)
---
## v0.12.21

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- .js import of dedent &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(7b9ff)</samp>](https://github.com/sam-goodwin/alchemy/commit/7b9ff3c)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.20...v0.12.21)
---
## v0.12.20

*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.19...v0.12.20)
---
## v0.12.19

### &nbsp;&nbsp;&nbsp;🚀 Features

- Neon now supports pg 17, make 16 default &nbsp;-&nbsp; by **Ryan Mierzejewski** in https://github.com/sam-goodwin/alchemy/issues/122 [<samp>(ec95a)</samp>](https://github.com/sam-goodwin/alchemy/commit/ec95a77)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Polyfill node apis with unenv &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/123 [<samp>(709a3)</samp>](https://github.com/sam-goodwin/alchemy/commit/709a381)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.18...v0.12.19)
---
## v0.12.18

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Ai binding &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/121 [<samp>(48bf9)</samp>](https://github.com/sam-goodwin/alchemy/commit/48bf9a9)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.17...v0.12.18)
---
## v0.12.17

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Export serde &nbsp;-&nbsp; by **Eric Clemmons** [<samp>(1fe7d)</samp>](https://github.com/sam-goodwin/alchemy/commit/1fe7d8a)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.16...v0.12.17)
---
## v0.12.16

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**: Output 'browser' binding to wrangler.jsonc &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/113 [<samp>(6e139)</samp>](https://github.com/sam-goodwin/alchemy/commit/6e1399b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.15...v0.12.16)
---
## v0.12.15

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**:
  - BrowserRendering &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/110 [<samp>(3caad)</samp>](https://github.com/sam-goodwin/alchemy/commit/3caad13)
  - Support disabling deletion of Cloudflare Zone &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/111 [<samp>(3c8c4)</samp>](https://github.com/sam-goodwin/alchemy/commit/3c8c4f7)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.14...v0.12.15)
---
## v0.12.14

### &nbsp;&nbsp;&nbsp;🚀 Features

- Export Bindings.Runtime and Bound &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(2e469)</samp>](https://github.com/sam-goodwin/alchemy/commit/2e469f1)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.13...v0.12.14)
---
## v0.12.13

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Export AlchemyOptions from root &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(bc365)</samp>](https://github.com/sam-goodwin/alchemy/commit/bc3657f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.12...v0.12.13)
---
## v0.12.12

### &nbsp;&nbsp;&nbsp;🚀 Features

- WranglerJson returns `spec` for re-use &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/107 [<samp>(70fe7)</samp>](https://github.com/sam-goodwin/alchemy/commit/70fe7be)
- **cloudflare**: Default R2RestStateStore bucketName to alchemy-state &nbsp;-&nbsp; by **Eric Clemmons** in https://github.com/sam-goodwin/alchemy/issues/102 [<samp>(99f0b)</samp>](https://github.com/sam-goodwin/alchemy/commit/99f0b5d)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Website bundling for all frameworks and add smoke tests &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/99 [<samp>(29c6a)</samp>](https://github.com/sam-goodwin/alchemy/commit/29c6aa6)
- Exec should throw on non-zero exit code &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/106 [<samp>(0a6eb)</samp>](https://github.com/sam-goodwin/alchemy/commit/0a6eb17)
- **os**: Pipe exec stdout and stderr &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(be927)</samp>](https://github.com/sam-goodwin/alchemy/commit/be9279b)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.9...v0.12.12)
---
## v0.12.9

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- R2 rest state store list &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/98 [<samp>(ca36c)</samp>](https://github.com/sam-goodwin/alchemy/commit/ca36cc6)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.8...v0.12.9)
---
## v0.12.8

### &nbsp;&nbsp;&nbsp;🚀 Features

- Default Worker and D1 names to id &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/93 [<samp>(058e9)</samp>](https://github.com/sam-goodwin/alchemy/commit/058e938)
- **cloudflare**: Configure QueueConsumer for Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/96 [<samp>(5eb91)</samp>](https://github.com/sam-goodwin/alchemy/commit/5eb91e5)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.7...v0.12.8)
---
## v0.12.7

### &nbsp;&nbsp;&nbsp;🚀 Features

- Cloudflare Hyperdrive & Neon Project &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/87 [<samp>(a3a79)</samp>](https://github.com/sam-goodwin/alchemy/commit/a3a79d5)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.6...v0.12.7)
---
## v0.12.6

### &nbsp;&nbsp;&nbsp;🚀 Features

- Worker cron triggers &nbsp;-&nbsp; by **Jake Correa** in https://github.com/sam-goodwin/alchemy/issues/86 [<samp>(191db)</samp>](https://github.com/sam-goodwin/alchemy/commit/191dbc3)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.5...v0.12.6)
---
## v0.12.5

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: AI Gateway &nbsp;-&nbsp; by **Murzin Artem** [<samp>(a0b8e)</samp>](https://github.com/sam-goodwin/alchemy/commit/a0b8e23)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.4...v0.12.5)
---
## v0.12.4

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Add .js suffix to imports and node:* external to Website &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/84 [<samp>(a9be8)</samp>](https://github.com/sam-goodwin/alchemy/commit/a9be80e)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.3...v0.12.4)
---
## v0.12.3

### &nbsp;&nbsp;&nbsp;🚀 Features

- Add Nuxt site with CF Pipeline example &nbsp;-&nbsp; by **Murzin Artem** [<samp>(9351d)</samp>](https://github.com/sam-goodwin/alchemy/commit/9351d2c)
- **cloudflare**: Redwood website &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/83 [<samp>(4d7d9)</samp>](https://github.com/sam-goodwin/alchemy/commit/4d7d960)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.2...v0.12.3)
---
## v0.12.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Tanstack start create wrangler.jsonc, add externals and shim cloudflare:workers during dev &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/82 [<samp>(2d586)</samp>](https://github.com/sam-goodwin/alchemy/commit/2d586da)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.1...v0.12.2)
---
## v0.12.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Respect 'main' property in Website &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/81 [<samp>(de243)</samp>](https://github.com/sam-goodwin/alchemy/commit/de243e2)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.12.0...v0.12.1)
---
## v0.12.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Generic Website & TanStackStart, Vite variants &nbsp;-&nbsp; by **sam** in https://github.com/sam-goodwin/alchemy/issues/78 [<samp>(3d892)</samp>](https://github.com/sam-goodwin/alchemy/commit/3d892de)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.11.4...v0.12.0)
---
## v0.11.4

### &nbsp;&nbsp;&nbsp;🚀 Features

- **cloudflare**: Support configuring Worker Asset Config &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/74 [<samp>(3f593)</samp>](https://github.com/sam-goodwin/alchemy/commit/3f593d5)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.11.3...v0.11.4)
---
## v0.11.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Respect assets property in ViteSite &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/75 [<samp>(39b35)</samp>](https://github.com/sam-goodwin/alchemy/commit/39b350f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.11.2...v0.11.3)
---
## v0.11.2

### &nbsp;&nbsp;&nbsp;🚀 Features

- Add invokemode to aws function &nbsp;-&nbsp; by **Nick Balestra-Foster** in https://github.com/sam-goodwin/alchemy/issues/73 [<samp>(73cca)</samp>](https://github.com/sam-goodwin/alchemy/commit/73cca76)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.11.1...v0.11.2)
---
## v0.11.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- **cloudflare**:
  - Add `migrations_dir` in wrangler.json if defined in D1Database &nbsp;-&nbsp; by **Simon Depelchin** in https://github.com/sam-goodwin/alchemy/issues/71 [<samp>(71b40)</samp>](https://github.com/sam-goodwin/alchemy/commit/71b40cc)
  - Support non-existing config files &nbsp;-&nbsp; by **Simon Depelchin** in https://github.com/sam-goodwin/alchemy/issues/72 [<samp>(b58bb)</samp>](https://github.com/sam-goodwin/alchemy/commit/b58bbdb)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.11.0...v0.11.1)
---
## v0.11.0

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Operator precedence in test.yml environment selection &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(e0f8a)</samp>](https://github.com/sam-goodwin/alchemy/commit/e0f8a84)
- In-memory bundle and update aws/Function to accept bundle instead of zipPath &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/70 [<samp>(21db7)</samp>](https://github.com/sam-goodwin/alchemy/commit/21db776)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.10.3...v0.11.0)
---
## v0.10.3

*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.10.2...v0.10.3)
---
## v0.10.2

*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.10.1...v0.10.2)
---
## v0.10.1

*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.10.0...v0.10.1)
---
## v0.10.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Github repository environment and secrets &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/61 [<samp>(260a0)</samp>](https://github.com/sam-goodwin/alchemy/commit/260a091)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.9.2...v0.10.0)
---
## v0.9.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Lambda function url &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/58 [<samp>(31cc8)</samp>](https://github.com/sam-goodwin/alchemy/commit/31cc81e)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.9.1...v0.9.2)
---
## v0.9.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Add d1_databases to wrangler.json spec &nbsp;-&nbsp; by **Simon Depelchin** in https://github.com/sam-goodwin/alchemy/issues/57 [<samp>(f90ae)</samp>](https://github.com/sam-goodwin/alchemy/commit/f90aeb9)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.9.0...v0.9.1)
---
## v0.9.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Cloudflare vite site &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/55 [<samp>(df6f3)</samp>](https://github.com/sam-goodwin/alchemy/commit/df6f353)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.8.1...v0.9.0)
---
## v0.8.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- Cloudflare vectorize index and metadata index &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/54 [<samp>(4ee7b)</samp>](https://github.com/sam-goodwin/alchemy/commit/4ee7bab)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.8.0...v0.8.1)
---
## v0.8.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Support TanStack Start &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/53 [<samp>(2fba8)</samp>](https://github.com/sam-goodwin/alchemy/commit/2fba851)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Harden retry logic of aws dynamodb table &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/52 [<samp>(be3ca)</samp>](https://github.com/sam-goodwin/alchemy/commit/be3ca9f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.7.3...v0.8.0)
---
## v0.7.3

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Configure .json and .sql loader options in Worker esbuild &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/51 [<samp>(8811e)</samp>](https://github.com/sam-goodwin/alchemy/commit/8811e9c)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.7.2...v0.7.3)
---
## v0.7.2

### &nbsp;&nbsp;&nbsp;🚀 Features

- Cloudflare pipelines and bindings &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/50 [<samp>(cdc8c)</samp>](https://github.com/sam-goodwin/alchemy/commit/cdc8cd8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.7.1...v0.7.2)
---
## v0.7.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- Generate wrangler.json for local dev &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/47 [<samp>(b5fa1)</samp>](https://github.com/sam-goodwin/alchemy/commit/b5fa185)
- Implement D1 database and bindings &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/48 [<samp>(d5320)</samp>](https://github.com/sam-goodwin/alchemy/commit/d5320c6)
- Cloudflare queue resource and bindings &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/49 [<samp>(f412f)</samp>](https://github.com/sam-goodwin/alchemy/commit/f412f45)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.7.0...v0.7.1)
---
## v0.7.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Cloudflare workflow &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/46 [<samp>(4c667)</samp>](https://github.com/sam-goodwin/alchemy/commit/4c66739)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Remove 404 pages for concepts, guides and providers pages &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(6f17b)</samp>](https://github.com/sam-goodwin/alchemy/commit/6f17b02)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.6.0...v0.7.0)
---
## v0.6.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Support OAuth wrangler login &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/45 [<samp>(7b35c)</samp>](https://github.com/sam-goodwin/alchemy/commit/7b35c46)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.5.2...v0.6.0)
---
## v0.5.2

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Export type Scope &nbsp;-&nbsp; by **Cole Lawrence** in https://github.com/sam-goodwin/alchemy/issues/43 [<samp>(457b3)</samp>](https://github.com/sam-goodwin/alchemy/commit/457b33f)
- Retry transient network failures in cloudflare API &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/44 [<samp>(850ab)</samp>](https://github.com/sam-goodwin/alchemy/commit/850ab59)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.5.1...v0.5.2)
---
## v0.5.1

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Opt-in to empty R2 bucket and document CF credentials in Guide &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/42 [<samp>(0d274)</samp>](https://github.com/sam-goodwin/alchemy/commit/0d27415)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.5.0...v0.5.1)
---
## v0.5.0

*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.4.1...v0.5.0)
---
## v0.4.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- Assets resource & Worker Binding &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/40 [<samp>(bdfc2)</samp>](https://github.com/sam-goodwin/alchemy/commit/bdfc2f1)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Add exponential backoff in r2 rest store &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/39 [<samp>(3ef24)</samp>](https://github.com/sam-goodwin/alchemy/commit/3ef2476)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.4.0...v0.4.1)
---
## v0.4.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Import DNS records and upload to Cloudflare &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/30 [<samp>(2a0c1)</samp>](https://github.com/sam-goodwin/alchemy/commit/2a0c18a)
- Astro component and static site &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/31 [<samp>(b3ef6)</samp>](https://github.com/sam-goodwin/alchemy/commit/b3ef678)
- R2 state store &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/33 [<samp>(934f3)</samp>](https://github.com/sam-goodwin/alchemy/commit/934f30f)
- Publish website &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/37 [<samp>(3b262)</samp>](https://github.com/sam-goodwin/alchemy/commit/3b262df)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Clean up empty bucket, account api token, access key &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/36 [<samp>(7cd42)</samp>](https://github.com/sam-goodwin/alchemy/commit/7cd4246)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.2.5...v0.4.0)
---
## v0.2.5

### &nbsp;&nbsp;&nbsp;🚀 Features

- Object -> data, generate website &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/27 [<samp>(305fc)</samp>](https://github.com/sam-goodwin/alchemy/commit/305fc1c)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.2.3...v0.2.5)
---
## v0.2.3

### &nbsp;&nbsp;&nbsp;🚀 Features

- Document Resource & Vitepress template &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/25 [<samp>(630ee)</samp>](https://github.com/sam-goodwin/alchemy/commit/630ee25)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.2.2...v0.2.3)
---
## v0.2.2

### &nbsp;&nbsp;&nbsp;🚀 Features

- Setup tailwind tanstack router and shadcn &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/24 [<samp>(26158)</samp>](https://github.com/sam-goodwin/alchemy/commit/261582d)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.2.1...v0.2.2)
---
## v0.2.1

### &nbsp;&nbsp;&nbsp;🚀 Features

- Cloudflare Zone resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/19 [<samp>(4bc03)</samp>](https://github.com/sam-goodwin/alchemy/commit/4bc03c7)
- Delete orphans during scope finalize &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/20 [<samp>(e7c1a)</samp>](https://github.com/sam-goodwin/alchemy/commit/e7c1ab4)
- Vitejs template resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/22 [<samp>(78e0d)</samp>](https://github.com/sam-goodwin/alchemy/commit/78e0db9)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Memoize logic by awaiting serialize &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/21 [<samp>(8c2e6)</samp>](https://github.com/sam-goodwin/alchemy/commit/8c2e64b)
- Detect error in scope and do not orphan resources &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/23 [<samp>(d9d6a)</samp>](https://github.com/sam-goodwin/alchemy/commit/d9d6aa9)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.2.0...v0.2.1)
---
## v0.2.0

### &nbsp;&nbsp;&nbsp;🚀 Features

- Async Resources &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/17 [<samp>(a431f)</samp>](https://github.com/sam-goodwin/alchemy/commit/a431f2d)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Secret tests and compile errors in examples &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/16 [<samp>(17588)</samp>](https://github.com/sam-goodwin/alchemy/commit/175889f)
- CI &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/18 [<samp>(ab939)</samp>](https://github.com/sam-goodwin/alchemy/commit/ab939c0)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.1.18...v0.2.0)
---
## v0.1.18

### &nbsp;&nbsp;&nbsp;🚀 Features

- R2 bucket &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/13 [<samp>(92738)</samp>](https://github.com/sam-goodwin/alchemy/commit/927387b)
- Infer cloudflare env from Worker &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/14 [<samp>(0096b)</samp>](https://github.com/sam-goodwin/alchemy/commit/0096b2f)
- Encrypted secret in state with password &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/15 [<samp>(4128d)</samp>](https://github.com/sam-goodwin/alchemy/commit/4128d55)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Exports &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(37a56)</samp>](https://github.com/sam-goodwin/alchemy/commit/37a564f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.1.16...v0.1.18)
---
## v0.1.16

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Log update/delete errors &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/12 [<samp>(3344a)</samp>](https://github.com/sam-goodwin/alchemy/commit/3344ab3)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.1.15...v0.1.16)
---
## v0.1.15

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Cloduflare-vite example &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(7b979)</samp>](https://github.com/sam-goodwin/alchemy/commit/7b97989)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.1.14...v0.1.15)
---
## v0.1.14

### &nbsp;&nbsp;&nbsp;🚀 Features

- Bindings as key-value pairs of KVNamespace &nbsp;-&nbsp; by ** Worker ** [<samp>( Dura)</samp>](https://github.com/sam-goodwin/alchemy/commit/ DurableObject )
- OIDC identity provider, GitHub CI/CD, GitHub Secret Resource &nbsp;-&nbsp; by **Sam Goodwin** in https://github.com/sam-goodwin/alchemy/issues/6 [<samp>(9c81a)</samp>](https://github.com/sam-goodwin/alchemy/commit/9c81a5a)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.1.13...v0.1.14)
---
## v0.1.13

### &nbsp;&nbsp;&nbsp;🚀 Features

- Enable observability for workers by default &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(3a630)</samp>](https://github.com/sam-goodwin/alchemy/commit/3a63075)
- Route to backend worker from static site handler &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(b2635)</samp>](https://github.com/sam-goodwin/alchemy/commit/b2635d0)
- Set environment on a CF worker &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(4a9cc)</samp>](https://github.com/sam-goodwin/alchemy/commit/4a9cceb)
- Allow routing from static site root &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(08bb2)</samp>](https://github.com/sam-goodwin/alchemy/commit/08bb2db)
- Print resource &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(a691f)</samp>](https://github.com/sam-goodwin/alchemy/commit/a691ffa)
- Callbacks and $ &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(a1630)</samp>](https://github.com/sam-goodwin/alchemy/commit/a1630c0)
- Durable object auto migration &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(7029b)</samp>](https://github.com/sam-goodwin/alchemy/commit/7029bfb)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Pass through quiet mode to apply in worker and static site &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(86990)</samp>](https://github.com/sam-goodwin/alchemy/commit/86990c7)
- Cloudflare:workers is external to bundle &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(6b474)</samp>](https://github.com/sam-goodwin/alchemy/commit/6b474e8)
- Memoize call to update for same resource instance &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(f59f6)</samp>](https://github.com/sam-goodwin/alchemy/commit/f59f608)
- Use new_sqlite_classes when sqlite: true &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(3840e)</samp>](https://github.com/sam-goodwin/alchemy/commit/3840e53)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.1.12...v0.1.13)
---
## v0.1.12

### &nbsp;&nbsp;&nbsp;🚀 Features

- Alchemy/aws/auto &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(097bc)</samp>](https://github.com/sam-goodwin/alchemy/commit/097bc99)
- Stripe webhook, product, price &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(b2472)</samp>](https://github.com/sam-goodwin/alchemy/commit/b247235)
- Cloudflare workers, kv namespaces, durable objects &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(05aa4)</samp>](https://github.com/sam-goodwin/alchemy/commit/05aa478)
- Cloudflare state store &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(447f1)</samp>](https://github.com/sam-goodwin/alchemy/commit/447f178)
- Aws ses &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(5daca)</samp>](https://github.com/sam-goodwin/alchemy/commit/5dacafc)
- **cloudflare**: Static site &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(a73ae)</samp>](https://github.com/sam-goodwin/alchemy/commit/a73ae7e)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Generate aws script &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(eee5a)</samp>](https://github.com/sam-goodwin/alchemy/commit/eee5ad3)
- Stripe/index.ts &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(ce648)</samp>](https://github.com/sam-goodwin/alchemy/commit/ce6481d)
- Compile and publish &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(20340)</samp>](https://github.com/sam-goodwin/alchemy/commit/203406e)
- Static site &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(18480)</samp>](https://github.com/sam-goodwin/alchemy/commit/1848043)
- Exports and resolved outputs &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(69927)</samp>](https://github.com/sam-goodwin/alchemy/commit/69927b1)
- **cloudflare**: Static site router &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(0b71c)</samp>](https://github.com/sam-goodwin/alchemy/commit/0b71c8f)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.1.4...v0.1.12)
---
## v0.1.4

### &nbsp;&nbsp;&nbsp;🚀 Features

- Aws resources and a re-worked Output chain &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(ce2e7)</samp>](https://github.com/sam-goodwin/alchemy/commit/ce2e71c)
- Apply working e2e &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(4bff4)</samp>](https://github.com/sam-goodwin/alchemy/commit/4bff4ee)
- Destroy a graph &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(66cb3)</samp>](https://github.com/sam-goodwin/alchemy/commit/66cb35b)
- Allow re-defining a resource by ID and calling apply to update it &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(79883)</samp>](https://github.com/sam-goodwin/alchemy/commit/79883a8)
- Pass through past output in ctx and use that to delete inline policies in Role &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(f65b0)</samp>](https://github.com/sam-goodwin/alchemy/commit/f65b081)
- Table creation, deletion and waiting for stabilization &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(57123)</samp>](https://github.com/sam-goodwin/alchemy/commit/571230a)
- Add an exponential backoff when creating a function to deal with IAM stabilization &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(2de18)</samp>](https://github.com/sam-goodwin/alchemy/commit/2de1808)
- Remove stack concept &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(b3515)</samp>](https://github.com/sam-goodwin/alchemy/commit/b3515db)
- Add alchemize for deploying all resources &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(b24a5)</samp>](https://github.com/sam-goodwin/alchemy/commit/b24a56f)
- Extract evaluate from apply &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(895f5)</samp>](https://github.com/sam-goodwin/alchemy/commit/895f5ef)
- Destroy orphaned resources &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(11a98)</samp>](https://github.com/sam-goodwin/alchemy/commit/11a9840)
- Remove stage global and instead accept an argument in alchemize/apply/destroy. &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(c0bd4)</samp>](https://github.com/sam-goodwin/alchemy/commit/c0bd434)
- Support providing stateStore in alchemize, apply, destroy &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(20cee)</samp>](https://github.com/sam-goodwin/alchemy/commit/20ceee9)
- Implement recursive delete &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(6d5b2)</samp>](https://github.com/sam-goodwin/alchemy/commit/6d5b2aa)
- Implement SQS Queue and record a demo fix: handle 60s timeout after queue deletion &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(f8ff8)</samp>](https://github.com/sam-goodwin/alchemy/commit/f8ff8db)
- Codegen agents and fixes to state store &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(05d3d)</samp>](https://github.com/sam-goodwin/alchemy/commit/05d3dd8)
- Tool to scrape web pages to inform requirements &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(f7dc0)</samp>](https://github.com/sam-goodwin/alchemy/commit/f7dc000)
- Skip update if inputs have not changed &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(fc099)</samp>](https://github.com/sam-goodwin/alchemy/commit/fc099e3)
- Implement scope for recursive IaC &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(27fdb)</samp>](https://github.com/sam-goodwin/alchemy/commit/27fdb2f)
- Recursive materialization &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(9e68a)</samp>](https://github.com/sam-goodwin/alchemy/commit/9e68a6b)
- Implement generator for aws CFN spec &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(4cb97)</samp>](https://github.com/sam-goodwin/alchemy/commit/4cb97b3)
- Use o3-mini to define requirements, implement with claude-3.5 sonnet &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(12d2a)</samp>](https://github.com/sam-goodwin/alchemy/commit/12d2a1a)
- Fallback to o3-mini if typescript errors can't be resolved &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(9ee87)</samp>](https://github.com/sam-goodwin/alchemy/commit/9ee874b)
- Include relevant terraform implementation in context &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(d3b2b)</samp>](https://github.com/sam-goodwin/alchemy/commit/d3b2ba9)
- E2e generation of cfn resources &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(40d3f)</samp>](https://github.com/sam-goodwin/alchemy/commit/40d3f98)
- Markdown driven programming &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(94762)</samp>](https://github.com/sam-goodwin/alchemy/commit/9476230)
- Quiet mode &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(5cc9c)</samp>](https://github.com/sam-goodwin/alchemy/commit/5cc9c4f)

### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- Consolidate apply and evaluate &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(ed889)</samp>](https://github.com/sam-goodwin/alchemy/commit/ed889af)
- Throw error if role already exists when trying to create &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(bc543)</samp>](https://github.com/sam-goodwin/alchemy/commit/bc5433c)
- InvokeArn in lambda function &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(61453)</samp>](https://github.com/sam-goodwin/alchemy/commit/614534d)
- Broken link to table.ts &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(7ac5f)</samp>](https://github.com/sam-goodwin/alchemy/commit/7ac5fd6)
- Store tags on role and handle "already exists" after a crash &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(69427)</samp>](https://github.com/sam-goodwin/alchemy/commit/69427a2)
- .output location for tests &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(12055)</samp>](https://github.com/sam-goodwin/alchemy/commit/12055f5)
- Explicitly type the output of Table and Role &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(2717b)</samp>](https://github.com/sam-goodwin/alchemy/commit/2717bef)
- Input<array> and test PackageJson, TypeScriptConfig, etc. &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(9e347)</samp>](https://github.com/sam-goodwin/alchemy/commit/9e3475d)
- Compute scope path recursively using parent &nbsp;-&nbsp; by **Sam Goodwin** [<samp>(4366d)</samp>](https://github.com/sam-goodwin/alchemy/commit/4366d9d)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/sam-goodwin/alchemy/compare/v0.0.0...v0.1.4)
---
