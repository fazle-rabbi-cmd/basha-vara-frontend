type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
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

export function renderGoogleSignInButton(
  clientId: string,
  container: HTMLElement,
  onCredential: (credential: string) => void,
  text: 'signin_with' | 'signup_with',
) {
  const google = (window as Window & { google?: GoogleIdentity }).google;
  if (!google?.accounts?.id) {
    throw new Error('Google services are not available.');
  }

  credentialHandler = onCredential;

  if (initializedClientId !== clientId) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        credentialHandler?.(response.credential);
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