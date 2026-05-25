import { StyleSheet, Text, View } from "react-native";

type DetailRowProps = {
    label: string;
    value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#475569",
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        color: "#0F172A",
        textAlign: "right",
    },
});