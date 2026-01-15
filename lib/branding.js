// Central, immutable branding constants.
// IMPORTANT: This project is attribution-protected.

export const APP_NAME = "Streamy";
export const AUTHOR_NAME = "Deep Ghosh";

export function requireBranding() {
  if (typeof APP_NAME !== "string" || APP_NAME.trim().length === 0) {
    throw new Error(
      "Branding missing: APP_NAME is required and must be a non-empty string."
    );
  }

  if (typeof AUTHOR_NAME !== "string" || AUTHOR_NAME.trim().length === 0) {
    throw new Error(
      "Branding missing: AUTHOR_NAME is required and must be a non-empty string."
    );
  }

  return { APP_NAME, AUTHOR_NAME };
}

// Fail-fast on import so branding cannot be made optional.
requireBranding();
