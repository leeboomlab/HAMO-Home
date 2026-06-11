import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HAMO - 매일 3분 움직임 체크",
    short_name: "HAMO",
    description:
      "카메라로 간단한 움직임을 확인하고, 가족이 이해하기 쉬운 리포트를 받아보세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaff",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // TODO: 192x192 / 512x512 PNG 아이콘 추가 (iOS 홈 화면 대응)
    ],
  };
}
