export const zhTW = {
  brand: "ERCS-20",
  nav: {
    swap: "兌換",
    spot: "現貨",
    futures: "合約",
    pools: "流動性池",
    ercs20: "ERCS-20",
  },
  common: {
    settings: "設定",
    language: "語言",
    theme: "主題",
    themeLight: "淺色",
    themeDark: "深色",
    themeSystem: "跟隨系統",
    roadmap: "路線圖",
  },
  wallet: {
    connect: "連接錢包",
    connectPlaceholder:
      "下一步將接入 WalletConnect。準備好後請在環境變數中填寫 NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID。",
  },
  home: {
    heroBadge: "ERCS-20",
    heroTitle: "主權流動性的代幣。",
    heroSubtitle:
      "ERCS-20 將全部供應鑄入內嵌 AMM，以原生報價資產定價，並把交易手續費回流給發行方，同時讓使用者透過存入買入、轉入賣出，遠離授權陷阱。",
    learnMore: "了解更多",
    protocolEyebrow: "協議",
    protocolTitle: "ERCS-20 如何運作",
    ctaSwap: "進入兌換",
    ctaErcs20: "部署 ERCS-20",
    heroFeatureAmm: "內嵌 AMM",
    heroFeatureTrade: "兌換無需授權額度",
    heroFeatureFees: "手續費歸發行方",
  },
  swap: {
    title: "兌換",
    sell: "賣出",
    buy: "買入",
    balance: "餘額",
    selectToken: "選擇代幣",
    enterAmount: "0",
    flip: "調換方向",
    settings: "交易設定",
    slippage: "滑點容忍",
    deadline: "交易截止時間",
    rate: "匯率",
    priceImpact: "價格影響",
    reserveToken: "代幣儲備",
    reserveQuote: "報價儲備",
    review: "預覽",
    swapAction: "兌換",
    native: "USDC",
    stock: "ERCS-20",
  },
  ercs20: {
    title: "部署 ERCS-20",
    subtitle: "透過工廠建立新代幣（Factory.create）。本階段僅版面樣式。",
    name: "名稱",
    symbol: "符號",
    totalSupply: "總供應量",
    seedQuote: "初始報價儲備（種子）",
    newOwner: "新擁有者地址",
    submit: "建立代幣",
    hint: "尚未接入鏈上呼叫，僅供樣式確認。",
  },
  phase2: {
    spot: {
      title: "現貨",
      body: "現貨市場與更深流動性預計在第二期提供。",
      roadmap:
        "規劃：統一現貨路由或訂單簿整合、更深池子、以及與 ERCS-20 路線圖一致的成交體驗。",
    },
    futures: {
      title: "合約",
      body: "永續與衍生性商品流程不在第一期範圍內。",
      roadmap:
        "規劃：鏈下簽章＋鏈上結算（類 dYdX 流程）、風控與手續費分配。",
    },
    pools: {
      title: "流動性池",
      body: "獨立池管理介面將在核心兌換路徑穩定後提供。",
      roadmap:
        "規劃：池子總覽、數據看板、以及與更大 DEX 里程碑相關的激勵入口。",
    },
  },
} as const;

