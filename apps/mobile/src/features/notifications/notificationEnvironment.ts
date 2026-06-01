import Constants from "expo-constants";

export function isRunningInExpoGo(): boolean {
    return Constants.appOwnership === "expo";
}