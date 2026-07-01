import { httpRouter } from "convex/server";
import { auth } from "./auth";

// Registra las rutas HTTP que usa Convex Auth (callbacks de OAuth, etc.).
const http = httpRouter();
auth.addHttpRoutes(http);

export default http;
