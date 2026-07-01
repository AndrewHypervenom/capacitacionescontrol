// Configuración de autenticación de Convex Auth.
// CONVEX_SITE_URL lo define Convex automáticamente en el deployment.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
