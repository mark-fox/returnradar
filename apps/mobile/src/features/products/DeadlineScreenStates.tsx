import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type DeadlineLoadingStateProps = {
    message?: string;
};

export function DeadlineLoadingState({
    message = "Loading deadlines...",
}: DeadlineLoadingStateProps) {
    return (
        <View style={styles.centeredState}>
            <ActivityIndicator />
            <Text style={styles.stateText}>{message}</Text>
        </View>
    );
}

type DeadlineErrorStateProps = {
    message: string;
    onRetry: () => void;
};

export function DeadlineErrorState({
    message,
    onRetry,
}: DeadlineErrorStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Unable to load deadlines</Text>
                <Text style={styles.errorText}>{message}</Text>

                <Pressable style={styles.primaryButton} onPress={onRetry}>
                    <Text style={styles.primaryButtonText}>Try again</Text>
                </Pressable>
            </View>
        </View>
    );
}

type DeadlineEmptyStateProps = {
    title?: string;
    message?: string;
};

export function DeadlineEmptyState({
    title = "No deadlines found",
    message = "No return or warranty deadlines need attention right now.",
}: DeadlineEmptyStateProps) {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyText}>{message}</Text>
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
    emptyState: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
    },
});