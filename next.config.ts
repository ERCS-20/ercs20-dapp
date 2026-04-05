import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * LAN 访问 dev 时，Next 会用 Origin 里的「主机名」做白名单比对，不含端口。
   * 写成 `192.168.31.122:3000` 不会匹配，会导致 /_next 与 HMR WebSocket 403，页面上交互失效。
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: ["192.168.31.147"],

  devIndicators: false,
};

export default nextConfig;
