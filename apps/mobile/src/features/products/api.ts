import { apiFetch } from "@/src/lib/api";

import type {
    CreateProductInput,
    Product,
    UpdateProductInput,
} from "./types";

type ListProductsParams = {
    limit?: number;
    offset?: number;
    search?: string;
};

export function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    const search = params.search?.trim();

    const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    if (search) {
        queryParams.set("search", search);
    }

    return apiFetch<Product[]>(`/products?${queryParams.toString()}`);
}

export function getProduct(productId: number): Promise<Product> {
    return apiFetch<Product>(`/products/${productId}`);
}

export function createProduct(input: CreateProductInput): Promise<Product> {
    return apiFetch<Product>("/products", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function updateProduct(
    productId: number,
    input: UpdateProductInput
): Promise<Product> {
    return apiFetch<Product>(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function deleteProduct(productId: number): Promise<void> {
    await apiFetch<void>(`/products/${productId}`, {
        method: "DELETE",
    });
}