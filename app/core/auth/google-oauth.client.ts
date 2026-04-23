interface GoogleCodeClientResponse {
  code?: string;
  error?: string;
  error_description?: string;
}

interface GoogleCodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode: "popup";
  callback: (response: GoogleCodeClientResponse) => void;
}

interface GoogleCodeClient {
  requestCode(): void;
}

interface GoogleOAuth2 {
  initCodeClient(config: GoogleCodeClientConfig): GoogleCodeClient;
}

interface GoogleAccounts {
  oauth2: GoogleOAuth2;
}

interface GoogleIdentity {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("Google OAuth is only available in browser"));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity script"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function requestGoogleAuthorizationCode(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error("VITE_GOOGLE_AUTH_CLIENT_ID is not configured");
  }

  await loadGoogleScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google OAuth client is unavailable");
  }

  return new Promise<string>((resolve, reject) => {
    const codeClient = window.google?.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: (response) => {
        if (response.error) {
          reject(
            new Error(
              response.error_description ?? `Google OAuth error: ${response.error}`,
            ),
          );
          return;
        }

        if (!response.code) {
          reject(new Error("Google OAuth did not return authorization code"));
          return;
        }

        resolve(response.code);
      },
    });

    if (!codeClient) {
      reject(new Error("Failed to initialize Google OAuth client"));
      return;
    }

    codeClient.requestCode();
  });
}
