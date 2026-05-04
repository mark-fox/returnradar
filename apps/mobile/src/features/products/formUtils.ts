export function centsToPriceInput(value: number | null): string {
    if (value === null) {
        return "";
    }

    return (value / 100).toFixed(2);
}

export function parsePriceToCents(value: string): number | null {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const normalizedValue = trimmedValue.replace("$", "");
    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return null;
    }

    return Math.round(parsedValue * 100);
}

export function isValidDateString(value: string): boolean {
    if (!value.trim()) {
        return true;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(value)) {
        return false;
    }

    const parsedDate = new Date(`${value}T00:00:00`);

    return !Number.isNaN(parsedDate.getTime());
}

export function normalizeOptionalDate(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue ? trimmedValue : null;
}