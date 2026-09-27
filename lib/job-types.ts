export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type VideoJobPayload = {
  title?: string;
  topic: string;
  audience?: string;
  tone?: string;
  duration?: string;
  voice?: string;
  uploadToYouTube?: boolean;
  privacyStatus?: "private" | "public" | "unlisted";
};

export type JobResult = {
  title: string;
  topic: string;
  scenes: number;
  videoPath: string;
  thumbnailPath: string;
  subtitlePath: string;
  youtube?: {
    videoId: string;
    url: string;
  };
  generatedAt: string;
};

export type JobRecord = {
  jobId: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
  payload: VideoJobPayload;
  result?: JobResult;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
};
