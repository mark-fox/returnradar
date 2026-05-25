import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type ReceiptInputCardProps = {
    rawText: string;
    selectedImageUri: string | null;
    imageUploadStatus: string | null;
    uploadedImageInfo: string | null;
    isExtracting: boolean;
    onRawTextChange: (value: string) => void;
    onCaptureReceiptImage: () => void;
    onSelectReceiptImage: () => void;
    onExtractFromText: () => void;
};

export function ReceiptInputCard({
    rawText,
    selectedImageUri,
    imageUploadStatus,
    uploadedImageInfo,
    isExtracting,
    onRawTextChange,
    onCaptureReceiptImage,
    onSelectReceiptImage,
    onExtractFromText,
}: ReceiptInputCardProps) {
    return (
        <View style={styles.formCard}>
            <Text style={styles.label}>Receipt photo</Text>

            <Pressable
                style={styles.primaryButton}
                onPress={onCaptureReceiptImage}
            >
                <Text style={styles.primaryButtonText}>
                    Capture Receipt Photo
                </Text>
            </Pressable>

            <Pressable
                style={styles.secondaryButton}
                onPress={onSelectReceiptImage}
            >
                <Text style={styles.secondaryButtonText}>
                    Select Receipt Image
                </Text>
            </Pressable>

            {selectedImageUri ? (
                <>
                    <Image
                        source={{ uri: selectedImageUri }}
                        style={styles.receiptImagePreview}
                        resizeMode="cover"
                    />

                    {imageUploadStatus ? (
                        <Text style={styles.uploadStatusText}>
                            {imageUploadStatus}
                        </Text>
                    ) : null}

                    {uploadedImageInfo ? (
                        <Text style={styles.uploadSuccessText}>
                            Uploaded: {uploadedImageInfo}
                        </Text>
                    ) : null}
                </>
            ) : (
                <Text style={styles.helperText}>
                    Image selection is ready. OCR/vision extraction will be connected next.
                </Text>
            )}

            <Text style={styles.fallbackLabel}>
                Fallback: paste receipt text
            </Text>

            <TextInput
                value={rawText}
                onChangeText={onRawTextChange}
                placeholder="Optional fallback for testing or copied receipt text..."
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.receiptInput]}
            />

            <Pressable
                style={[
                    styles.primaryButton,
                    isExtracting && styles.disabledButton,
                ]}
                onPress={onExtractFromText}
                disabled={isExtracting}
            >
                {isExtracting ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.primaryButtonText}>
                        Extract From Text
                    </Text>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 8,
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
    receiptInput: {
        minHeight: 180,
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
    secondaryButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        marginBottom: 14,
    },
    secondaryButtonText: {
        color: "#0F172A",
        fontSize: 16,
        fontWeight: "800",
    },
    receiptImagePreview: {
        width: "100%",
        height: 220,
        borderRadius: 16,
        marginBottom: 18,
        backgroundColor: "#E2E8F0",
    },
    helperText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#64748B",
        marginBottom: 18,
    },
    uploadSuccessText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#166534",
        marginBottom: 18,
    },
    uploadStatusText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1D4ED8",
        marginBottom: 12,
    },
    fallbackLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#64748B",
        marginTop: 18,
        marginBottom: 8,
        textTransform: "uppercase",
    },
});