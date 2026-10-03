import { useState } from "react";
import { showToast } from "../../../utils/toast";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import type Franchise from "../../../types/database/Franchise";
import { FileUpload } from "../../../components/ui/file-upload";

import { registerFranchise, upsertFranchise } from "../api/franchise.api";

const franchiseSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().optional().nullable(),
    contact_email: z.string().email("Invalid email address"),
    owner_name: z.string().min(2, "Owner name must be at least 2 characters"),

    contact_phone: z.string().optional().nullable(),
    alternate_phone: z.string().optional().nullable(),
    website_url: z.string().optional().nullable(),

    address_line1: z.string().optional().nullable(),
    address_line2: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),

    logo_url: z.string().optional().nullable(),
    logo_document_Id: z.number().optional().nullable(),
    logo: z
      .object({
        id: z.number(),
        url: z.string(),
        fileName: z.string().optional(),
      })
      .nullable()
      .optional(),

    smtp_host: z.string().optional().nullable(),
    smtp_port: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((v) => (v === "" || v === null ? null : Number(v))),
    smtp_email: z.string().optional().nullable(),
    smtp_password: z.string().optional().nullable(),
    smtp_enable_ssl: z.boolean().default(false),
    smtp_sender_name: z.string().optional().nullable(),

    pan_number: z.string().optional().nullable(),
    gst_number: z.string().optional().nullable(),
    status: z.boolean().default(true),

    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.id) {
        return !!data.password && data.password.length >= 6;
      }
      return true;
    },
    {
      message: "Password is required and must be at least 6 characters",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (!data.id && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

// Use z.input for the form (before transforms) — this is what react-hook-form works with
type FranchiseFormInput = z.input<typeof franchiseSchema>;

// Use z.output for the mutation payload (after transforms)
type FranchiseFormOutput = z.output<typeof franchiseSchema>;

interface FranchiseFormProps {
  initialData?: Franchise;
}

const FranchiseForm = ({ initialData }: FranchiseFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FranchiseFormInput>({
    resolver: zodResolver(franchiseSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || "",
      code: initialData?.code || "",
      contact_email: initialData?.contact_email || "",
      owner_name: initialData?.owner_name || "",
      contact_phone: initialData?.contact_phone || "",
      alternate_phone: initialData?.alternate_phone || "",
      website_url: initialData?.website_url || "",
      address_line1: initialData?.address_line1 || "",
      address_line2: initialData?.address_line2 || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      country: initialData?.country || "",
      postal_code: initialData?.postal_code || "",
      logo_url: initialData?.logo_url || "",
      logo_document_Id: initialData?.logo_document_Id || null,
      logo: initialData?.logo_url ? {
        id: initialData.logo_document_Id || 0,
        url: initialData.logo_url,
        fileName: "Franchise Logo"
      } : null,
      smtp_host: initialData?.smtp_host || "",
      smtp_port: initialData?.smtp_port ?? undefined,
      smtp_email: initialData?.smtp_email || "",
      smtp_password: initialData?.smtp_password || "",
      smtp_enable_ssl: initialData?.smtp_enable_ssl || false,
      smtp_sender_name: initialData?.smtp_sender_name || "",
      pan_number: initialData?.pan_number || "",
      gst_number: initialData?.gst_number || "",
      status: initialData?.status ?? true,
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (formData: FranchiseFormOutput) => {
      const payload: any = {
        name: formData.name,
        code: formData.code,
        contact_email: formData.contact_email,
        owner_name: formData.owner_name,
        contact_phone: formData.contact_phone,
        alternate_phone: formData.alternate_phone,
        website_url: formData.website_url,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        logo_document_Id: formData.logo?.id || null,
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_email: formData.smtp_email,
        smtp_password: formData.smtp_password,
        smtp_enable_ssl: formData.smtp_enable_ssl,
        smtp_sender_name: formData.smtp_sender_name,
        pan_number: formData.pan_number,
        gst_number: formData.gst_number,
        status: formData.status,
      };

      if (isEditMode) {
        payload.id = formData.id;
      } else {
        payload.password = formData.password;
      }

      return upsertFranchise(payload);
    },
    onSuccess: async (data, variables) => {
      if (data.isSuccess) {
        queryClient.invalidateQueries({ queryKey: ["franchises"] });

        if (!isEditMode) {
          const fData = await registerFranchise({
            contact_email: variables.contact_email || "",
            name: variables.name,
            owner_name: variables.owner_name,
            id: Number(data.data?.id),
            password: variables.password,
          });
          console.log(fData);
        }
        showToast.success(data?.message || "");
        navigate("/franchise");
      } else {
        showToast.error(data?.message || "");
      }
    },
    onError: (error) => {
      showToast.apiErrorShow(error);
    },
  });

  // Parse through zod to apply transforms, then pass output type to mutation
  const onSubmit = (data: FranchiseFormInput) => {
    const parsed = franchiseSchema.parse(data) as FranchiseFormOutput;
    upsertMutation.mutate(parsed);
  };

  return (
    <Card className="max-w-4xl mx-auto mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-2xl font-bold">
            {isEditMode ? "Edit Franchise" : "Create New Franchise"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? `Updating details for ${initialData.name}`
              : "Fill in the details to register a new franchise partner."}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/franchise")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Franchise Name</Label>
                <Input
                  id="name"
                  placeholder="Enter franchise name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Franchise Code</Label>
                <Input
                  id="code"
                  placeholder="Enter franchise code"
                  {...register("code")}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_name">Owner Name</Label>
                <Input
                  id="owner_name"
                  placeholder="Enter owner name"
                  {...register("owner_name")}
                />
                {errors.owner_name && (
                  <p className="text-sm text-red-500">
                    {errors.owner_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Franchise Logo</Label>
                <Controller
                  name="logo"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FileUpload
                      value={field.value}
                      onChange={field.onChange}
                      accept="image/*"
                      maxSize={5 * 1024 * 1024} // 5MB Limit
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="status"
                    className="h-4 w-4"
                    {...register("status")}
                  />
                  <Label htmlFor="status">Active Franchise</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="franchise@example.com"
                  {...register("contact_email")}
                />
                {errors.contact_email && (
                  <p className="text-sm text-red-500">
                    {errors.contact_email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  placeholder="Enter primary phone"
                  {...register("contact_phone")}
                />
                {errors.contact_phone && (
                  <p className="text-sm text-red-500">
                    {errors.contact_phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternate_phone">Alternate Phone</Label>
                <Input
                  id="alternate_phone"
                  placeholder="Enter alternate phone"
                  {...register("alternate_phone")}
                />
                {errors.alternate_phone && (
                  <p className="text-sm text-red-500">
                    {errors.alternate_phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  placeholder="https://example.com"
                  {...register("website_url")}
                />
                {errors.website_url && (
                  <p className="text-sm text-red-500">
                    {errors.website_url.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  placeholder="Street address, P.O. box"
                  {...register("address_line1")}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  {...register("address_line2")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="City" {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input id="state" placeholder="State" {...register("state")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  {...register("country")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  placeholder="Postal Code"
                  {...register("postal_code")}
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Business Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  placeholder="Enter PAN number"
                  {...register("pan_number")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  placeholder="Enter GST number"
                  {...register("gst_number")}
                />
              </div>
            </div>
          </div>

          {/* SMTP Configuration */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              SMTP Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  placeholder="smtp.example.com"
                  {...register("smtp_host")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  placeholder="587"
                  {...register("smtp_port")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_email">SMTP Email / Username</Label>
                <Input
                  id="smtp_email"
                  placeholder="email@example.com"
                  {...register("smtp_email")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_password">SMTP Password</Label>
                <Input
                  id="smtp_password"
                  type="password"
                  placeholder="SMTP Password"
                  {...register("smtp_password")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_sender_name">Sender Name</Label>
                <Input
                  id="smtp_sender_name"
                  placeholder="Sender Name"
                  {...register("smtp_sender_name")}
                />
              </div>

              <div className="space-y-2 flex items-center pt-8">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smtp_enable_ssl"
                    className="h-4 w-4"
                    {...register("smtp_enable_ssl")}
                  />
                  <Label htmlFor="smtp_enable_ssl">Enable SSL/TLS</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication (Only on Create) */}
          {!isEditMode && (
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Authentication
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
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
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t mt-8">
            <Button
              type="submit"
              className="flex-1"
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Franchise"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/franchise")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FranchiseForm;