import { PoseLandmarker } from "@mediapipe/tasks-vision";

/** MediaPipe Pose 랜드마크 (정규화 좌표 0~1) */
export interface PoseLandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/** 얼굴 랜드마크(0~10) 제외 — 몸통·팔·다리 11~32 */
export const FACE_LANDMARK_COUNT = 11;

export const BODY_LANDMARK_INDICES: number[] = Array.from(
  { length: 33 - FACE_LANDMARK_COUNT },
  (_, i) => i + FACE_LANDMARK_COUNT,
);

/** 측정 품질·visibility 평균에 사용하는 랜드마크 */
export const KEY_LANDMARK_INDICES: number[] = BODY_LANDMARK_INDICES;

/** BlazePose 33개 중 얼굴을 제외한 연결선 */
export const POSE_CONNECTIONS: [number, number][] =
  PoseLandmarker.POSE_CONNECTIONS.filter(
    ({ start, end }) =>
      start >= FACE_LANDMARK_COUNT && end >= FACE_LANDMARK_COUNT,
  ).map(({ start, end }) => [start, end] as [number, number]);

/** sit-to-stand 분석에 쓰는 주요 관절 인덱스 */
export const POSE_INDEX = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;
