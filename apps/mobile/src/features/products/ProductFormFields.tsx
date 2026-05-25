import { StyleSheet, Text } from "react-native";

type FieldLabelProps = {
    label: string;
    required?: boolean;
};

export function FieldLabel({ label, required = false }: FieldLabelProps) {
    return (
        <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 8,
    },
    required: {
        color: "#DC2626",
    },
});