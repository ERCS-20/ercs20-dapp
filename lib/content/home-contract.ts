import type { Locale } from "@/lib/i18n/messages";

/** Content adapted from `contract/README.md`, excluding "Project roadmap (two phases)" and the following two-phase ship list. */

/** Blocks before this index are duplicated in the marketing hero; render from here in the protocol section. */
export const HOME_PROTOCOL_BLOCKS_START = 4;

export type HomeBlock =
  | { type: "kicker"; text: string }
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ol"; items: { title: string; body: string }[] }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export type HomeContractCopy = {
  blocks: HomeBlock[];
};

const en: HomeContractCopy = {
  blocks: [
    { type: "kicker", text: "ERCS-20 Smart Contracts · Liquidity Sovereignty Protocol" },
    {
      type: "h1",
      text: "Liquidity Sovereignty Protocol",
    },
    {
      type: "p",
      text: "Liquidity Sovereignty is a smart-contract-native paradigm for equity-style financing and trading: no zero-cost “founder stock.” Anyone—including the founding team—who wants stock tokens from the pool must supply stablecoins (or an equivalent quote asset on-chain) under fixed rules. Trading fees from secondary-market activity can accrue to the company (or a protocol treasury) so ongoing liquidity becomes withdrawable revenue—liquidity as income.",
    },
    {
      type: "p",
      text: "This repository’s reference implementation is Equity Request for Comments - Stock (20) (ERCS-20)—tokenized equity-like assets with an embedded constant-product AMM (Uniswap V2–style) for pricing and swaps.",
    },
    { type: "h2", text: "What ERCS-20 is designed to fix" },
    {
      type: "p",
      text: "ERCS-20 is not “yet another token.” It is a tokenized stock primitive that tries to solve several structural problems seen in common AMM pairs and orderbook listings:",
    },
    {
      type: "ol",
      items: [
        {
          title: "Bootstrapping a Uniswap pair requires real capital (initial price = locked cash)",
          body: "In a typical Uniswap-style launch, the initial price is set by depositing real quote liquidity into the pool—and that capital is effectively locked as liquidity. ERCS-20 introduces virtual / accounting-based initial reserves to anchor an initial price without forcing the issuer to permanently park that cash in a removable LP position. The intended outcome is that the company can deploy capital more efficiently (e.g., into operations or even buying stock through the same on-chain mechanism), while still starting from a deterministic opening price.",
        },
        {
          title: "Approval phishing / allowance fraud on “buy” flows",
          body: "Many ERC20 purchase flows require users to approve() a spender, which is a common phishing vector. ERCS-20 is designed around a no-allowance trading path: Buy: deposit the quote asset into the contract (native quote in this implementation), receive tokens. Sell: send tokens into the contract (or call sell()), receive the quote asset out. This “transfer-in to trade” pattern reduces reliance on third-party allowances and helps mitigate approval-based scams at the UX layer.",
        },
        {
          title: "Liquidity removal rug-risk and “token goes to zero because liquidity disappears”",
          body: "In many AMMs, LPs can remove liquidity, and in many orderbooks there may be no market-making depth. Both can lead to catastrophic slippage and “effectively zero” price outcomes for holders. ERCS-20 aims to avoid that class of failure by making liquidity contract-custodied: the token inventory is minted to the contract at deployment, and there is no LP position to withdraw in the usual sense. Users can only obtain tokens from the pool by depositing the quote asset according to the AMM curve, which is intended to keep pricing tied to an on-chain reserve system rather than removable third-party liquidity.",
        },
        {
          title: "Secondary-market trading generates revenue for venues, not for the issuer",
          body: "In traditional listings, most trading fees go to exchanges and intermediaries. ERCS-20 is designed so that a portion of each trade’s value (a protocol fee) can be accumulated and withdrawn to a company/treasury-controlled address, improving the issuer’s cash flow and long-term incentives (e.g., funding R&D and operations). (In this repo’s current implementation, the output-side fee is ≈ 0.2% (1/500); see source.)",
        },
        {
          title: "Non-dilutive “re-financing” via preselling future fee revenue rights",
          body: "Instead of raising again through new-share issuance (dilution), the protocol narrative is to raise capital by preselling rights to future trading-fee cash flows. Existing holders keep their ownership percentages; new capital gains long-duration, fee-linked cash-flow exposure. (This repo ships the fee accrual and withdrawal primitives; the presale/distribution layer is a product/extension module.)",
        },
      ],
    },
    { type: "h2", text: "Design rationale" },
    {
      type: "p",
      text: "ERCS-20 combines a tokenized stock primitive with an AMM-style market and a fee-capture mechanism to realign incentives between issuers, traders, and long-term holders.",
    },
    { type: "h3", text: "Liquidity sovereignty (why the market lives in the contract)" },
    {
      type: "p",
      text: "The core idea is to keep pricing and fee capture inside an on-chain rule set, rather than outsourcing value to third-party venues:",
    },
    {
      type: "ul",
      items: [
        "Contract-custodied inventory: total supply is minted to the contract at deployment, so there is no “LP position” that a third party can remove in the usual AMM sense.",
        "Continuous pricing: swaps follow a constant-product curve x × y = k between the stock token and the quote asset (native quote in this implementation).",
        "Fee recapture: a portion of swap value is accumulated and can be withdrawn to an issuer/treasury-controlled address (see withdrawAddr / withdrawFee).",
      ],
    },
    { type: "h3", text: "Non-dilutive financing narrative (preselling future fee revenue rights)" },
    {
      type: "p",
      text: "For large capital needs, the narrative is to avoid new-share issuance → dilution by raising capital via preselling rights to future trading-fee cash flows:",
    },
    {
      type: "ul",
      items: [
        "Incumbents keep ownership structure unchanged.",
        "New capital gains long-duration, fee-linked cash-flow exposure.",
        "The issuer converts future liquidity revenue into upfront funding.",
      ],
    },
    { type: "h3", text: "Why this differs from both AMM pairs and orderbooks" },
    {
      type: "ul",
      items: [
        "Compared to typical AMM pairs: ERCS-20 aims to reduce “liquidity removal → collapse” failure modes by keeping inventory inside the contract.",
        "Compared to pure orderbooks: ERCS-20 provides an always-on pricing curve (though depth still depends on reserves and market participation).",
      ],
    },
  ],
};

