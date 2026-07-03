# Cursor 配置（ERCS-20 / Orbix dApp）

## 优先级

1. **Rules**（`.cursor/rules/*.mdc`）— 硬约束，自动或按 glob 生效  
2. **Skills**（`.cursor/skills/*/SKILL.md`）— 工作流与领域设计，按需 `@` 调用  
3. **AGENTS.md** — Next.js 16、shadcn 全局说明  

**冲突时：Rules > Skills > 通用 UI 模板（如 generic Blue 配色）**

## Rules

| 文件 | 作用域 | 说明 |
|------|--------|------|
| `project.mdc` | 全局 | 栈、目录、bigint、npm、Git |
| `security.mdc` | 全局 | 依赖、密钥、链上安全 |
| `code-style.mdc` | `**/*.{ts,tsx}` | 文件/函数长度、early return |
| `frontend.mdc` | `app/`, `components/`, … | 路由、i18n、shadcn、Client 边界 |
| `ui.mdc` | UI 文件 | Orbix token、间距、暗色、标杆组件 |
| `web3.mdc` | 链相关路径 | viem/wagmi、ERCS-20 buy/sell、env |
| `api.mdc` | `app/api/` | Route Handler（预留） |

## Skills

### 入口

- `@design-system` — UI 设计哲学 + 技能索引 + 交付自检

### 视觉与布局

`colors` · `typography` · `dark-mode` · `animation` · `accessibility` · `responsive` · `mobile`

### 交易所页面

`dashboard` · `trading-page` · `orderbook` · `charts` · `tables` · `forms` · `wallet` · `authentication`

### 工作流

`create-page` · `create-web3-feature` · `create-form` · `review-pr`

## 典型用法

```
@create-page 新增 /markets 占位页，遵循 ui.mdc
@create-web3-feature 在 Swap 加只读 getReserves，最小 diff
@design-system polish /swap，不改 wagmi 逻辑
@review-pr 审查当前分支
```

## 标杆代码

- 营销：`components/home/home-view.tsx`
- 交易卡片：`components/swap/swap-card.tsx`
- 部署表单：`components/ercs20/factory-create-card.tsx`
- 主题：`app/globals.css`
- 壳层：`components/layout/site-layout.tsx`
