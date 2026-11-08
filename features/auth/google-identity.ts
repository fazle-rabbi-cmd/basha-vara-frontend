type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        error_callback?: (error: any) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          theme: 'outline';
          size: 'large';
          text: 'signin_with' | 'signup_with';
          shape: 'rectangular';
          width: number;
        },
      ) => void;
    };
  };
};

let initializedClientId: string | null = null;
let credentialHandler: ((credential: string) => void) | null = null;
let errorHandler: ((error: any) => void) | null = null;

export function renderGoogleSignInButton(
  clientId: string,
  container: HTMLElement,
  onCredential: (credential: string) => void,
  text: 'signin_with' | 'signup_with',
  onError?: (error: Error) => void,
) {
  const google = (window as Window & { google?: GoogleIdentity }).google;
  if (!google?.accounts?.id) {
    const error = new Error('Google services are not available.');
    onError?.(error);
    throw error;
  }

  credentialHandler = onCredential;
  errorHandler = onError || null;

  if (initializedClientId !== clientId) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        credentialHandler?.(response.credential);
      },
      error_callback: (error: any) => {
        errorHandler?.(new Error(error?.error || error?.message || 'Google authentication failed'));
      },
    });
    initializedClientId = clientId;
  }

  container.replaceChildren();
  google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    text,
    shape: 'rectangular',
    width: Math.min(Math.floor(container.getBoundingClientRect().width), 400),
  });

  return () => container.replaceChildren();
}