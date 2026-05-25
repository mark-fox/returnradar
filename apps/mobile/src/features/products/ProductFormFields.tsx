import { StyleSheet, Text, TextInput } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";

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

type ProductFormInputProps = TextInputProps & {
    label: string;
    required?: boolean;
    value: string;
    onChangeText: (value: string) => void;
    keyboardType?: KeyboardTypeOptions;
    multiline?: boolean;
};

export function ProductFormInput({
    label,
    required = false,
    value,
    onChangeText,
    keyboardType,
    multiline = false,
    style,
    ...textInputProps
}: ProductFormInputProps) {
    return (
        <>
            <FieldLabel label={label} required={required} />

            <TextInput
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                multiline={multiline}
                textAlignVertical={multiline ? "top" : undefined}
                style={[
                    styles.input,
                    multiline && styles.notesInput,
                    style,
                ]}
                {...textInputProps}
            />
        </>
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
});