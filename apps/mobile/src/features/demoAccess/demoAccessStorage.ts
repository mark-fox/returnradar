import AsyncStorage from "@react-native-async-storage/async-storage";

const DEMO_ACCESS_KEY_STORAGE_KEY = "returnradar-demo-access-key";

export async function getStoredDemoAccessKey(): Promise<string | null> {
    return AsyncStorage.getItem(DEMO_ACCESS_KEY_STORAGE_KEY);
}

export async function saveDemoAccessKey(accessKey: string): Promise<void> {
    await AsyncStorage.setItem(
        DEMO_ACCESS_KEY_STORAGE_KEY,
        accessKey.trim()
    );
}

export async function clearDemoAccessKey(): Promise<void> {
    await AsyncStorage.removeItem(DEMO_ACCESS_KEY_STORAGE_KEY);
}