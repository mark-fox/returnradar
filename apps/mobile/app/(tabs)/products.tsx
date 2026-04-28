import { StyleSheet, Text, View } from "react-native";

export default function ProductsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.eyebrow}>Products</Text>

            <Text style={styles.title}>Your tracked items will appear here.</Text>

            <Text style={styles.description}>
                Soon this screen will show saved purchases, return deadlines, warranty
                dates, and product details from the ReturnRadar API.
            </Text>

            <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No products yet</Text>
                <Text style={styles.emptyText}>
                    Add your first product manually before we add receipt scanning and AI
                    extraction.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#F8FAFC",
    },
    eyebrow: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2563EB",
        marginBottom: 12,
    },
    title: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 14,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: "#475569",
        marginBottom: 28,
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
});