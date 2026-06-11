"use client";

import { forwardRef } from "react";
import {
  BODY_LANDMARK_INDICES,
  PoseLandmarkPoint,
  POSE_CONNECTIONS,
} from "@/lib/mediapipe/types";

/**
 * skeleton overlay용 캔버스. 그리기는 drawPoseFrame()을 통해 imperative하게 수행
 * (매 프레임 React 리렌더를 피하기 위함).
 */
const PoseOverlay = forwardRef<HTMLCanvasElement>(function PoseOverlay(_, ref) {
  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
});

export default PoseOverlay;

/** 캔버스 해상도를 비디오 표시 크기에 맞춘다 */
export function syncCanvasSize(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
): void {
  const rect = video.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w > 0 && (canvas.width !== w || canvas.height !== h)) {
    canvas.width = w;
    canvas.height = h;
  }
}

/**
 * 정규화 좌표(0~1) 랜드마크를 캔버스에 그린다.
 * 비디오가 object-cover로 크롭 표시되므로 동일한 cover 변환을 적용한다.
 * @param mirror 전면 카메라 프리뷰가 반전되어 있으면 true (좌표도 함께 반전)
 */
export function drawPoseFrame(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: PoseLandmarkPoint[] | null,
  mirror: boolean,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cw = canvas.width;
  const ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  if (!landmarks || landmarks.length === 0) return;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw === 0 || vh === 0) return;

  // object-cover 변환
  const scale = Math.max(cw / vw, ch / vh);
  const offsetX = (cw - vw * scale) / 2;
  const offsetY = (ch - vh * scale) / 2;

  const px = (p: PoseLandmarkPoint) => {
    const nx = mirror ? 1 - p.x : p.x;
    return {
      x: offsetX + nx * vw * scale,
      y: offsetY + p.y * vh * scale,
    };
  };

  // 연결선
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 3;
  for (const [a, b] of POSE_CONNECTIONS) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    if (!pa || !pb) continue;
    if ((pa.visibility ?? 1) < 0.4 || (pb.visibility ?? 1) < 0.4) continue;
    const A = px(pa);
    const B = px(pb);
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
  }

  // 관절 점
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2;
  for (const idx of BODY_LANDMARK_INDICES) {
    const p = landmarks[idx];
    if (!p || (p.visibility ?? 1) < 0.4) continue;
    const P = px(p);
    ctx.beginPath();
    ctx.arc(P.x, P.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
