import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { deleteProduct, getProduct } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import {
    getReturnDeadlineStatus,
    getWarrantyDeadlineStatus,
} from "@/src/features/products/deadlineUtils";
import { DeadlineStatusPill } from "@/src/features/products/DeadlineStatusPill";
import { getProductSourceLabel } from "@/src/features/products/sourceUtils";

function formatDate(value: string | null): string {
    if (!value) {
        return "Not set";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function formatPrice(product: Product): string {
    if (product.price_cents === null) {
        return "Not set";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: product.currency,
    }).format(product.price_cents / 100);
}

export default function ProductDetailScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const productId = Number(params.id);

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadProduct = useCallback(async () => {
        try {
            setErrorMessage(null);

            if (!Number.isFinite(productId)) {
                throw new Error("Invalid product id");
            }

            const data = await getProduct(productId);
            setProduct(data);
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not load this product.");
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            void loadProduct();
        }, [loadProduct])
    );

    const handleDelete = async () => {
        if (!Number.isFinite(productId)) {
            return;
        }

        try {
            setIsDeleting(true);
            await deleteProduct(productId);
            router.replace("/(tabs)/products");
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not delete this product. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDelete = () => {
        Alert.alert(
            "Delete product?",
            "This will remove the product from ReturnRadar. This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => void handleDelete(),
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centeredState}>
                <ActivityIndicator />
                <Text style={styles.stateText}>Loading product...</Text>
            </View>
        );
    }

    if (errorMessage || !product) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: "Product" }} />

                <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Unable to load product</Text>
                    <Text style={styles.errorText}>
                        {errorMessage ?? "This product could not be found."}
                    </Text>

                    <Pressable style={styles.primaryButton} onPress={() => void loadProduct()}>
                        <Text style={styles.primaryButtonText}>Try again</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    const returnStatus = getReturnDeadlineStatus(product.return_deadline);
    const warrantyStatus = getWarrantyDeadlineStatus(product.warranty_deadline);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Stack.Screen options={{ title: product.name }} />

            <Text style={styles.eyebrow}>Product Details</Text>
            <Text style={styles.title}>{product.name}</Text>

            <Pressable
                style={styles.editButton}
                onPress={() => router.push(`/products/${product.id}/edit`)}
            >
                <Text style={styles.editButtonText}>Edit Product</Text>
            </Pressable>

            <View style={styles.card}>
                <DetailRow label="Merchant" value={product.merchant ?? "Not set"} />
                <DetailRow label="Source" value={getProductSourceLabel(product.source)} />
                <DetailRow label="Price" value={formatPrice(product)} />
                <DetailRow label="Purchase date" value={formatDate(product.purchase_date)} />
                <DetailRow label="Return deadline" value={formatDate(product.return_deadline)} />

                <DeadlineStatusPill status={returnStatus} />

                <DetailRow
                    label="Warranty deadline"
                    value={formatDate(product.warranty_deadline)}
                />

                <DeadlineStatusPill status={warrantyStatus} />

                <DetailRow label="Currency" value={product.currency} />
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notes}>{product.notes ?? "No notes added."}</Text>
            </View>
            <Pressable
                style={[styles.deleteButton, isDeleting && styles.disabledButton]}
                onPress={confirmDelete}
                disabled={isDeleting}
            >
                {isDeleting ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.deleteButtonText}>Delete Product</Text>
                )}
            </Pressable>
        </ScrollView>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centeredState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        padding: 24,
    },
    stateText: {
        marginTop: 12,
        fontSize: 16,
        color: "#475569",
    },
    container: {
        flexGrow: 1,
        backgroundColor: "#F8FAFC",
        padding: 24,
    },
    eyebrow: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2563EB",
        marginBottom: 8,
    },
    title: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 24,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    detailRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748B",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    detailValue: {
        fontSize: 16,
        color: "#0F172A",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    notes: {
        fontSize: 16,
        lineHeight: 24,
        color: "#475569",
    },
    errorCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#991B1B",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#7F1D1D",
        marginBottom: 18,
    },
    primaryButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    deleteButton: {
        backgroundColor: "#DC2626",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        marginTop: 4,
        marginBottom: 20,
    },
    deleteButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    disabledButton: {
        opacity: 0.7,
    },
    editButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 13,
        paddingHorizontal: 16,
        alignItems: "center",
        marginBottom: 18,
    },
    editButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
});