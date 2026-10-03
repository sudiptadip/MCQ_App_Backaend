import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { updateStudentDetails } from "../api/student.api";
import { showToast } from "../../../utils/toast";

const parseDbDatetime = (dbDateString?: string | null) => {
  if (!dbDateString) return null;
  // Replace space with T to make it standard ISO for safe cross-browser parsing
  const isoString = dbDateString.replace(" ", "T");
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;
  return date;
};

const formatDatetimeLocal = (dateString?: string | null) => {
  if (!dateString) return "";
  const date = parseDbDatetime(dateString);
  if (!date) return "";
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};


const studentDetailsSchema = z.object({
  user_id: z.number(),
  gender: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  mobile_no: z.string().optional().nullable(),
  alternate_mobile_no: z.string().optional().nullable(),
  address_line1: z.string().optional().nullable(),
  address_line2: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  profile_image_url: z.string().optional().nullable(),
  status: z.boolean().default(true),
  ValidityDate: z.string().optional().nullable(),
});


type StudentDetailsFormInput = z.input<typeof studentDetailsSchema>;
type StudentDetailsFormOutput = z.output<typeof studentDetailsSchema>;

interface StudentDetailsFormProps {
  initialData?: any; // any because it comes from the API which matches Student interface
  userId: number;
}

const StudentDetailsForm = ({ initialData, userId }: StudentDetailsFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentDetailsFormInput>({
    resolver: zodResolver(studentDetailsSchema),
    defaultValues: {
      user_id: userId,
      gender: initialData?.gender || "",
      date_of_birth: initialData?.date_of_birth ? new Date(initialData.date_of_birth).toISOString().split('T')[0] : "",
      mobile_no: initialData?.mobile_no || "",
      alternate_mobile_no: initialData?.alternate_mobile_no || "",
      address_line1: initialData?.address_line1 || "",
      address_line2: initialData?.address_line2 || "",
      email: initialData?.email || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      country: initialData?.country || "",
      postal_code: initialData?.postal_code || "",
      profile_image_url: initialData?.profile_image_url || "",
      status: initialData?.status ?? true,
      ValidityDate: initialData?.ValidityDate ? formatDatetimeLocal(initialData.ValidityDate) : "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: StudentDetailsFormOutput) => {
      return updateStudentDetails(data);
    },
    onSuccess: (data) => {
      if (data.isSuccess) {
        showToast.success(data.message || "Student details updated successfully");
        queryClient.invalidateQueries({ queryKey: ["studentDetails", userId] });
        navigate("/student");
      } else {
        showToast.error(data.message || "Something went wrong");
      }
    },
    onError: (error) => {
      showToast.apiErrorShow(error);
    }
  });

  const onSubmit = (data: StudentDetailsFormInput) => {
    const parsed = studentDetailsSchema.parse(data) as StudentDetailsFormOutput;
    
    let formattedValidityDate: string | null = null;
    if (parsed.ValidityDate) {
      const date = new Date(parsed.ValidityDate);
      if (!isNaN(date.getTime())) {
        let seconds = 0;
        let milliseconds = 0;
        if (initialData?.ValidityDate) {
          const initialDate = parseDbDatetime(initialData.ValidityDate);
          if (initialDate) {
            seconds = initialDate.getSeconds();
            milliseconds = initialDate.getMilliseconds();
          }
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const secStr = String(seconds).padStart(2, '0');
        const msStr = String(milliseconds).padStart(3, '0');
        
        formattedValidityDate = `${year}-${month}-${day} ${hours}:${minutes}:${secStr}.${msStr}`;
      }
    }

    const payload = {
      ...parsed,
      date_of_birth: parsed.date_of_birth || null,
      ValidityDate: formattedValidityDate,
    };
    updateMutation.mutate(payload);
  };


  return (
    <Card className="max-w-4xl mx-auto mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-2xl font-bold">Update Student Details</CardTitle>
          <CardDescription>
            Modify the additional details for this student profile.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/student")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register("date_of_birth")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  {...register("gender")}
                >
                  <option value="" className="bg-background text-muted-foreground">Select Gender</option>
                  <option value="Male" className="bg-background text-foreground">Male</option>
                  <option value="Female" className="bg-background text-foreground">Female</option>
                  <option value="Other" className="bg-background text-foreground">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_image_url">Profile Image URL</Label>
                <Input
                  id="profile_image_url"
                  placeholder="https://example.com/image.jpg"
                  {...register("profile_image_url")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ValidityDate">Validity Date & Time</Label>
                <Input
                  id="ValidityDate"
                  type="datetime-local"
                  {...register("ValidityDate")}
                />
              </div>
              
              <div className="space-y-2 flex items-center pt-8">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="status"
                    className="h-4 w-4"
                    {...register("status")}
                  />
                  <Label htmlFor="status">Active Account</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_no">Mobile Number</Label>
                <Input
                  id="mobile_no"
                  placeholder="Enter primary phone"
                  {...register("mobile_no")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternate_mobile_no">Alternate Mobile</Label>
                <Input
                  id="alternate_mobile_no"
                  placeholder="Enter alternate phone"
                  {...register("alternate_mobile_no")}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Address</h3>
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

          <div className="flex items-center gap-4 pt-4 border-t mt-8">
            <Button
              type="submit"
              className="flex-1"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/student")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudentDetailsForm;
