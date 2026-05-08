import { Stack, router } from "expo-router";
import { useState } from "react";
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
import {
    isValidDateString,
    normalizeOptionalDate,
    parsePriceToCents,
} from "@/src/features/products/formUtils";

import { createProduct } from "@/src/features/products/api";


export default function NewProductScreen() {
    const [name, setName] = useState("");
    const [merchant, setMerchant] = useState("");
    const [price, setPrice] = useState("");
    const [notes, setNotes] = useState("");

    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [purchaseDate, setPurchaseDate] = useState("");
    const [returnDeadline, setReturnDeadline] = useState("");
    const [warrantyDeadline, setWarrantyDeadline] = useState("");

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
            setSubmitErrorMessage(null);

            await createProduct({
                name: trimmedName,
                merchant: merchant.trim() || null,
                purchase_date: normalizeOptionalDate(purchaseDate),
                return_deadline: normalizeOptionalDate(returnDeadline),
                warranty_deadline: normalizeOptionalDate(warrantyDeadline),
                price_cents: priceCents,
                currency: "USD",
                notes: notes.trim() || null,
                source: "manual",
            });

            router.replace("/(tabs)/products");
        } catch (error) {
            console.error(error);
            setSubmitErrorMessage(
                "Could not save this product. Make sure the API is running and try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.select({ ios: "padding", android: undefined })}
        >
            <Stack.Screen options={{ title: "Add Product" }} />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.eyebrow}>Manual Entry</Text>
                <Text style={styles.title}>Add a product</Text>
                <Text style={styles.description}>
                    Start by saving a product manually. Receipt scanning and AI extraction
                    will build on top of this same product flow later.
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

                    {submitErrorMessage ? (
                        <Text style={styles.errorText}>{submitErrorMessage}</Text>
                    ) : null}

                    <Pressable
                        style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                        onPress={() => void handleSubmit()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Save Product</Text>
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
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#F8FAFC",
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
    disabledButton: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
});