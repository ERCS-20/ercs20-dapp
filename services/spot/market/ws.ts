import { JSONParse, JSONStringify } from "@/lib/api/json-with-bigint";
import { getSpotMarketWsUrl } from "@/lib/config/public-env";
import type {
  MarketWsChannel,
  MarketWsClientMessage,
  MarketWsControlMessage,
  MarketWsPushMessage,
} from "@/services/spot/market/types";

const PING_MS = 30_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

type SubKey = string;

type SubEntry = {
  channel: MarketWsChannel;
  pairId: number;
  interval?: string;
  count: number;
};

export type MarketWsMessageHandler = (
  msg: MarketWsPushMessage | MarketWsControlMessage
) => void;

function subKey(
  channel: MarketWsChannel,
  pairId: number,
  interval?: string
): SubKey {
  return interval ? `${channel}:${pairId}:${interval}` : `${channel}:${pairId}`;
}

function isPushMessage(msg: unknown): msg is MarketWsPushMessage {
  if (msg == null || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return typeof m.channel === "string" && typeof m.pairId === "number";
}

function isControlMessage(msg: unknown): msg is MarketWsControlMessage {
  if (msg == null || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return m.op === "pong" || m.op === "error";
}

/**
 * Native WebSocket client for `spot-market-ws` (`/ws/market`).
 * Ref-counted subscribe; app-level JSON ping every 30s; exponential reconnect.
 */
class SpotMarketWsClient {
  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private intentionalClose = false;
  private readonly refs = new Map<SubKey, SubEntry>();
  private readonly handlers = new Set<MarketWsMessageHandler>();
  private readonly reconnectHandlers = new Set<() => void>();

  isConfigured(): boolean {
    return getSpotMarketWsUrl().length > 0;
  }

  addHandler(handler: MarketWsMessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /** Fires after a successful reconnect + resubscribe (not the first connect). */
  addReconnectHandler(handler: () => void): () => void {
    this.reconnectHandlers.add(handler);
    return () => {
      this.reconnectHandlers.delete(handler);
    };
  }

  subscribe(channel: MarketWsChannel, pairId: number, interval?: string): void {
    if (!this.isConfigured()) return;
    if (channel === "kline" && !interval) {
      throw new Error("interval is required for kline subscribe");
    }

    const key = subKey(channel, pairId, interval);
    const existing = this.refs.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }

    this.refs.set(key, { channel, pairId, interval, count: 1 });
    this.ensureConnected();
    this.sendSubscribe(channel, pairId, interval);
  }

  unsubscribe(
    channel: MarketWsChannel,
    pairId: number,
    interval?: string
  ): void {
    const key = subKey(channel, pairId, interval);
    const existing = this.refs.get(key);
    if (!existing) return;

    existing.count -= 1;
    if (existing.count > 0) return;

    this.refs.delete(key);
    this.send({
      op: "unsubscribe",
      channel,
      pairId,
      ...(interval ? { interval } : {}),
    });

    if (this.refs.size === 0) {
      this.close();
    }
  }

  private ensureConnected(): void {
    if (!this.isConfigured()) return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.open();
  }

  private open(): void {
    const url = getSpotMarketWsUrl();
    if (!url || typeof WebSocket === "undefined") return;

    this.intentionalClose = false;
    this.clearReconnectTimer();

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      const wasReconnect = this.reconnectAttempt > 0;
      this.reconnectAttempt = 0;
      this.startPing();
      this.resubscribeAll();
      if (wasReconnect) {
        for (const h of this.reconnectHandlers) h();
      }
    };

    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") return;
      let parsed: unknown;
      try {
        parsed = JSONParse(ev.data);
      } catch {
        return;
      }

      if (isControlMessage(parsed)) {
        if (parsed.op === "error") {
          for (const h of this.handlers) h(parsed);
        }
        return;
      }

      if (isPushMessage(parsed)) {
        for (const h of this.handlers) h(parsed);
      }
    };

    ws.onerror = () => {
      // onclose handles reconnect
    };

    ws.onclose = () => {
      this.stopPing();
      this.ws = null;
      if (this.intentionalClose || this.refs.size === 0) return;
      this.scheduleReconnect();
    };
  }

  private close(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.stopPing();
    this.ws?.close();
    this.ws = null;
    this.reconnectAttempt = 0;
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ op: "ping" });
    }, PING_MS);
    this.send({ op: "ping" });
  }

  private stopPing(): void {
    if (this.pingTimer != null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_MS
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.refs.size === 0) return;
      this.open();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private resubscribeAll(): void {
    for (const entry of this.refs.values()) {
      this.sendSubscribe(entry.channel, entry.pairId, entry.interval);
    }
  }

  private sendSubscribe(
    channel: MarketWsChannel,
    pairId: number,
    interval?: string
  ): void {
    this.send({
      op: "subscribe",
      channel,
      pairId,
      ...(interval ? { interval } : {}),
    });
  }

  private send(msg: MarketWsClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSONStringify(msg));
  }
}

export const spotMarketWs = new SpotMarketWsClient();
