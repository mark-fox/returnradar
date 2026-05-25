export function formatDeadlineDate(value: string | null): string {
    if (!value) {
        return "Not set";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function formatRemainingTime(daysRemaining: number | null): string {
    if (daysRemaining === null) {
        return "No deadline";
    }

    if (daysRemaining === 0) {
        return "Ends today";
    }

    if (daysRemaining > 0) {
        return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;
    }

    const expiredDays = Math.abs(daysRemaining);

    return `Expired ${expiredDays} day${expiredDays === 1 ? "" : "s"} ago`;
}

export function formatLastUpdated(date: Date | null): string {
    if (!date) {
        return "Never";
    }

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}