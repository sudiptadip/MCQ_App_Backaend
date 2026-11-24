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
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const signupSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .required("Full name is required"),
  email: yup
    .string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  phone: yup
    .string()
    .trim()
    .test("phone-check", "Phone must be a valid 10-digit number", (val) => {
      if (!val) return true;
      return /^[0-9]{10}$/.test(val.replace(/[\s-]/g, ""));
    })
    .optional(),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

type SignupFormValues = yup.InferType<typeof signupSchema>;

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle URL query parameters (e.g. redirected from login with unverified email)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const stepParam = searchParams.get("step");
    if (emailParam) {
      setRegisteredEmail(emailParam);
      setValue("email", emailParam);
      if (stepParam === "otp") {
        setStep("otp");
      }
    }
  }, [searchParams, setValue]);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/");
    }
  }, [router]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Submit Registration Form
  const onSignupSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetchApi("/Auth/register-web-student", {
        method: "POST",
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          phone: data.phone ? data.phone.trim() : null,
        }),
      });

      if (response.isSuccess) {
        setRegisteredEmail(data.email.trim().toLowerCase());
        setSuccessMsg(
          response.message || "Registration successful! Please verify the OTP sent to your email."
        );
        setStep("otp");
        setResendCooldown(60);
      } else {
        setError(response.message || "Failed to create account. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP for Verification
  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetchApi("/Auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: registeredEmail,
          otp: otp.trim(),
        }),
      });

      if (response.isSuccess) {
        setStep("success");
      } else {
        setError(response.message || "Invalid or expired OTP code. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP code");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const onResendOtp = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetchApi("/Auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({
          email: registeredEmail,
        }),
      });

      if (response.isSuccess) {
        setSuccessMsg(response.message || "A fresh OTP has been sent to your email.");
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
      <Card className="w-full max-w-lg shadow-xl border-border/80 bg-card">
        {/* Step 1: Registration Form */}
        {step === "form" && (
          <>
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Create an Account
              </CardTitle>
              <CardDescription className="text-sm">
                Join CrackGov as a student to access mock tests, study materials, and track your government exam preparation.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive font-medium">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSignupSubmit)} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. Rahul Verma"
                      className="pl-10"
                      aria-invalid={!!errors.name}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-foreground">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@example.com"
                      className="pl-10"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                  )}
                </div>

                {/* Mobile / Phone Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-foreground">
                    Mobile Number <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 9831967172"
                      className="pl-10"
                      aria-invalid={!!errors.phone}
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-foreground">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      className="pl-10 pr-10"
                      aria-invalid={!!errors.password}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-foreground">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      className="pl-10 pr-10"
                      aria-invalid={!!errors.confirmPassword}
                      {...register("confirmPassword")}
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
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold shadow-md transition-all mt-2"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Sign Up as Student"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 text-center text-xs text-muted-foreground border-t pt-4">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Log in here
                </Link>
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                By signing up, you agree to CrackGov Terms of Service & Privacy Policy.
              </p>
            </CardFooter>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <>
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <KeyRound className="size-6" />
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-sm">
                We sent a 6-digit verification code to{" "}
                <span className="font-semibold text-foreground">{registeredEmail}</span>.
                Please enter it below to activate your account.
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

              <form onSubmit={onVerifyOtp} className="space-y-5">
                <div className="space-y-2 text-center">
                  <Label htmlFor="otp" className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Enter 6-Digit OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123456"
                    className="text-center text-2xl font-mono tracking-[0.5em] h-14 font-bold"
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold shadow-md"
                  disabled={loading || otp.length < 6}
                >
                  {loading ? "Verifying..." : "Verify & Activate Account"}
                </Button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Edit details
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

        {/* Step 3: Success State */}
        {step === "success" && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Account Verified!
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Your email has been confirmed and your student account is active. You can now log in to begin practicing.
              </p>
            </div>

            <Button
              onClick={() => router.push("/login")}
              className="w-full h-11 text-sm font-bold gap-2"
            >
              <span>Go to Login</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center p-12 text-sm text-muted-foreground">Loading signup...</div>}>
      <SignupContent />
    </Suspense>
  );
}