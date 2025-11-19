import { Request, Response, NextFunction } from "express";

export function contextMiddleware(req: Request, res: Response, next: NextFunction) {
    const now = new Date();
    const time = now.toISOString().substring(11, 16); // HH:MM

    const userAgent = req.headers["user-agent"] ?? "";
    const browser = userAgent.includes("Safari")
        ? "Safari"
        : userAgent.includes("Chrome")
        ? "Chrome"
        : "Unknown";

    const geo = (req.headers["x-geo"] as string) || "Unknown"; // или определение IP->страна

    req.context = { time, browser, geo };
    next();
}
