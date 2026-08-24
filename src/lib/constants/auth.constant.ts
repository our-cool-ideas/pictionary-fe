/** Name of the httpOnly cookie holding the backend JWT. JS never reads this directly. */
export const AUTH_COOKIE_NAME = "pictionary_admin_token";

/** Matches the backend's JWT_EXPIRES_IN default (7d), in seconds. */
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin/categories";
