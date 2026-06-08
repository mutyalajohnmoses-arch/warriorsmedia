/**
 * Error Handler Utilities
 * Centralized error handling for LiveKit, YouTube, and media operations
 */

export type ErrorType =
  | "CAMERA_PERMISSION_DENIED"
  | "MICROPHONE_PERMISSION_DENIED"
  | "MEDIA_DEVICE_NOT_FOUND"
  | "LIVEKIT_CONNECTION_FAILED"
  | "LIVEKIT_EGRESS_FAILED"
  | "YOUTUBE_AUTH_FAILED"
  | "YOUTUBE_BROADCAST_FAILED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  userMessage: string;
  recoverable: boolean;
}

/**
 * Classify and handle media device errors
 */
export function handleMediaError(error: unknown): AppError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  if (message.includes("permission") || message.includes("denied")) {
    if (message.includes("camera") || message.includes("video")) {
      return {
        type: "CAMERA_PERMISSION_DENIED",
        message: err.message,
        originalError: err,
        userMessage: "Camera access was denied. Please check your browser permissions.",
        recoverable: true,
      };
    }
    if (message.includes("microphone") || message.includes("audio")) {
      return {
        type: "MICROPHONE_PERMISSION_DENIED",
        message: err.message,
        originalError: err,
        userMessage: "Microphone access was denied. Please check your browser permissions.",
        recoverable: true,
      };
    }
  }

  if (message.includes("not found") || message.includes("no device")) {
    return {
      type: "MEDIA_DEVICE_NOT_FOUND",
      message: err.message,
      originalError: err,
      userMessage: "No camera or microphone found. Please check that your devices are connected.",
      recoverable: true,
    };
  }

  return {
    type: "UNKNOWN_ERROR",
    message: err.message,
    originalError: err,
    userMessage: "Failed to access camera or microphone. Please try again.",
    recoverable: true,
  };
}

/**
 * Classify and handle LiveKit errors
 */
export function handleLiveKitError(error: unknown): AppError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  if (message.includes("connection") || message.includes("connect")) {
    return {
      type: "LIVEKIT_CONNECTION_FAILED",
      message: err.message,
      originalError: err,
      userMessage: "Failed to connect to LiveKit. Please check your internet connection.",
      recoverable: true,
    };
  }

  if (message.includes("egress")) {
    return {
      type: "LIVEKIT_EGRESS_FAILED",
      message: err.message,
      originalError: err,
      userMessage: "Failed to start streaming to YouTube. Please try again.",
      recoverable: true,
    };
  }

  if (message.includes("token")) {
    return {
      type: "LIVEKIT_CONNECTION_FAILED",
      message: err.message,
      originalError: err,
      userMessage: "Invalid LiveKit token. Please refresh and try again.",
      recoverable: true,
    };
  }

  return {
    type: "LIVEKIT_CONNECTION_FAILED",
    message: err.message,
    originalError: err,
    userMessage: "LiveKit connection error. Please try again.",
    recoverable: true,
  };
}

/**
 * Classify and handle YouTube errors
 */
export function handleYouTubeError(error: unknown): AppError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  if (message.includes("unauthorized") || message.includes("401")) {
    return {
      type: "YOUTUBE_AUTH_FAILED",
      message: err.message,
      originalError: err,
      userMessage: "YouTube authentication failed. Please reconnect your YouTube channel.",
      recoverable: true,
    };
  }

  if (message.includes("broadcast")) {
    return {
      type: "YOUTUBE_BROADCAST_FAILED",
      message: err.message,
      originalError: err,
      userMessage: "Failed to create YouTube broadcast. Please try again.",
      recoverable: true,
    };
  }

  if (message.includes("quota") || message.includes("rate limit")) {
    return {
      type: "YOUTUBE_AUTH_FAILED",
      message: err.message,
      originalError: err,
      userMessage: "YouTube API quota exceeded. Please try again later.",
      recoverable: false,
    };
  }

  return {
    type: "YOUTUBE_BROADCAST_FAILED",
    message: err.message,
    originalError: err,
    userMessage: "YouTube error occurred. Please try again.",
    recoverable: true,
  };
}

/**
 * Classify and handle network errors
 */
export function handleNetworkError(error: unknown): AppError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  if (message.includes("network") || message.includes("offline")) {
    return {
      type: "NETWORK_ERROR",
      message: err.message,
      originalError: err,
      userMessage: "Network connection error. Please check your internet connection.",
      recoverable: true,
    };
  }

  if (message.includes("timeout")) {
    return {
      type: "NETWORK_ERROR",
      message: err.message,
      originalError: err,
      userMessage: "Request timeout. Please check your internet connection.",
      recoverable: true,
    };
  }

  return {
    type: "NETWORK_ERROR",
    message: err.message,
    originalError: err,
    userMessage: "Network error occurred. Please try again.",
    recoverable: true,
  };
}

/**
 * Generic error classifier
 */
export function classifyError(error: unknown, context?: string): AppError {
  const err = error instanceof Error ? error : new Error(String(error));

  // Try to classify based on context
  if (context?.includes("media")) {
    return handleMediaError(err);
  }
  if (context?.includes("livekit")) {
    return handleLiveKitError(err);
  }
  if (context?.includes("youtube")) {
    return handleYouTubeError(err);
  }
  if (context?.includes("network")) {
    return handleNetworkError(err);
  }

  // Fallback: try to infer from error message
  const message = err.message.toLowerCase();
  if (message.includes("camera") || message.includes("microphone")) {
    return handleMediaError(err);
  }
  if (message.includes("livekit")) {
    return handleLiveKitError(err);
  }
  if (message.includes("youtube")) {
    return handleYouTubeError(err);
  }
  if (message.includes("network")) {
    return handleNetworkError(err);
  }

  return {
    type: "UNKNOWN_ERROR",
    message: err.message,
    originalError: err,
    userMessage: "An unexpected error occurred. Please try again.",
    recoverable: true,
  };
}

/**
 * Log error with context
 */
export function logError(error: AppError, context: string): void {
  console.error(`[${context}] Error (${error.type}):`, {
    message: error.message,
    userMessage: error.userMessage,
    recoverable: error.recoverable,
    originalError: error.originalError,
  });
}
