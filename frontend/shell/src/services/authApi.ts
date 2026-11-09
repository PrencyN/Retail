import {
  authenticatedFetch,
} from "./authenticatedFetch";

const FULFILLMENT_API =
  import.meta.env
    .VITE_FULFILLMENT_API_URL ??
  "http://localhost:5249";

export type AuthenticatedUser = {
  authenticated: boolean;

  name: string | null;

  roles: string[];

  scopes: string[];
};

export async function getCurrentUser():
  Promise<AuthenticatedUser> {
  const response =
    await authenticatedFetch(
      `${FULFILLMENT_API}/api/auth/me`,
      {
        method: "GET",
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to load the authenticated user."
    );
  }

  return response.json();
}