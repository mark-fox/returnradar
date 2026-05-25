import type { Product } from "./types";
import { getDaysUntilDate } from "./deadlineUtils";

export type DeadlineGroup = {
    upcomingReturns: Product[];
    expiredReturns: Product[];
    upcomingWarranties: Product[];
    expiredWarranties: Product[];
};

export type DeadlineTypeFilter = "all" | "returns" | "warranties";

export type DeadlineFilter =
    | "all"
    | "upcomingReturns"
    | "expiredReturns"
    | "upcomingWarranties"
    | "expiredWarranties";

export type DeadlineFocusSection =
    | "all"
    | "upcomingReturns"
    | "expiredReturns"
    | "upcomingWarranties"
    | "expiredWarranties";

function sortBySoonestDeadline(
    products: Product[],
    getDeadline: (product: Product) => string | null
): Product[] {
    return [...products].sort((firstProduct, secondProduct) => {
        const firstDays = getDaysUntilDate(getDeadline(firstProduct));
        const secondDays = getDaysUntilDate(getDeadline(secondProduct));

        if (firstDays === null && secondDays === null) {
            return 0;
        }

        if (firstDays === null) {
            return 1;
        }

        if (secondDays === null) {
            return -1;
        }

        return firstDays - secondDays;
    });
}

export function getDeadlineGroups(products: Product[]): DeadlineGroup {
    const upcomingReturns = products.filter((product) => {
        const daysUntilReturn = getDaysUntilDate(product.return_deadline);

        return daysUntilReturn !== null && daysUntilReturn >= 0 && daysUntilReturn <= 7;
    });

    const expiredReturns = products.filter((product) => {
        const daysUntilReturn = getDaysUntilDate(product.return_deadline);

        return daysUntilReturn !== null && daysUntilReturn < 0;
    });

    const upcomingWarranties = products.filter((product) => {
        const daysUntilWarranty = getDaysUntilDate(product.warranty_deadline);

        return (
            daysUntilWarranty !== null &&
            daysUntilWarranty >= 0 &&
            daysUntilWarranty <= 30
        );
    });

    const expiredWarranties = products.filter((product) => {
        const daysUntilWarranty = getDaysUntilDate(product.warranty_deadline);

        return daysUntilWarranty !== null && daysUntilWarranty < 0;
    });

    return {
        upcomingReturns: sortBySoonestDeadline(
            upcomingReturns,
            (product) => product.return_deadline
        ),
        expiredReturns: sortBySoonestDeadline(
            expiredReturns,
            (product) => product.return_deadline
        ),
        upcomingWarranties: sortBySoonestDeadline(
            upcomingWarranties,
            (product) => product.warranty_deadline
        ),
        expiredWarranties: sortBySoonestDeadline(
            expiredWarranties,
            (product) => product.warranty_deadline
        ),
    };
}