import { Navigate, Outlet } from "react-router-dom";
import { storage } from "../../utils/storage";
import { STORAGE_KEYS } from "../../constants";

const PublicRoute = () => {
  const token = storage.get<string>(STORAGE_KEYS.TOKEN);
  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
