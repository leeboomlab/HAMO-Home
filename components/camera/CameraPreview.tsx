"use client";

import { forwardRef } from "react";

interface CameraPreviewProps {
  /** 전면 카메라일 때 거울처럼 좌우 반전 */
  mirrored: boolean;
  children?: React.ReactNode;
}

/**
 * 카메라 프리뷰 비디오. iOS Safari 대응을 위해 playsInline + muted 필수.
 * children으로 overlay(canvas, guide 등)를 겹쳐 그린다.
 */
const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  function CameraPreview({ mirrored, children }, ref) {
    return (
      <div className="relative w-full aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            mirrored ? "-scale-x-100" : ""
          }`}
        />
        {children}
      </div>
    );
  },
);

export default CameraPreview;
