import * as Notifications from "expo-notifications";

export type NotificationPermissionStatus =
    | "granted"
    | "denied"
    | "undetermined";

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
    const permissions = await Notifications.getPermissionsAsync();

    return permissions.status;
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
    const currentPermissions = await Notifications.getPermissionsAsync();

    if (currentPermissions.status === "granted") {
        return "granted";
    }

    const requestedPermissions = await Notifications.requestPermissionsAsync();

    return requestedPermissions.status;
}