import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";

import { getAIStatus, type AIStatusResponse } from "@/src/features/ai/api";

export default function AIStatusScreen() {
    const [status, setStatus] = useState<AIStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadStatus = useCallback(async () => {
        try {
            setErrorMessage(null);

            const data = await getAIStatus();

            setStatus(data);
        } catch (error) {
            console.error(error);
            setErrorMessage("Could not load AI status.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadStatus();
        }, [loadStatus])
    );

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadStatus();
    }, [loadStatus]);

    if (isLoading) {
        return (
            <View style={styles.centeredState}>
                <Stack.Screen options={{ title: "AI Status" }} />
                <ActivityIndicator />
                <Text style={styles.stateText}>Loading AI status...</Text>
            </View>
        );
    }

    if (errorMessage || !status) {
        return (
            <View style={styles.centeredState}>
                <Stack.Screen options={{ title: "AI Status" }} />

                <Text style={styles.errorTitle}>Unable to load AI status</Text>

                <Text style={styles.errorText}>
                    {errorMessage ?? "Unknown error"}
                </Text>

                <Pressable
                    style={styles.retryButton}
                    onPress={() => void loadStatus()}
                >
                    <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                />
            }
        >
            <Stack.Screen options={{ title: "AI Status" }} />

            <Text style={styles.eyebrow}>AI System</Text>

            <Text style={styles.title}>Receipt extraction status</Text>

            <Text style={styles.description}>
                ReturnRadar currently supports multiple receipt extraction providers.
            </Text>

            <View style={styles.card}>
                <Text style={styles.label}>Active provider</Text>

                <Text style={styles.value}>
                    {status.receipt_extractor_provider}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>OpenAI configured</Text>

                <Text style={styles.value}>
                    {status.openai_configured ? "Yes" : "No"}
                </Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Why this matters</Text>

                <Text style={styles.infoText}>
                    AI extraction runs through the backend so provider keys stay secure
                    and extraction logic can be updated without changing the mobile app.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centeredState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#64748B",
        marginBottom: 8,
    },
    value: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A",
    },
    infoCard: {
        backgroundColor: "#DBEAFE",
        borderRadius: 20,
        padding: 20,
        marginTop: 10,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1E3A8A",
        marginBottom: 8,
    },
    infoText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#1E40AF",
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
        textAlign: "center",
    },
    retryButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 18,
        marginTop: 18,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
});