const zhCN: HomeContractCopy = {
  blocks: [
    { type: "kicker", text: "ERCS-20 智能合约 · 流动性主权协议" },
    { type: "h1", text: "流动性主权协议" },
    {
      type: "p",
      text: "「流动性主权」是一种原生在智能合约上的股权式融资与交易范式：不存在零成本的「创始人股票」。任何一方——包括创始团队——若要从池中获得股票型代币，都必须按固定规则提供稳定币（或链上等价报价资产）。二级市场交易手续费可归集至公司（或协议金库），使持续流动性可提现为收入——流动性即收入。",
    },
    {
      type: "p",
      text: "本仓库的参考实现为 Equity Request for Comments - Stock (20)（ERCS-20）：带有内嵌恒定乘积 AMM（Uniswap V2 风格）做定价与兑换的类股权代币化资产。",
    },
    { type: "h2", text: "ERCS-20 试图解决的问题" },
    {
      type: "p",
      text: "ERCS-20 不是「又一个代币」，而是一种代币化股票原语，针对常见 AMM 交易对与订单簿上市中的结构性问题而设计：",
    },
    {
      type: "ol",
      items: [
        {
          title: "启动 Uniswap 交易对需要真实资金（初始价格 = 锁仓现金）",
          body: "典型 Uniswap 式启动通过向池子注入真实报价流动性来定价，资金往往长期锁在流动性中。ERCS-20 引入虚拟 / 记账式初始储备，在不强迫发行方把现金永久放在可抽走的 LP 仓位的前提下锚定开盘价，使资金可更高效用于运营或通过同一链上机制回购股票，同时仍可有确定的起始价格。",
        },
        {
          title: "「买入」流程中的授权钓鱼 / 额度欺诈",
          body: "许多 ERC20 购买流程需要用户对支出方 approve()，这是常见钓鱼面。ERCS-20 围绕免授权交易路径设计：买入：将报价资产存入合约（本实现为原生报价），获得代币；卖出：将代币转入合约（或调用 sell()），收回报价资产。「转入即交易」降低对第三方额度的依赖，有助于缓解基于授权的骗局。",
        },
        {
          title: "流动性被撤导致「代币归零」类风险",
          body: "许多 AMM 的 LP 可撤流动性，许多订单簿缺乏做市深度，均可能导致极端滑点与持有人眼中的「近似归零」。ERCS-20 通过合约托管流动性来缓解：总供应在部署时铸入合约，通常意义上没有可被第三方抽走的 LP 仓位；用户只能按 AMM 曲线存入报价资产换取代币，使定价绑定在链上储备体系而非可撤的第三方流动性。",
        },
        {
          title: "二级市场手续费归场所而非发行方",
          body: "在传统上市结构中，大部分交易费归交易所与中介。ERCS-20 使每笔交易价值的一部分（协议费）可累积并提至公司/金库地址，改善现金流与长期激励（如研发与运营）。本仓库当前实现中输出侧费率约为 0.2%（1/500）；详见源码。",
        },
        {
          title: "通过预售未来手续费现金流进行非稀释「再融资」",
          body: "叙事上可避免新发股份带来的稀释，而通过预售未来交易费现金流权利筹资；原持有人持股比例不变；新资金获得与手续费挂钩的长期现金流敞口。（本仓库提供费用累积与提取原语；预售/分发层为产品/扩展模块。）",
        },
      ],
    },
    { type: "h2", text: "设计理据" },
    {
      type: "p",
      text: "ERCS-20 将代币化股票原语、AMM 式市场与费用捕获机制结合，以重新对齐发行方、交易者与长期持有人的激励。",
    },
    { type: "h3", text: "流动性主权（市场为何在合约内）" },
    {
      type: "p",
      text: "核心思路是把定价与费用捕获保留在链上规则内，而非把价值外包给第三方场所：",
    },
    {
      type: "ul",
      items: [
        "合约托管库存：总供应在部署时铸入本合约，通常没有可被第三方按常规 AMM 意义撤走的「LP 仓位」。",
        "连续定价：兑换遵循股票代币与报价资产（本实现为原生报价）之间的恒定乘积曲线 x × y = k。",
        "费用回收：部分交换价值可累积，并由发行方/金库地址提取（见 withdrawAddr / withdrawFee）。",
      ],
    },
    { type: "h3", text: "非稀释融资叙事（预售未来手续费权利）" },
    {
      type: "p",
      text: "对大额资金需求，叙事上通过预售未来交易费现金流权利筹资，以避免新发股份 → 稀释：",
    },
    {
      type: "ul",
      items: [
        "原持有人股权结构不变。",
        "新资金获得长期、与费用挂钩的现金流敞口。",
        "发行方将未来流动性收入转化为前期资金。",
      ],
    },
    { type: "h3", text: "与 AMM 交易对及订单簿的差异" },
    {
      type: "ul",
      items: [
        "相对典型 AMM 交易对：ERCS-20 通过库存留在合约内，力图降低「流动性被撤 → 崩盘」类失败模式。",
        "相对纯订单簿：ERCS-20 提供始终在线的定价曲线（深度仍取决于储备与市场参与）。",
      ],
    },
  ],
};

