const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiOptions extends RequestInit {
  token?: string;
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, ...fetchOptions } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message =
      data?.error ?? "An unexpected error occurred.";

    throw new Error(message);
  }

  return data as T;
}
