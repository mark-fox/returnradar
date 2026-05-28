import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Image,
    Linking,
} from "react-native";
import ImageViewing from "react-native-image-viewing";

import { getProduct, archiveProduct } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import {
    getDaysUntilDate,
    getReturnDeadlineStatus,
    getWarrantyDeadlineStatus,
} from "@/src/features/products/deadlineUtils";
import { DeadlineStatusPill } from "@/src/features/products/DeadlineStatusPill";
import { getProductSourceLabel } from "@/src/features/products/sourceUtils";
import {
    formatProductDeadline,
    formatProductPrice,
} from "@/src/features/products/productListUtils";
import { DetailRow } from "@/src/features/products/DetailRow";
import { DetailSection } from "@/src/features/products/DetailSection";
import { buildUploadedFileUrl } from "@/src/lib/apiUrls";


function formatDaysRemaining(
    daysRemaining: number | null,
    deadlineLabel: "return" | "warranty"
): string {
    if (daysRemaining === null) {
        return `No ${deadlineLabel} deadline set`;
    }

    if (daysRemaining < 0) {
        const expiredDays = Math.abs(daysRemaining);
        return `Expired ${expiredDays} day${expiredDays === 1 ? "" : "s"} ago`;
    }

    if (daysRemaining === 0) {
        return `${deadlineLabel === "return" ? "Return" : "Warranty"} ends today`;
    }

    return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;
}

export default function ProductDetailScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const productId = Number(params.id);

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isReceiptViewerVisible, setIsReceiptViewerVisible] = useState(false);
    const [receiptImageFailedToLoad, setReceiptImageFailedToLoad] = useState(false);

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

    useEffect(() => {
        setReceiptImageFailedToLoad(false);
    }, [product?.receipt_image_path]);

    const handleDelete = async () => {
        if (!Number.isFinite(productId)) {
            return;
        }

        try {
            setIsDeleting(true);
            await archiveProduct(productId);
            router.replace("/(tabs)/products");
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not archive this product. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDelete = () => {
        Alert.alert(
            "Archive product?",
            "This will hide the product from active dashboards and product lists. It will not be permanently deleted.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Archive",
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
    const warrantyDaysRemaining = getDaysUntilDate(product.warranty_deadline);
    const returnDaysRemaining = getDaysUntilDate(product.return_deadline);
    const receiptImageUrl = buildUploadedFileUrl(product.receipt_image_path);

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

            <DetailSection>
                <DetailRow label="Merchant" value={product.merchant ?? "Not set"} />
                <DetailRow label="Source" value={getProductSourceLabel(product.source)} />
                <DetailRow
                    label="AI Provider"
                    value={product.ai_provider ?? "Manual entry"}
                />

                <DetailRow
                    label="AI Confidence"
                    value={
                        product.ai_confidence !== null
                            ? `${product.ai_confidence}%`
                            : "N/A"
                    }
                />
                <DetailRow label="Price" value={formatProductPrice(product)} />
                <DetailRow
                    label="Purchase date"
                    value={formatProductDeadline(product.purchase_date)}
                />
                <DetailRow label="Currency" value={product.currency} />
            </DetailSection>

            {receiptImageUrl ? (
                <DetailSection title="Receipt Image">
                    {receiptImageFailedToLoad ? (
                        <View style={styles.receiptImageFallback}>
                            <Text style={styles.receiptImageFallbackTitle}>
                                Receipt image unavailable
                            </Text>

                            <Text style={styles.receiptImageFallbackText}>
                                The receipt image path is saved, but the image could not be loaded.
                            </Text>
                        </View>
                    ) : (
                        <Pressable onPress={() => setIsReceiptViewerVisible(true)}>
                            <Image
                                source={{ uri: receiptImageUrl }}
                                style={styles.receiptImage}
                                resizeMode="cover"
                                onError={() => setReceiptImageFailedToLoad(true)}
                            />
                        </Pressable>
                    )}
                </DetailSection>
            ) : null}

            <DetailSection title="Return Window">
                <DetailRow
                    label="Deadline"
                    value={formatProductDeadline(product.return_deadline)}
                />

                <DeadlineStatusPill status={returnStatus} />

                <DetailRow
                    label="Time remaining"
                    value={formatDaysRemaining(returnDaysRemaining, "return")}
                />
            </DetailSection>

            <DetailSection title="Warranty Protection">
                <DetailRow
                    label="Deadline"
                    value={formatProductDeadline(product.warranty_deadline)}
                />

                <DeadlineStatusPill status={warrantyStatus} />

                <DetailRow
                    label="Time remaining"
                    value={formatDaysRemaining(warrantyDaysRemaining, "warranty")}
                />

                {product.warranty_provider ? (
                    <DetailRow label="Provider" value={product.warranty_provider} />
                ) : null}

                {product.warranty_claim_url ? (
                    <Pressable
                        style={styles.claimLinkCard}
                        onPress={() => Linking.openURL(product.warranty_claim_url!)}
                    >
                        <Text style={styles.claimLinkLabel}>Claim Website</Text>
                        <Text style={styles.claimLinkText}>
                            Open warranty claim page
                        </Text>
                    </Pressable>
                ) : null}

                {product.warranty_claim_url ? (
                    <Pressable
                        style={styles.claimWarrantyButton}
                        onPress={() => Linking.openURL(product.warranty_claim_url!)}
                    >
                        <Text style={styles.claimWarrantyButtonText}>
                            Claim Warranty
                        </Text>
                    </Pressable>
                ) : null}

                {product.warranty_notes ? (
                    <DetailRow label="Warranty Notes" value={product.warranty_notes} />
                ) : null}
            </DetailSection>

            <DetailSection title="Notes">
                <Text style={styles.notes}>{product.notes ?? "No notes added."}</Text>
            </DetailSection>
            <Pressable
                style={[styles.deleteButton, isDeleting && styles.disabledButton]}
                onPress={confirmDelete}
                disabled={isDeleting}
            >
                {isDeleting ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.deleteButtonText}>Archive Product</Text>
                )}
            </Pressable>
            {receiptImageUrl ? (
                <ImageViewing
                    images={[{ uri: receiptImageUrl }]}
                    imageIndex={0}
                    visible={isReceiptViewerVisible}
                    onRequestClose={() => setIsReceiptViewerVisible(false)}
                />
            ) : null}
        </ScrollView>
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
    receiptImage: {
        width: "100%",
        height: 260,
        borderRadius: 18,
        backgroundColor: "#E2E8F0",
    },
    claimLinkCard: {
        backgroundColor: "#DBEAFE",
        borderRadius: 14,
        padding: 14,
        marginTop: 10,
    },
    claimLinkLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#1E3A8A",
        marginBottom: 4,
    },
    claimLinkText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2563EB",
    },
    claimWarrantyButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 14,
    },
    claimWarrantyButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    receiptImageFallback: {
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#CBD5E1",
    },
    receiptImageFallbackTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 6,
    },
    receiptImageFallbackText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#64748B",
    },
});