import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    getStoredDemoAccessKey,
    saveDemoAccessKey,
} from "./demoAccessStorage";

type DemoAccessGateProps = {
    children: React.ReactNode;
};

export function DemoAccessGate({ children }: DemoAccessGateProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [storedAccessKey, setStoredAccessKey] = useState<string | null>(null);
    const [accessKeyInput, setAccessKeyInput] = useState("");

    useEffect(() => {
        const loadAccessKey = async () => {
            const accessKey = await getStoredDemoAccessKey();

            setStoredAccessKey(accessKey);
            setIsLoading(false);
        };

        void loadAccessKey();
    }, []);

    const handleSaveAccessKey = async () => {
        const trimmedKey = accessKeyInput.trim();

        if (!trimmedKey) {
            return;
        }

        await saveDemoAccessKey(trimmedKey);
        setStoredAccessKey(trimmedKey);
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading ReturnRadar...</Text>
            </View>
        );
    }

    if (!storedAccessKey) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.eyebrow}>ReturnRadar Demo</Text>

                    <Text style={styles.title}>
                        Enter demo access code
                    </Text>

                    <Text style={styles.description}>
                        This portfolio demo is protected to prevent automated
                        abuse of hosted AI and upload resources.
                    </Text>

                    <TextInput
                        value={accessKeyInput}
                        onChangeText={setAccessKeyInput}
                        placeholder="Demo access code"
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry
                        style={styles.input}
                    />

                    <Pressable
                        style={[
                            styles.button,
                            !accessKeyInput.trim() && styles.disabledButton,
                        ]}
                        onPress={() => void handleSaveAccessKey()}
                        disabled={!accessKeyInput.trim()}
                    >
                        <Text style={styles.buttonText}>
                            Continue
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        padding: 24,
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: "#475569",
        textAlign: "center",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: "#CBD5E1",
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: "800",
        color: "#2563EB",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: "#475569",
        marginBottom: 18,
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
    button: {
        backgroundColor: "#2563EB",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    disabledButton: {
        opacity: 0.6,
    },
});