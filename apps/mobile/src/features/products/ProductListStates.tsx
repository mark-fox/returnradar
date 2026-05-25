import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type ProductLoadingStateProps = {
    message?: string;
};

export function ProductLoadingState({
    message = "Loading products...",
}: ProductLoadingStateProps) {
    return (
        <View style={styles.centeredState}>
            <ActivityIndicator />
            <Text style={styles.stateText}>{message}</Text>
        </View>
    );
}

type ProductErrorStateProps = {
    message: string;
    onRetry: () => void;
};

export function ProductErrorState({
    message,
    onRetry,
}: ProductErrorStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Unable to load products</Text>
                <Text style={styles.errorText}>{message}</Text>

                <Pressable style={styles.primaryButton} onPress={onRetry}>
                    <Text style={styles.primaryButtonText}>Try again</Text>
                </Pressable>
            </View>
        </View>
    );
}

type ProductEmptyStateProps = {
    isSearching: boolean;
};

export function ProductEmptyState({ isSearching }: ProductEmptyStateProps) {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
                {isSearching ? "No matching products" : "No products yet"}
            </Text>

            <Text style={styles.emptyText}>
                {isSearching
                    ? "Try a different search term or clear the search box."
                    : "Add your first product manually or save one from the receipt extraction flow."}
            </Text>
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
        flex: 1,
        backgroundColor: "#F8FAFC",
        padding: 24,
    },
    emptyState: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
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
        fontWeight: "800",
    },
});