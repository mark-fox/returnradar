import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type DetailSectionProps = {
    title?: string;
    children: ReactNode;
};

export function DetailSection({ title, children }: DetailSectionProps) {
    return (
        <View style={styles.card}>
            {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 10,
    },
});