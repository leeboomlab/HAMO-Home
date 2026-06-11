import { ProfileInfo } from "./profile";

export type AuthMode = "guest" | "google" | "none";

export interface SessionInfo {
  mode: AuthMode;
  profile: ProfileInfo | null;
}
