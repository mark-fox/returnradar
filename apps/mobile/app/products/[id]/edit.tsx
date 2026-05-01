import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { getProduct, updateProduct } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";

function centsToPriceInput(value: number | null): string {
    if (value === null) {
        return "";
    }

    return (value / 100).toFixed(2);
}

function parsePriceToCents(value: string): number | null {
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

function isValidDateString(value: string): boolean {
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

function normalizeOptionalDate(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue ? trimmedValue : null;
}

export default function EditProductScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const productId = Number(params.id);

    const [product, setProduct] = useState<Product | null>(null);

    const [name, setName] = useState("");
    const [merchant, setMerchant] = useState("");
    const [price, setPrice] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [returnDeadline, setReturnDeadline] = useState("");
    const [warrantyDeadline, setWarrantyDeadline] = useState("");
    const [notes, setNotes] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadProduct = useCallback(async () => {
        try {
            setErrorMessage(null);

            if (!Number.isFinite(productId)) {
                throw new Error("Invalid product id");
            }

            const data = await getProduct(productId);
            setProduct(data);

            setName(data.name);
            setMerchant(data.merchant ?? "");
            setPrice(centsToPriceInput(data.price_cents));
            setPurchaseDate(data.purchase_date ?? "");
            setReturnDeadline(data.return_deadline ?? "");
            setWarrantyDeadline(data.warranty_deadline ?? "");
            setNotes(data.notes ?? "");
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not load this product.");
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        void loadProduct();
    }, [loadProduct]);

    const handleSubmit = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setValidationMessage("Product name is required.");
            return;
        }

        const priceCents = parsePriceToCents(price);

        if (price.trim() && priceCents === null) {
            setValidationMessage("Enter a valid price, like 19.99.");
            return;
        }

        const dateFields = [
            { label: "purchase date", value: purchaseDate },
            { label: "return deadline", value: returnDeadline },
            { label: "warranty deadline", value: warrantyDeadline },
        ];

        const invalidDateField = dateFields.find(
            (field) => !isValidDateString(field.value)
        );

        if (invalidDateField) {
            setValidationMessage(
                `Enter a valid ${invalidDateField.label} using YYYY-MM-DD.`
            );
            return;
        }

        try {
            setIsSubmitting(true);
            setValidationMessage(null);
            setErrorMessage(null);

            await updateProduct(productId, {
                name: trimmedName,
                merchant: merchant.trim() || null,
                purchase_date: normalizeOptionalDate(purchaseDate),
                return_deadline: normalizeOptionalDate(returnDeadline),
                warranty_deadline: normalizeOptionalDate(warrantyDeadline),
                price_cents: priceCents,
                currency: product?.currency ?? "USD",
                notes: notes.trim() || null,
            });

            router.back();
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not save changes. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centeredState}>
                <Stack.Screen options={{ title: "Edit Product" }} />
                <ActivityIndicator />
                <Text style={styles.stateText}>Loading product...</Text>
            </View>
        );
    }

    if (errorMessage && !product) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: "Edit Product" }} />

                <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Unable to load product</Text>
                    <Text style={styles.errorText}>{errorMessage}</Text>

                    <Pressable style={styles.primaryButton} onPress={() => void loadProduct()}>
                        <Text style={styles.primaryButtonText}>Try again</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.select({ ios: "padding", android: undefined })}
        >
            <Stack.Screen options={{ title: "Edit Product" }} />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.eyebrow}>Edit Product</Text>
                <Text style={styles.title}>Update product details</Text>
                <Text style={styles.description}>
                    Keep return dates, warranty dates, and purchase details accurate.
                </Text>

                <View style={styles.formCard}>
                    <FieldLabel label="Product name" required />
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Sony WH-1000XM5 Headphones"
                        autoCapitalize="words"
                        style={styles.input}
                    />

                    <FieldLabel label="Merchant" />
                    <TextInput
                        value={merchant}
                        onChangeText={setMerchant}
                        placeholder="Best Buy"
                        autoCapitalize="words"
                        style={styles.input}
                    />

                    <FieldLabel label="Price" />
                    <TextInput
                        value={price}
                        onChangeText={setPrice}
                        placeholder="399.99"
                        keyboardType="decimal-pad"
                        style={styles.input}
                    />

                    <FieldLabel label="Purchase date" />
                    <TextInput
                        value={purchaseDate}
                        onChangeText={setPurchaseDate}
                        placeholder="2026-04-28"
                        keyboardType="numbers-and-punctuation"
                        style={styles.input}
                    />

                    <FieldLabel label="Return deadline" />
                    <TextInput
                        value={returnDeadline}
                        onChangeText={setReturnDeadline}
                        placeholder="2026-05-28"
                        keyboardType="numbers-and-punctuation"
                        style={styles.input}
                    />

                    <FieldLabel label="Warranty deadline" />
                    <TextInput
                        value={warrantyDeadline}
                        onChangeText={setWarrantyDeadline}
                        placeholder="2027-04-28"
                        keyboardType="numbers-and-punctuation"
                        style={styles.input}
                    />

                    <FieldLabel label="Notes" />
                    <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Warranty card is in the box."
                        multiline
                        textAlignVertical="top"
                        style={[styles.input, styles.notesInput]}
                    />

                    {validationMessage ? (
                        <Text style={styles.validationText}>{validationMessage}</Text>
                    ) : null}

                    {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                    <Pressable
                        style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                        onPress={() => void handleSubmit()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Save Changes</Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
    return (
        <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
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
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: "#475569",
        marginBottom: 24,
    },
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 8,
    },
    required: {
        color: "#DC2626",
    },
    input: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: "#0F172A",
        backgroundColor: "#FFFFFF",
        marginBottom: 16,
    },
    notesInput: {
        minHeight: 110,
    },
    validationText: {
        color: "#B45309",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
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
        color: "#B91C1C",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    disabledButton: {
        opacity: 0.7,
    },
});