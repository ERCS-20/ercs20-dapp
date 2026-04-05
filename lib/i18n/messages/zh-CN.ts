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
    heroFeatureAmm: "内嵌 AMM",
    heroFeatureTrade: "兑换无需授权额度",
    heroFeatureFees: "手续费归发行方",
  },
  swap: {
    title: "兑换",
    settingsPlaceholder: "滑点与截止时间将在路由接入后开放。",
    sell: "卖出",
    buy: "买入",
    balance: "余额",
    selectToken: "选择代币",
    enterAmount: "0",
    flip: "调换方向",
    settings: "交易设置",
    slippage: "滑点容忍",
    deadline: "交易截止时间",
    rate: "汇率",
    priceImpact: "价格影响",
    reserveToken: "代币储备",
    reserveQuote: "报价储备",
    review: "预览",
    swapAction: "兑换",
    native: "USDC",
    stock: "OXD",
  },
  ercs20: {
    title: "部署 ERCS-20",
    subtitle: "通过工厂创建新代币（Factory.create）。本阶段仅布局样式。",
    name: "名称",
    symbol: "符号",
    totalSupply: "总供应量",
    seedQuote: "初始报价储备（种子）",
    newOwner: "新所有者地址",
    submit: "创建代币",
    hint: "尚未接入链上调用，仅用于样式确认。",
  },
  phase2: {
    spot: {
      title: "现货",
      body: "现货市场与更深流动性计划在第二期提供。",
      roadmap:
        "规划：统一现货路由或订单簿整合、更深池子、以及与 ERCS-20 路线图一致的成交体验。",
    },
    futures: {
      title: "合约",
      body: "永续与衍生品流程不在第一期范围内。",
      roadmap:
        "规划：链下签名 + 链上结算（类 dYdX 流程）、风控与手续费分配。",
    },
    pools: {
      title: "流动性池",
      body: "独立池管理界面将在核心兑换路径稳定后提供。",
      roadmap:
        "规划：池子总览、数据看板、以及与更大 DEX 里程碑相关的激励入口。",
    },
  },
} as const;

