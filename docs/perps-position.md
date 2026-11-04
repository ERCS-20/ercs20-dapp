# 永续持仓：成本价与盈亏

金额和数量都是 18 位精度整数。净仓为 0，或成本名义不为正时，成本价视为缺失。

## 成本价

成本价是这一轮盈亏回到 0 的价格。剩下的仓按这个价格平掉，列表上的收益为 0。它不是当前方向的成交均价。

本金只有 `totalTradeMargin + totalMarginAdjust`，不加手续费，也不加资金费。下面的 `balanceMargin` 含未结算资金费，算法和保证金、强平价相同，见下一节。

```text
多仓成本名义 = totalTradeMargin + totalMarginAdjust − balanceMargin
空仓成本名义 = balanceMargin − totalTradeMargin − totalMarginAdjust
成本价     = 成本名义 / |balancePosition|
```

手续费和资金费只进 `balanceMargin`。余额变小，成本名义变大，剩下的仓要值更多钱，这一轮才回到 0。追加或提取保证金时，`totalMarginAdjust` 和 `balanceMargin` 同号变动，成本价不变。

减仓和翻仓不另做结算，价差留在 `balanceMargin` 里。同一套差额仍然成立，不用按成交重放。翻仓后的成本价包含被平掉那段尚未结出的盈亏：在新方向的成交价平掉，这一轮仍留着那段盈亏；要整轮回到 0，剩下的仓要再把那段盈亏吐回去。

杠杆用的是另一套开仓名义（`margin − balanceMargin` 或反向），见持仓列表计算。那个名义抵消了手续费和资金费，不能拿来当成本价。

列表在强平价前展示这一列。点击平仓时把当时的成本价传给弹层。

## 未结算资金费

和保证金、强平价用同一笔未结算资金费。`fundingIndex` 推送 `MarketFundingIndexRsp` 后，列表用缓存里更新的全局指数重算成本价。`value` 是 globalFundingIndex，`timestamp` 是 Unix 秒。持仓上的 `fundingValue`、`fundingTimestamp` 是该仓上次结算时的指数。同一交易对只留更新的一条（`blockNumber` 更大优先，相同再比 `blockLogIndex`）。

`fundingTimestamp` 小于这条全局指数的 `timestamp` 时，整数除法，向 0 截断：

```text
indexDelta    = globalValue − fundingValue
unsettled     = −(indexDelta × balancePosition) / 10^18
balanceMargin = 接口 balanceMargin + unsettled
```

本金不加 `unsettled`。时间相等，或还没有全局指数时，`unsettled = 0`，`balanceMargin` 用接口原值。

持仓列表订阅该交易对的 `fundingIndex`。推送写入缓存后重跑 `positionsRspToRow`，成本价、保证金、强平价、收益一起变。平仓弹层用的是打开时传入的成本价，之后的 `fundingIndex` 不改弹层。

## 未实现盈亏

持仓列表用标记价给整仓估值。标记价缺失或 ≤ 0 时不显示。

```text
markQuote = |balancePosition| × mark / 1e18
equity    = 多仓 ? balanceMargin + markQuote : balanceMargin - markQuote
pnl       = equity - totalTradeMargin - totalMarginAdjust
```

这里的 `balanceMargin` 与成本价用的是同一个数。标记价等于成本价时，收益为 0。

## 平仓预计盈亏

按弹层里的平仓价格，和这次要平的数量，对照传入的成本价：

```text
平多：(平仓价格 - 成本价) × 平仓数量
平空：(成本价 - 平仓价格) × 平仓数量
```

平掉全部剩余数量时，这个价差等于列表上这一轮的收益。它已经含进成本价里的手续费和资金费，不含这一笔平仓自己的手续费，也不再乘杠杆。

只平一部分时，已经落在余额里的盈亏会按数量分摊进这个价差。成本价、平仓价格或平仓数量缺失时显示「—」。
