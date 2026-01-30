import type { Database } from "./database";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];
export type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export interface RegistrationFormData {
  username: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export interface RegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
  organization?: {
    id: string;
    username: string;
    name: string;
  };
}
