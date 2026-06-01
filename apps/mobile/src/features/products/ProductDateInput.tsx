import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

type ProductDateInputProps = {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
};

export function ProductDateInput({
    label,
    value,
    onChangeText,
    placeholder = "YYYY-MM-DD",
}: ProductDateInputProps) {
    const [isPickerVisible, setIsPickerVisible] = useState(false);

    const pickerDate = parseDateInput(value) ?? new Date();

    const handleDateChange = (
        event: DateTimePickerEvent,
        selectedDate?: Date
    ) => {
        if (Platform.OS === "android") {
            setIsPickerVisible(false);
        }

        if (event.type === "dismissed" || !selectedDate) {
            return;
        }

        onChangeText(formatDateInput(selectedDate));
    };

    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.row}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    keyboardType="numbers-and-punctuation"
                    style={styles.input}
                />

                <Pressable
                    style={styles.calendarButton}
                    onPress={() => setIsPickerVisible(true)}
                >
                    <Text style={styles.calendarButtonText}>
                        Calendar
                    </Text>
                </Pressable>
            </View>

            {isPickerVisible ? (
                <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                />
            ) : null}

            {Platform.OS === "ios" && isPickerVisible ? (
                <Pressable
                    style={styles.doneButton}
                    onPress={() => setIsPickerVisible(false)}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

function parseDateInput(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        return null;
    }

    const parsedDate = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
}

function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
    fieldGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: "#0F172A",
        backgroundColor: "#FFFFFF",
    },
    calendarButton: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        alignItems: "center",
        marginLeft: 10,
    },
    calendarButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },
    doneButton: {
        alignSelf: "flex-end",
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    doneButtonText: {
        color: "#2563EB",
        fontSize: 14,
        fontWeight: "800",
    },
});