import { API_ROUTES } from "../../../constants/apiRoute";
import api from "../../../lib/axios";
import type apiResponse from "../../../types/apiResponse";
import type { AuthResponse, LoginCredentials } from "../types";


export const loginUser = async (data: LoginCredentials): Promise<apiResponse<AuthResponse>> => {
  const response = await api.post(API_ROUTES.LOGIN, data);
  return response.data;
};

// export const registerUser = async (data: any): Promise<AuthResponse> => {
//   const response = await api.post('/auth/register', data);
//   return response.data;
// };