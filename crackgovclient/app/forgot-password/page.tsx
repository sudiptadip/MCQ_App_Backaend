"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

// Step 1 Schema: Email input
const emailSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email address is required"),
});

// Step 2 Schema: OTP & New Password
const resetSchema = yup.object().shape({
  otp: yup
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .required("OTP is required"),
  newPassword: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your new password"),
});

type EmailFormValues = yup.InferType<typeof emailSchema>;
type ResetFormValues = yup.InferType<typeof resetSchema>;

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [email, setEmail] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form 1: Email Request
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    setValue: setEmailValue,
    formState: { errors: emailErrors },
  } = useForm<EmailFormValues>({
    resolver: yupResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Form 2: OTP & Reset Password
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm<ResetFormValues>({
    resolver: yupResolver(resetSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  // Pre-fill email from query param if available
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      setEmailValue("email", emailParam);
    }
  }, [searchParams, setEmailValue]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP
  const onRequestOtp = async (data: EmailFormValues) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const cleanEmail = data.email.trim().toLowerCase();
      const response = await fetchApi("/Auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (response.isSuccess) {
        setEmail(cleanEmail);
        setSuccessMsg(response.message || "A verification OTP has been sent to your email.");
        setStep("verify");
        setResendCooldown(60);
      } else {
        setError(response.message || "Unable to send reset OTP. Please check your email.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const onResetPassword = async (data: ResetFormValues) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetchApi("/Auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp: data.otp.trim(),
          newPassword: data.newPassword,
        }),
      });

      if (response.isSuccess) {
        setStep("success");
      } else {
        setError(response.message || "Failed to reset password. Please verify your OTP.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const onResendOtp = async () => {
    if (resendCooldown > 0 || !email) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetchApi("/Auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (response.isSuccess) {
        setSuccessMsg(response.message || "A fresh OTP code has been sent to your email.");
        setResendCooldown(60);
      } else {
        setError(response.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-border/80 bg-card">
        {/* Step 1: Request OTP */}
        {step === "request" && (
          <>
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <KeyRound className="size-6" />
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                Enter your registered student email address. We will send you a 6-digit OTP to reset your password.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-medium">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit(onRequestOtp)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@example.com"
                      className="pl-10"
                      aria-invalid={!!emailErrors.email}
                      {...registerEmail("email")}
                    />
                  </div>
                  {emailErrors.email && (
                    <p className="text-xs text-destructive font-medium">{emailErrors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold shadow-md"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send Reset OTP"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center border-t pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Back to Login
              </Link>
            </CardFooter>
          </>
        )}

        {/* Step 2: Enter OTP & New Password */}
        {step === "verify" && (
          <>
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="size-6" />
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                Reset Password
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                Enter the 6-digit OTP sent to <span className="font-semibold text-foreground">{email}</span> and your new password.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {successMsg && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-medium">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4">
                {/* 6-Digit OTP */}
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-xs font-bold text-foreground">
                    6-Digit OTP Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center text-xl font-mono tracking-[0.4em] h-12 font-bold"
                    aria-invalid={!!resetErrors.otp}
                    {...registerReset("otp")}
                  />
                  {resetErrors.otp && (
                    <p className="text-xs text-destructive font-medium">{resetErrors.otp.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-bold text-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      className="pl-10 pr-10"
                      aria-invalid={!!resetErrors.newPassword}
                      {...registerReset("newPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {resetErrors.newPassword && (
                    <p className="text-xs text-destructive font-medium">{resetErrors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-foreground">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      className="pl-10 pr-10"
                      aria-invalid={!!resetErrors.confirmPassword}
                      {...registerReset("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {resetErrors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium">{resetErrors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold shadow-md mt-2"
                  disabled={loading}
                >
                  {loading ? "Resetting Password..." : "Update Password"}
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep("request")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Change email
                  </button>

                  <button
                    type="button"
                    onClick={onResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            </CardContent>
          </>
        )}

        {/* Step 3: Success Screen */}
        {step === "success" && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Password Reset Successful!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Your password has been updated securely. You can now log in using your new password.
              </p>
            </div>

            <Button
              onClick={() => router.push("/login")}
              className="w-full h-11 text-sm font-bold gap-2"
            >
              <span>Back to Login</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center p-12 text-sm text-muted-foreground">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
