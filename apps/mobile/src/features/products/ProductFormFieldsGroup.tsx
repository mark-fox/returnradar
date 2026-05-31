import { ProductFormInput } from "./ProductFormFields";
import { Pressable, StyleSheet, Text } from "react-native";
import { getSuggestedReturnDeadline } from "./returnPolicySuggestions";

type ProductFormFieldsGroupProps = {
    name: string;
    merchant: string;
    price: string;
    purchaseDate: string;
    returnDeadline: string;
    warrantyDeadline: string;
    warrantyProvider: string;
    warrantyClaimUrl: string;
    warrantyNotes: string;
    modelNumber: string;
    serialNumber: string;
    manualUrl: string;
    supportUrl: string;
    supportPhone: string;
    notes: string;
    setName: (value: string) => void;
    setMerchant: (value: string) => void;
    setPrice: (value: string) => void;
    setPurchaseDate: (value: string) => void;
    setReturnDeadline: (value: string) => void;
    setWarrantyDeadline: (value: string) => void;
    setWarrantyProvider: (value: string) => void;
    setWarrantyClaimUrl: (value: string) => void;
    setWarrantyNotes: (value: string) => void;
    setModelNumber: (value: string) => void;
    setSerialNumber: (value: string) => void;
    setManualUrl: (value: string) => void;
    setSupportUrl: (value: string) => void;
    setSupportPhone: (value: string) => void;
    setNotes: (value: string) => void;
};

export function ProductFormFieldsGroup({
    name,
    merchant,
    price,
    purchaseDate,
    returnDeadline,
    warrantyDeadline,
    warrantyProvider,
    warrantyClaimUrl,
    warrantyNotes,
    modelNumber,
    serialNumber,
    manualUrl,
    supportUrl,
    supportPhone,
    notes,
    setName,
    setMerchant,
    setPrice,
    setPurchaseDate,
    setReturnDeadline,
    setWarrantyDeadline,
    setWarrantyProvider,
    setWarrantyClaimUrl,
    setWarrantyNotes,
    setModelNumber,
    setSerialNumber,
    setManualUrl,
    setSupportUrl,
    setSupportPhone,
    setNotes,
}: ProductFormFieldsGroupProps) {

    const suggestedReturnDeadline = getSuggestedReturnDeadline(
        merchant,
        purchaseDate
    );

    const handleSuggestReturnDeadline = () => {
        if (!suggestedReturnDeadline) {
            return;
        }

        setReturnDeadline(suggestedReturnDeadline);
    };

    return (
        <>
            <ProductFormInput
                label="Product name"
                required
                value={name}
                onChangeText={setName}
                placeholder="Sony WH-1000XM5 Headphones"
                autoCapitalize="words"
            />

            <ProductFormInput
                label="Merchant"
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Best Buy"
                autoCapitalize="words"
            />

            <ProductFormInput
                label="Price"
                value={price}
                onChangeText={setPrice}
                placeholder="399.99"
                keyboardType="decimal-pad"
            />

            <ProductFormInput
                label="Purchase date"
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="2026-04-28"
                keyboardType="numbers-and-punctuation"
            />

            <ProductFormInput
                label="Return deadline"
                value={returnDeadline}
                onChangeText={setReturnDeadline}
                placeholder="2026-05-28"
                keyboardType="numbers-and-punctuation"
            />

            {suggestedReturnDeadline ? (
                <Pressable
                    style={styles.suggestionButton}
                    onPress={handleSuggestReturnDeadline}
                >
                    <Text style={styles.suggestionButtonText}>
                        Suggest return deadline: {suggestedReturnDeadline}
                    </Text>
                </Pressable>
            ) : (
                <Text style={styles.suggestionHelperText}>
                    Add a merchant and purchase date to suggest a return deadline.
                </Text>
            )}

            <ProductFormInput
                label="Warranty deadline"
                value={warrantyDeadline}
                onChangeText={setWarrantyDeadline}
                placeholder="2027-04-28"
                keyboardType="numbers-and-punctuation"
            />

            <ProductFormInput
                label="Warranty Provider"
                value={warrantyProvider}
                onChangeText={setWarrantyProvider}
                placeholder="Best Buy Geek Squad"
            />

            <ProductFormInput
                label="Warranty Claim URL"
                value={warrantyClaimUrl}
                onChangeText={setWarrantyClaimUrl}
                placeholder="https://..."
                autoCapitalize="none"
            />

            <ProductFormInput
                label="Warranty Notes"
                value={warrantyNotes}
                onChangeText={setWarrantyNotes}
                placeholder="Claim instructions, serial number requirements, etc."
                multiline
            />

            <ProductFormInput
                label="Model number"
                value={modelNumber}
                onChangeText={setModelNumber}
                placeholder="WH-1000XM5"
                autoCapitalize="characters"
            />

            <ProductFormInput
                label="Serial number"
                value={serialNumber}
                onChangeText={setSerialNumber}
                placeholder="SN123456789"
                autoCapitalize="characters"
            />

            <ProductFormInput
                label="Manual URL"
                value={manualUrl}
                onChangeText={setManualUrl}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
            />

            <ProductFormInput
                label="Support URL"
                value={supportUrl}
                onChangeText={setSupportUrl}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
            />

            <ProductFormInput
                label="Support phone"
                value={supportPhone}
                onChangeText={setSupportPhone}
                placeholder="1-800-555-1234"
                keyboardType="phone-pad"
            />

            <ProductFormInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Warranty card is in the box."
                multiline
            />
        </>
    );
}

const styles = StyleSheet.create({
    suggestionButton: {
        backgroundColor: "#EFF6FF",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        marginTop: -8,
        marginBottom: 16,
    },
    suggestionButtonText: {
        color: "#1D4ED8",
        fontSize: 13,
        fontWeight: "800",
    },
    suggestionHelperText: {
        color: "#64748B",
        fontSize: 13,
        lineHeight: 18,
        marginTop: -8,
        marginBottom: 16,
    },
});