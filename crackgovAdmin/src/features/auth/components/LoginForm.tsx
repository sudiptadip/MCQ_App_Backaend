import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "../../../components/ui/label";
import { Separator } from "../../../components/ui/separator";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

import { loginSchema, type LoginCredentials } from "../types";
import { loginUser } from "../api/auth.api";
import { storage } from "../../../utils/storage";
import { STORAGE_KEYS } from "../../../constants";

import { showToast } from "../../../utils/toast";
import { getDeviceFingerprint } from "../../../utils/deviceFingerprint";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ✅ TanStack Query Mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      showToast.success("Logged in successfully");
      storage.set(STORAGE_KEYS.TOKEN, data.data!.token);
      storage.set(STORAGE_KEYS.USER, data.data!.user);
      navigate("/");
    },
    onError: (error: any) => {
      showToast.error(error.response?.data?.message || "Invalid email or password");
    }
  });

  // ✅ Submit Handler
  const onSubmit = async (data: LoginCredentials) => {
    
    const fingerprint = await getDeviceFingerprint();

    let payload = {
      ...data,
      deviceFingerprint: fingerprint
    }
    loginMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Email */}
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter your email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label>Password</Label>

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            {...register("password")}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Forgot Password */}
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Logging in..." : "Login"}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* Register */}
      <p className="text-center text-sm text-muted-foreground">
        Don’t have an account?{" "}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
