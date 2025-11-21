import { Request, Response, NextFunction } from "express";
import { Context } from "@shared/types";

type FieldProcessor = (headers: Record<string, string | string[] | undefined>) => string;

type FieldConfig = {
  headerName?: string;
  processor?: FieldProcessor;
};

const contextFieldConfig: Partial<Record<keyof Context, FieldConfig>> = {
  time: {
    processor: () => new Date().toISOString().substring(11, 16)
  },
  userAgent: {
    headerName: "user-agent"
  },
  language: {
    headerName: "accept-language",
    processor: (headers) => {
      const acceptLanguage = headers["accept-language"];
      if (!acceptLanguage) {
        return "Unknown";
      }
      const langValue = Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage;
      const firstLang = langValue.split(",")[0].trim();
      return firstLang.split("-")[0].split(";")[0].trim().toLowerCase();
    }
  }
};

export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function getHeaderValue(
  fieldName: keyof Context,
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const config = contextFieldConfig[fieldName];
  const headerName = config?.headerName || camelToKebab(fieldName);
  const value = headers[headerName];
  
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function contextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headers = req.headers;
  const context = {} as Context;

  const contextKeys: Array<keyof Context> = ["time", "userAgent", "language"];
  
  for (const fieldName of contextKeys) {
    const config = contextFieldConfig[fieldName];
    
    if (config?.processor) {
      context[fieldName] = config.processor(headers);
    } else {
      const headerValue = getHeaderValue(fieldName, headers);
      context[fieldName] = headerValue ?? "Unknown";
    }
  }

  req.context = context;
  next();
}
