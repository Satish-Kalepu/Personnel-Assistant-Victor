import type { RequestHandler } from "express";

// Owner-selected permissive policy. Reflect values for credentialed CORS:
// browsers do not interpret '*' as all origins/headers/methods with cookies.
export const permissiveCors: RequestHandler = (req, res, next) => {
  const origin = req.get("origin");
  res.vary("Origin");
  res.set("Access-Control-Allow-Origin", origin || "*");
  res.set("Access-Control-Allow-Credentials", "true");
  res.set("Access-Control-Expose-Headers", "set-auth-token");
  if (req.method === "OPTIONS") {
    const requestedMethod = req.get("access-control-request-method");
    const methods = new Set([
      "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS",
      ...(requestedMethod ? [requestedMethod] : []),
    ]);
    res.vary("Access-Control-Request-Method");
    res.vary("Access-Control-Request-Headers");
    res.set("Access-Control-Allow-Methods", [...methods].join(", "));
    res.set("Access-Control-Allow-Headers",
      req.get("access-control-request-headers") || "Content-Type, Authorization, X-Victor-Client");
    res.status(204).end();
    return;
  }
  next();
};
