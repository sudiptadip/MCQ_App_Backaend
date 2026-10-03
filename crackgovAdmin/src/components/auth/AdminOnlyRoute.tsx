import { Navigate, Outlet } from "react-router-dom";
import { ROLES, STORAGE_KEYS } from "../../constants";
import { storage } from "../../utils/storage";
import type { User } from "../../features/auth/types";

export default function AdminOnlyRoute() {
  const user = storage.get<User>(STORAGE_KEYS.USER);
  return user?.role === ROLES.SUPER_ADMIN ? <Outlet /> : <Navigate to="/403" replace />;
}
