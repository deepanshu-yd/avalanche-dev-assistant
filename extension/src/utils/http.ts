import axios from "axios";

export async function postJson<T>(url: string, body: unknown, timeoutMs = 15000): Promise<T> {
  const res = await axios.post<T>(url, body, { timeout: timeoutMs });
  return res.data;
}
