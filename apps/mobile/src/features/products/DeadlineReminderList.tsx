import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DeadlineReminder } from "./types";

type DeadlineReminderListProps = {
    reminders: DeadlineReminder[];
    onReminderPress: (productId: number) => void;
};

export function DeadlineReminderList({
    reminders,
    onReminderPress,
}: DeadlineReminderListProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming reminders</Text>

            {reminders.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardText}>
                        Return and warranty reminders will appear here when deadlines are close.
                    </Text>
                </View>
            ) : (
                reminders.map((reminder) => (
                    <Pressable
                        key={`${reminder.product_id}-${reminder.deadline_type}`}
                        style={styles.reminderCard}
                        onPress={() => onReminderPress(reminder.product_id)}
                    >
                        <Text style={styles.reminderTitle}>
                            {getReminderTitle(reminder)}
                        </Text>

                        <Text style={styles.reminderProductName}>
                            {reminder.product_name}
                        </Text>

                        <Text style={styles.reminderMeta}>
                            {getReminderMeta(reminder)}
                        </Text>
                    </Pressable>
                ))
            )}
        </View>
    );
}

function getReminderTitle(reminder: DeadlineReminder): string {
    const deadlineLabel =
        reminder.deadline_type === "return" ? "Return" : "Warranty";

    if (reminder.status === "expired") {
        return `${deadlineLabel} expired`;
    }

    if (reminder.status === "today") {
        return `${deadlineLabel} ends today`;
    }

    return `${deadlineLabel} due soon`;
}

function getReminderMeta(reminder: DeadlineReminder): string {
    if (reminder.status === "expired") {
        const expiredDays = Math.abs(reminder.days_remaining);

        return `Expired ${expiredDays} day${expiredDays === 1 ? "" : "s"} ago`;
    }

    if (reminder.days_remaining === 0) {
        return "Due today";
    }

    return `${reminder.days_remaining} day${reminder.days_remaining === 1 ? "" : "s"
        } remaining`;
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 14,
    },
    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    emptyCardText: {
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
    },
    reminderCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#FCD34D",
    },
    reminderTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: "#92400E",
        marginBottom: 6,
        textTransform: "uppercase",
    },
    reminderProductName: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 4,
    },
    reminderMeta: {
        fontSize: 14,
        color: "#64748B",
    },
});