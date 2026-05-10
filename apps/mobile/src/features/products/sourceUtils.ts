export function getProductSourceLabel(source: string): string {
    if (source === "receipt_ai") {
        return "AI receipt extraction";
    }

    if (source === "manual") {
        return "Manual entry";
    }

    return "Unknown source";
}