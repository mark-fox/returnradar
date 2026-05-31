const DEFAULT_RETURN_WINDOW_DAYS = 30;

const MERCHANT_RETURN_WINDOWS: {
    merchantKeywords: string[];
    returnWindowDays: number;
}[] = [
        {
            merchantKeywords: ["best buy", "bestbuy"],
            returnWindowDays: 15,
        },
        {
            merchantKeywords: ["target"],
            returnWindowDays: 90,
        },
        {
            merchantKeywords: ["walmart", "wal-mart"],
            returnWindowDays: 90,
        },
        {
            merchantKeywords: ["amazon"],
            returnWindowDays: 30,
        },
        {
            merchantKeywords: ["apple"],
            returnWindowDays: 14,
        },
        {
            merchantKeywords: ["home depot", "homedepot"],
            returnWindowDays: 90,
        },
        {
            merchantKeywords: ["lowes", "lowe's"],
            returnWindowDays: 90,
        },
    ];

export function getSuggestedReturnWindowDays(merchant: string): number {
    const normalizedMerchant = merchant.trim().toLowerCase();

    if (!normalizedMerchant) {
        return DEFAULT_RETURN_WINDOW_DAYS;
    }

    const matchingPolicy = MERCHANT_RETURN_WINDOWS.find((policy) =>
        policy.merchantKeywords.some((keyword) =>
            normalizedMerchant.includes(keyword)
        )
    );

    return matchingPolicy?.returnWindowDays ?? DEFAULT_RETURN_WINDOW_DAYS;
}

export function getSuggestedReturnDeadline(
    merchant: string,
    purchaseDate: string
): string | null {
    if (!isIsoDateString(purchaseDate)) {
        return null;
    }

    const returnWindowDays = getSuggestedReturnWindowDays(merchant);
    const date = new Date(`${purchaseDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    date.setDate(date.getDate() + returnWindowDays);

    return date.toISOString().slice(0, 10);
}

function isIsoDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}