export type DeadlineStatusVariant = "missing" | "expired" | "today" | "soon" | "open";

export type DeadlineStatus = {
    label: string;
    variant: DeadlineStatusVariant;
    daysRemaining: number | null;
};

export function getDaysUntilDate(dateValue: string | null): number | null {
    if (!dateValue) {
        return null;
    }

    const today = new Date();
    const targetDate = new Date(`${dateValue}T00:00:00`);

    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return Math.ceil(
        (targetDate.getTime() - today.getTime()) / millisecondsPerDay
    );
}

export function getReturnDeadlineStatus(
    returnDeadline: string | null
): DeadlineStatus {
    const daysRemaining = getDaysUntilDate(returnDeadline);

    if (daysRemaining === null) {
        return {
            label: "No return deadline",
            variant: "missing",
            daysRemaining,
        };
    }

    if (daysRemaining < 0) {
        return {
            label: "Return expired",
            variant: "expired",
            daysRemaining,
        };
    }

    if (daysRemaining === 0) {
        return {
            label: "Return ends today",
            variant: "today",
            daysRemaining,
        };
    }

    if (daysRemaining <= 7) {
        return {
            label: `${daysRemaining} days left`,
            variant: "soon",
            daysRemaining,
        };
    }

    return {
        label: "Return open",
        variant: "open",
        daysRemaining,
    };
}

export function getWarrantyDeadlineStatus(
    warrantyDeadline: string | null
): DeadlineStatus {
    const daysRemaining = getDaysUntilDate(warrantyDeadline);

    if (daysRemaining === null) {
        return {
            label: "No warranty deadline",
            variant: "missing",
            daysRemaining,
        };
    }

    if (daysRemaining < 0) {
        return {
            label: "Warranty expired",
            variant: "expired",
            daysRemaining,
        };
    }

    if (daysRemaining === 0) {
        return {
            label: "Warranty ends today",
            variant: "today",
            daysRemaining,
        };
    }

    if (daysRemaining <= 30) {
        return {
            label: `${daysRemaining} days left`,
            variant: "soon",
            daysRemaining,
        };
    }

    return {
        label: "Warranty active",
        variant: "open",
        daysRemaining,
    };
}