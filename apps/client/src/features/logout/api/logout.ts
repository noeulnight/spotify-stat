import type { ApiClient } from "../../../shared/api";

export async function logout(client: ApiClient) {
  await client.http.post("/logout");
}
