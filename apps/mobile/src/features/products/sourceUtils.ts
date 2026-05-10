import type { ProductSource } from "./types";

export function getProductSourceLabel(source: ProductSource): string {
  if (source === "receipt_ai") {
    return "AI receipt extraction";
  }

  return "Manual entry";
}