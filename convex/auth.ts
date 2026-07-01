import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

// Login con GitHub. Las credenciales (AUTH_GITHUB_ID / AUTH_GITHUB_SECRET)
// se configuran como variables de entorno del deployment de Convex, no aquí.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
});
