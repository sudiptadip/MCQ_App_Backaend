function resolveSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_URL?.trim();
  const candidate = configuredUrl || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
  try {
    return new URL(candidate);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const siteUrl = resolveSiteUrl();
