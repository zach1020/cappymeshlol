export type AssetMode = "game" | "print" | "creator" | "shop";

export type AssetStatus = "uploaded" | "queued" | "running" | "complete" | "failed";

export type GenerationStatus =
  | "queued"
  | "running_sam3d"
  | "postprocessing"
  | "texturing"
  | "exporting"
  | "complete"
  | "failed_refunded";

export type UserPlan = "free" | "starter" | "creator" | "studio" | "enterprise";

export type User = {
  id: string;
  email: string;
  displayName?: string;
  stripeCustomerId?: string;
  plan: UserPlan;
  credits: number;
  createdAt: string;
  updatedAt: string;
};

export type Asset = {
  id: string;
  userId: string;
  title: string;
  inputImageUrl: string;
  prompt?: string;
  mode: AssetMode;
  visibility: "private" | "public";
  status: AssetStatus;
  previewImageUrl?: string;
  glbUrl?: string;
  objUrl?: string;
  stlUrl?: string;
  fbxUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type GenerationJob = {
  id: string;
  userId: string;
  assetId: string;
  status: GenerationStatus;
  progress: number;
  creditsReserved: number;
  creditsConsumed: number;
  errorMessage?: string;
  workerId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};
