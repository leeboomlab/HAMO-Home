import type { NextConfig } from "next";

// .env.local 에 MOBILE_DEV_HOST=xxxx.ngrok-free.app 설정 시 해당 호스트도 허용
const extraDevHost = process.env.MOBILE_DEV_HOST;

const nextConfig: NextConfig = {
  // ngrok·LAN IP로 모바일 dev 접속 시 JS 번들 로딩 허용 (미설정 시 버튼 무반응)
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok.app",
    "192.168.0.49",
    ...(extraDevHost ? [extraDevHost] : []),
  ],
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://hamocare.com",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
