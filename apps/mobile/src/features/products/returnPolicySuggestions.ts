const DEFAULT_RETURN_WINDOW_DAYS = 30;

const MERCHANT_RETURN_WINDOWS: {
    merchantKeywords: string[];
    merchantLabel: string;
    returnWindowDays: number;
}[] = [
        {
            merchantKeywords: ["best buy", "bestbuy"],
            merchantLabel: "Best Buy",
            returnWindowDays: 15,
        },
        {
            merchantKeywords: ["target"],
            merchantLabel: "Target",
            returnWindowDays: 90,
        },
        {
            merchantKeywords: ["walmart", "wal-mart"],
            merchantLabel: "Walmart",
            returnWindowDays: 90,
        },
        {
            merchantKeywords: ["amazon"],
            merchantLabel: "Amazon",
            returnWindowDays: 30,
        },
        {
            merchantKeywords: ["apple"],
            merchantLabel: "Apple",
            returnWindowDays: 14,
        },
        {
            merchantKeywords: ["home depot", "homedepot"],
            merchantLabel: "Home Depot",
            returnWindowDays: 90,
        },
        {
            merchantKeywords: ["lowes", "lowe's"],
            merchantLabel: "Lowe's",
            returnWindowDays: 90,
        },
    ];

export type ReturnDeadlineSuggestion = {
    deadline: string;
    returnWindowDays: number;
    merchantLabel: string | null;
    isDefaultPolicy: boolean;
};

export function getSuggestedReturnWindowDays(merchant: string): number {
    return getMatchingReturnPolicy(merchant)?.returnWindowDays ?? DEFAULT_RETURN_WINDOW_DAYS;
}

export function getReturnDeadlineSuggestion(
    merchant: string,
    purchaseDate: string
): ReturnDeadlineSuggestion | null {
    if (!isIsoDateString(purchaseDate)) {
        return null;
    }

    const matchingPolicy = getMatchingReturnPolicy(merchant);
    const returnWindowDays =
        matchingPolicy?.returnWindowDays ?? DEFAULT_RETURN_WINDOW_DAYS;

    const date = new Date(`${purchaseDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    date.setDate(date.getDate() + returnWindowDays);

    return {
        deadline: date.toISOString().slice(0, 10),
        returnWindowDays,
        merchantLabel: matchingPolicy?.merchantLabel ?? null,
        isDefaultPolicy: matchingPolicy === undefined,
    };
}

export function getSuggestedReturnDeadline(
    merchant: string,
    purchaseDate: string
): string | null {
    return getReturnDeadlineSuggestion(merchant, purchaseDate)?.deadline ?? null;
}

function getMatchingReturnPolicy(merchant: string) {
    const normalizedMerchant = merchant.trim().toLowerCase();

    if (!normalizedMerchant) {
        return undefined;
    }

    return MERCHANT_RETURN_WINDOWS.find((policy) =>
        policy.merchantKeywords.some((keyword) =>
            normalizedMerchant.includes(keyword)
        )
    );
}

function isIsoDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}