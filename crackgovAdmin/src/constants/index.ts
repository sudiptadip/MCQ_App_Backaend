export const APP_NAME = "MCQ App";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  STUDENT: "STUDENT",
  FRANCHISE_ADMIN: "FRANCHISE_ADMIN",
};

export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  FRANCHISE_LOGO: "franchise_logo",
  FRANCHISE_NAME: "franchise_name",
} as const;


export const AUTH_ENDPOINT = {
    ONLY_ADMIN: "execute-sp/auth-admin",
    ADMIN_AND_FRANCHISE: "execute-sp/auth-admin-franchise",
    ALL: "execute-sp/auth-all"
}