const zhTW: HomeContractCopy = {
  blocks: [
    { type: "kicker", text: "ERCS-20 智慧合約 · 流動性主權協議" },
    { type: "h1", text: "流動性主權協議" },
    {
      type: "p",
      text: "「流動性主權」是一種原生在智慧合約上的股權式融資與交易範式：不存在零成本的「創辦人股票」。任何一方——包括創辦團隊——若要從池子中取得股票型代幣，都必須依固定規則提供穩定幣（或鏈上等價報價資產）。二級市場交易手續費可歸集至公司（或協議金庫），使持續流動性可提現為收入——流動性即收入。",
    },
    {
      type: "p",
      text: "本儲存庫的參考實作為 Equity Request for Comments - Stock (20)（ERCS-20）：帶有內嵌恆定乘積 AMM（Uniswap V2 風格）做定價與兌換的類股權代幣化資產。",
    },
    { type: "h2", text: "ERCS-20 試圖解決的問題" },
    {
      type: "p",
      text: "ERCS-20 不是「又一個代幣」，而是一種代幣化股票原語，針對常見 AMM 交易對與訂單簿上市中的結構性問題而設計：",
    },
    {
      type: "ol",
      items: [
        {
          title: "啟動 Uniswap 交易對需要真實資金（初始價格 = 鎖倉現金）",
          body: "典型 Uniswap 式啟動透過向池子注入真實報價流動性來定價，資金往往長期鎖在流動性中。ERCS-20 引入虛擬／帳務式初始儲備，在不強迫發行方把現金永久放在可抽走的 LP 倉位的前提下錨定開盤價，使資金可更高效用於營運或透過同一鏈上機制買回股票，同時仍可有確定的起始價格。",
        },
        {
          title: "「買入」流程中的授權釣魚／額度詐欺",
          body: "許多 ERC20 購買流程需要使用者對支出方 approve()，這是常見釣魚面。ERCS-20 圍繞免授權交易路徑設計：買入：將報價資產存入合約（本實作為原生報價），取得代幣；賣出：將代幣轉入合約（或呼叫 sell()），收回報價資產。「轉入即交易」降低對第三方額度的依賴，有助於緩解基於授權的騙局。",
        },
        {
          title: "流動性被撤導致「代幣歸零」類風險",
          body: "許多 AMM 的 LP 可撤流動性，許多訂單簿缺乏做市深度，均可能導致極端滑點與持有人眼中的「近似歸零」。ERCS-20 透過合約託管流動性來緩解：總供應在部署時鑄入合約，通常意義上沒有可被第三方抽走的 LP 倉位；使用者只能依 AMM 曲線存入報價資產換取代幣，使定價綁定在鏈上儲備體系而非可撤的第三方流動性。",
        },
        {
          title: "二級市場手續費歸場所而非發行方",
          body: "在傳統上市結構中，大部分交易費歸交易所與中介。ERCS-20 使每筆交易價值的一部分（協議費）可累積並提至公司／金庫地址，改善現金流與長期激勵（如研發與營運）。本儲存庫目前實作中輸出側費率約為 0.2%（1/500）；詳見原始碼。",
        },
        {
          title: "透過預售未來手續費現金流進行非稀釋「再融資」",
          body: "敘事上可避免新發股份帶來的稀釋，而透過預售未來交易費現金流權利籌資；原持有人持股比例不變；新資金取得與手續費掛鉤的長期現金流曝險。（本儲存庫提供費用累積與提取原語；預售／分發層為產品／擴充模組。）",
        },
      ],
    },
    { type: "h2", text: "設計理據" },
    {
      type: "p",
      text: "ERCS-20 將代幣化股票原語、AMM 式市場與費用捕獲機制結合，以重新對齊發行方、交易者與長期持有人的激勵。",
    },
    { type: "h3", text: "流動性主權（市場為何在合約內）" },
    {
      type: "p",
      text: "核心思路是把定價與費用捕獲保留在鏈上規則內，而非把價值外包給第三方場所：",
    },
    {
      type: "ul",
      items: [
        "合約託管庫存：總供應在部署時鑄入本合約，通常沒有可被第三方按常規 AMM 意義撤走的「LP 倉位」。",
        "連續定價：兌換遵循股票代幣與報價資產（本實作為原生報價）之間的恆定乘積曲線 x × y = k。",
        "費用回收：部分交換價值可累積，並由發行方／金庫地址提取（見 withdrawAddr／withdrawFee）。",
      ],
    },
    { type: "h3", text: "非稀釋融資敘事（預售未來手續費權利）" },
    {
      type: "p",
      text: "對大額資金需求，敘事上透過預售未來交易費現金流權利籌資，以避免新發股份 → 稀釋：",
    },
    {
      type: "ul",
      items: [
        "原持有人股權結構不變。",
        "新資金取得長期、與費用掛鉤的現金流曝險。",
        "發行方將未來流動性收入轉化為前期資金。",
      ],
    },
    { type: "h3", text: "與 AMM 交易對及訂單簿的差異" },
    {
      type: "ul",
      items: [
        "相對典型 AMM 交易對：ERCS-20 透過庫存留在合約內，力圖降低「流動性被撤 → 崩盤」類失敗模式。",
        "相對純訂單簿：ERCS-20 提供始終在線的定價曲線（深度仍取決於儲備與市場參與）。",
      ],
    },
  ],
};

const byLocale: Record<Locale, HomeContractCopy> = {
  en,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
};

export function getHomeContractCopy(locale: Locale): HomeContractCopy {
  return byLocale[locale] ?? en;
}
