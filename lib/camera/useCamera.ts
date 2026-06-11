"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraFacing } from "@/types/assessment";
import {
  CameraError,
  CameraErrorType,
  detectFacing,
  openCameraStream,
  stopStream,
} from "./cameraDevices";

export type CameraStatus = "idle" | "requesting" | "active" | "error";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  facing: CameraFacing;
  errorType: CameraErrorType | null;
  start: () => Promise<void>;
  switchFacing: () => Promise<void>;
  stop: () => void;
}

/**
 * 카메라 스트림 라이프사이클 훅.
 * - 전환 시 기존 트랙 stop 보장
 * - 언마운트/페이지 이탈 시 정리
 */
export function useCamera(initialFacing: "user" | "environment" = "user"): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestedFacingRef = useRef<"user" | "environment">(initialFacing);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [facing, setFacing] = useState<CameraFacing>("unknown");
  const [errorType, setErrorType] = useState<CameraErrorType | null>(null);

  const attach = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      // iOS Safari: 명시적 play 호출 필요할 수 있음
      video.play().catch(() => {});
    }
    const detected = detectFacing(stream);
    setFacing(detected === "unknown" ? requestedFacingRef.current : detected);
    setStatus("active");
  }, []);

  const start = useCallback(async () => {
    setStatus("requesting");
    setErrorType(null);
    stopStream(streamRef.current);
    streamRef.current = null;
    try {
      const stream = await openCameraStream(requestedFacingRef.current);
      attach(stream);
    } catch (err) {
      setErrorType(err instanceof CameraError ? err.type : "unknown");
      setStatus("error");
    }
  }, [attach]);

  const switchFacing = useCallback(async () => {
    requestedFacingRef.current =
      requestedFacingRef.current === "user" ? "environment" : "user";
    await start();
  }, [start]);

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  return { videoRef, status, facing, errorType, start, switchFacing, stop };
}
