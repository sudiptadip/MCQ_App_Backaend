import { Navigate, Outlet } from "react-router-dom";
import { storage } from "../../utils/storage";
import { STORAGE_KEYS } from "../../constants";

const ProtectedRoute = () => {
  const token = storage.get<string>(STORAGE_KEYS.TOKEN);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
