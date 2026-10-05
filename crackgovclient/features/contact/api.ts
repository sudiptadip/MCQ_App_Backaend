import { API_URL } from "@/lib/api";
import type { ContactPayload } from "@/types/contact";

const API_ROOT = `${API_URL.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;

export async function submitContactForm(payload: ContactPayload): Promise<{ isSuccess: boolean; message: string }> {
  const response = await fetch(`${API_ROOT}/anonymous/SpAnonymousContactUs/1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok || !result.isSuccess) {
    throw new Error(result.message || "Failed to submit message. Please try again.");
  }

  return {
    isSuccess: true,
    message: result.message || "Message sent successfully!",
  };
}
