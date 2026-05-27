import { redirect } from "next/navigation";

type MessageType = "success" | "error";

export function redirectWithMessage(path: string, type: MessageType, message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export function firstIssue(error: { issues?: { message: string }[] }) {
  return error.issues?.[0]?.message ?? "Please check the form and try again.";
}

export function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function formFile(value: FormDataEntryValue | null) {
  return value instanceof File ? value : null;
}
