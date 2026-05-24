import type { Product } from "./types";

export type ProductSortOption =
    | "newest"
    | "returnDeadline"
    | "warrantyDeadline"
    | "name";

export type ProductUrgency = "safe" | "soon" | "urgent" | "expired";

export type ProductUrgencyFilter =
    | "all"
    | "expired"
    | "urgent"
    | "protected";

export function formatProductPrice(product: Product): string {
    if (product.price_cents === null) {
        return "Price not set";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: product.currency,
    }).format(product.price_cents / 100);
}

export function formatProductDeadline(value: string | null): string {
    if (!value) {
        return "No deadline set";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function compareOptionalDates(
    firstDate: string | null,
    secondDate: string | null
): number {
    if (!firstDate && !secondDate) {
        return 0;
    }

    if (!firstDate) {
        return 1;
    }

    if (!secondDate) {
        return -1;
    }

    return (
        new Date(`${firstDate}T00:00:00`).getTime() -
        new Date(`${secondDate}T00:00:00`).getTime()
    );
}

export function isExpiringSoon(deadline: string | null): boolean {
    if (!deadline) {
        return false;
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();

    const differenceMs = deadlineDate.getTime() - now.getTime();
    const differenceDays = differenceMs / (1000 * 60 * 60 * 24);

    return differenceDays >= 0 && differenceDays <= 14;
}

export function getDeadlineUrgency(deadline: string | null): ProductUrgency {
    if (!deadline) {
        return "safe";
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();

    const differenceMs = deadlineDate.getTime() - now.getTime();
    const differenceDays = differenceMs / (1000 * 60 * 60 * 24);

    if (differenceDays < 0) {
        return "expired";
    }

    if (differenceDays <= 3) {
        return "urgent";
    }

    if (differenceDays <= 14) {
        return "soon";
    }

    return "safe";
}

export function getUrgencyRank(urgency: ProductUrgency): number {
    switch (urgency) {
        case "expired":
            return 0;

        case "urgent":
            return 1;

        case "soon":
            return 2;

        default:
            return 3;
    }
}

export function getProductUrgency(product: Product): ProductUrgency {
    const returnUrgency = getDeadlineUrgency(product.return_deadline);
    const warrantyUrgency = getDeadlineUrgency(product.warranty_deadline);

    if (returnUrgency === "expired" || warrantyUrgency === "expired") {
        return "expired";
    }

    if (returnUrgency === "urgent" || warrantyUrgency === "urgent") {
        return "urgent";
    }

    if (returnUrgency === "soon" || warrantyUrgency === "soon") {
        return "soon";
    }

    return "safe";
}

export function getProductUrgencyLabel(urgency: ProductUrgency): string {
    switch (urgency) {
        case "expired":
            return "Expired";

        case "urgent":
            return "Urgent";

        case "soon":
            return "Expiring Soon";

        case "safe":
            return "Protected";
    }
}

export function filterProductsByUrgency(
    products: Product[],
    urgencyFilter: ProductUrgencyFilter
): Product[] {
    return products.filter((product) => {
        const urgency = getProductUrgency(product);

        if (urgencyFilter === "expired") {
            return urgency === "expired";
        }

        if (urgencyFilter === "urgent") {
            return urgency === "urgent" || urgency === "soon";
        }

        if (urgencyFilter === "protected") {
            return urgency === "safe";
        }

        return true;
    });
}

export function sortProducts(
    products: Product[],
    sortOption: ProductSortOption
): Product[] {
    return [...products].sort((firstProduct, secondProduct) => {
        if (sortOption === "name") {
            return firstProduct.name.localeCompare(secondProduct.name);
        }

        if (sortOption === "returnDeadline") {
            return compareOptionalDates(
                firstProduct.return_deadline,
                secondProduct.return_deadline
            );
        }

        if (sortOption === "warrantyDeadline") {
            return compareOptionalDates(
                firstProduct.warranty_deadline,
                secondProduct.warranty_deadline
            );
        }

        const firstUrgency = getProductUrgency(firstProduct);
        const secondUrgency = getProductUrgency(secondProduct);

        const urgencyDifference =
            getUrgencyRank(firstUrgency) - getUrgencyRank(secondUrgency);

        if (urgencyDifference !== 0) {
            return urgencyDifference;
        }

        return (
            new Date(secondProduct.created_at).getTime() -
            new Date(firstProduct.created_at).getTime()
        );
    });
}

export function getVisibleProducts(
    products: Product[],
    sortOption: ProductSortOption,
    urgencyFilter: ProductUrgencyFilter
): Product[] {
    return sortProducts(
        filterProductsByUrgency(products, urgencyFilter),
        sortOption
    );
}