export const zhCN = {
  brand: "ERCS-20",
  nav: {
    swap: "兑换",
    spot: "现货",
    futures: "合约",
    pools: "流动性池",
    ercs20: "ERCS-20",
  },
  common: {
    settings: "设置",
    language: "语言",
    theme: "主题",
    themeLight: "浅色",
    themeDark: "深色",
    themeSystem: "跟随系统",
    roadmap: "路线图",
  },
  wallet: {
    connect: "连接钱包",
    connectPlaceholder:
      "下一步将接入 WalletConnect。准备好后请在环境变量中填写 NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID。",
    wrongNetworkDialogDesc:
      "当前钱包网络与本应用配置不一致。请切换到下方网络后再使用兑换与部署。",
    wrongNetworkLater: "稍后再说",
  },
  home: {
    heroBadge: "ERCS-20",
    heroTitle: "主权流动性的代币。",
    heroSubtitle:
      "ERCS-20 将全部供应铸入内嵌 AMM，用原生报价资产定价，并把交易手续费回流给发行方，同时让用户通过存入买入、转入卖出，远离授权陷阱。",
    learnMore: "了解更多",
    protocolEyebrow: "协议",
    protocolTitle: "ERCS-20 如何运作",
    ctaSwap: "进入兑换",
    ctaErcs20: "部署 ERCS-20",
    heroFeatureAmm: "现货",
    heroFeatureTrade: "期货",
    heroFeatureFees: "矿池",
  },
  swap: {
    title: "兑换",
    settingsPlaceholder: "在下方调整滑点与截止时间。",
    sell: "卖出",
    buy: "买入",
    pay: "支付",
    receive: "获得",
    balance: "余额",
    selectToken: "选择代币",
    enterAmount: "0",
    flip: "调换方向",
    settings: "交易设置",
    slippage: "滑点（基点）",
    deadline: "截止时间（分钟）",
    rate: "汇率",
    review: "预览",
    swapAction: "兑换",
    native: "USDC",
    stock: "代币",
    wrongNetwork: "网络不正确",
    switchNetwork: "切换网络",
    envNotConfigured: "请在 .env.local 中设置 NEXT_PUBLIC_CHAIN_ID 与 NEXT_PUBLIC_ERCS20_FACTORY_ADDRESS。",
    pickToken: "请选择 ERCS-20 代币",
    searchTokens: "符号或 0x 地址（工厂按符号精确匹配）",
    noTokenResults: "未找到代币",
    loading: "加载中…",
    insufficientBalance: "余额不足",
    confirmWallet: "请在钱包中确认",
    confirming: "确认中…",
    swapSuccess: "交易已确认",
    swapFailed: "交易失败",
    currentPrice: "当前价",
    saveSettings: "保存",
    slippageBpsHint: "50 = 0.5%，最大 5000（50%）。",
    deadlineHint: "1–1440 分钟。",
    outputEstimate: "预计获得",
    disconnectedHint: "连接钱包以兑换",
    invalidAmount: "金额无效",
  },
  ercs20: {
    title: "部署 ERCS-20",
    subtitle:
      "发行您自主的 ERCS-20，并配套链上流动性。当代币在协议内被交易时，手续费机制会向发行方回流——让激励与真实成交和长期参与绑定，而不只是「部署即结束」。",
    name: "名称",
    symbol: "符号",
    price: "价格（每枚代币的报价）",
    pricePlaceholder: "填写总供应量与初始报价后自动计算",
    totalSupply: "总供应量",
    seedQuote: "初始报价储备（种子）",
    ownerAddress: "所有者地址",
    ownerConnectWallet: "请连接钱包",
    submit: "部署",
    toastNeedWallet: "需要连接钱包",
    toastNeedWalletDesc: "请先连接钱包以确认所有者地址。",
    toastWrongNetwork: "网络不正确",
    toastWrongNetworkDesc: "请先切换到应用配置的目标网络。",
    toastNeedName: "请填写名称",
    toastNeedNameDesc: "请输入代币名称。",
    toastNeedSymbol: "请填写符号",
    toastNeedSymbolDesc: "请输入代币符号。",
    toastNeedSupply: "请填写总供应量",
    toastNeedSupplyDesc: "请输入有效数量（18 位小数，且大于零）。",
    toastNeedSeed: "请填写初始报价",
    toastNeedSeedDesc: "请输入有效初始报价（18 位小数，且大于零）。",
    deploySuccessTitle: "部署成功",
    deploySuccessSubtitle:
      "您的 ERCS-20 已在链上生效。请保存下方合约地址，便于上架与兑换。",
    tokenContractAddress: "代币合约地址",
    registryIndex: "工厂序号",
    copyAddress: "复制",
    copyFailed: "复制失败",
    addressCopied: "已复制地址",
    deployAnother: "再部署一个",
    deployParseFailed: "交易已成功，但无法从事件日志中解析代币合约地址。",
    txHashLabel: "交易哈希",
    createFailed: "创建失败",
    hint: "在钱包中确认交易。",
  },
  phase2: {
    detailBody: `当前形态下，ERCS-20 池在链上以固定库存初始化。由于不会像成熟交易场所那样持续补充流动性，在流动性稀薄或大额成交时，价格可能出现剧烈波动。

为应对这一关键短板，项目将从单一 AMM 池演进为完整的去中心化交易所体系，以提供可持续流动性与更深的市场深度。

Orbix 与 OBX（说明 / 风险披露）

交易所：Orbix（网站：orbix.exchange）是计划在 ERCS-20 生态中扩展流动性的去中心化交易所，旨在提供更深的市场深度，并随时间推移承载现货、衍生品与激励机制的执行层。

协议代币：Orbix DAO（符号：OBX）是面向 ERCS-20 生态引入的首个代币，拟用于交易所阶段的质押/挖矿计划、手续费分配及更广义的生态激励（最终机制以正式主网版本为准）。

实验定位：Orbix 与 OBX 构成 ERCS-20「实验沙盒」，用于在真实市场条件下验证「流动性主权」、手续费回流与非稀释融资叙事的可行性与边界。

高风险提示：本项目处于积极开发与实验阶段，可能存在智能合约风险、机制/设计风险、流动性风险及剧烈价格波动。参与前请自行研究并充分理解规则与风险。请审慎参与并量力而行。本仓库任何内容均不构成投资建议。`,
    detailRoadmap: `我们分两个阶段交付：

第一阶段：类 Uniswap 的兑换体验（优先做前端）
搭建前端与可交互的兑换页面，让用户能便捷地用报价资产兑换 ERCS20。本阶段侧重可用性与交易入口体验：用户无需理解合约内部细节即可可靠地完成交易。

第二阶段：类 dYdX 的去中心化交易所（现货 + 合约）+ 质押挖矿
部署更完整的 DEX：
• 支持现货与合约交易。
• 采用类 dYdX 的「链下签名 + 链上结算」流程（订单在链下签名，随后在链上校验并结算）。
• 增加质押与挖矿：用户质押协议代币参与挖矿。
• 手续费分配：交易所手续费分为两部分——一部分用于项目/平台运营，另一部分通过质押平台分配给挖矿奖励。

从务实的交易入口起步，再逐步升级为可持续承载流动性、衍生品与激励的场地，社区可以更早使用与验证，并随时间形成更健康的流动性与奖励闭环。`,
    spot: {
      title: "现货",
    },
    futures: {
      title: "合约",
    },
    pools: {
      title: "流动性池",
    },
  },
} as const;

