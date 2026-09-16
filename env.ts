import z from 'zod';

import packageJSON from './package.json';

const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']),
  EXPO_PUBLIC_NAME: z.string().min(1),
  EXPO_PUBLIC_SCHEME: z.string().min(1),
  EXPO_PUBLIC_BUNDLE_ID: z.string().min(1),
  EXPO_PUBLIC_PACKAGE: z.string().min(1),
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_ASSOCIATED_DOMAIN: z.string().url().optional(),
});

// Check if strict validation is required (during prebuild)
const STRICT_ENV_VALIDATION = process.env.STRICT_ENV_VALIDATION === '1';

const raw = {
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_NAME: process.env.EXPO_PUBLIC_NAME,
  EXPO_PUBLIC_SCHEME: process.env.EXPO_PUBLIC_SCHEME,
  EXPO_PUBLIC_BUNDLE_ID: process.env.EXPO_PUBLIC_BUNDLE_ID,
  EXPO_PUBLIC_PACKAGE: process.env.EXPO_PUBLIC_PACKAGE,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_ASSOCIATED_DOMAIN: process.env.EXPO_PUBLIC_ASSOCIATED_DOMAIN,
};

const parsed = envSchema.safeParse(raw);

if (parsed.success === false) {
  const errorMessage
    = `❌ Invalid environment variables:\n${JSON.stringify(
      parsed.error.flatten().fieldErrors,
      null,
      2,
    )}`
    + `\n💡 Ensure .env.${raw.EXPO_PUBLIC_APP_ENV} file exists with all required variables.`
    + `\n💡 Restart with -c to clear cache.`;

  if (STRICT_ENV_VALIDATION) {
    console.error(errorMessage);
    throw new Error('Invalid environment variables');
  }

  console.warn(errorMessage);
}

const Env = {
  ...(parsed.success ? parsed.data : (raw as z.infer<typeof envSchema>)),
  EXPO_PUBLIC_VERSION: packageJSON.version,
};

export default Env;
