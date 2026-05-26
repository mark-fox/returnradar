import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

export function useNotificationNavigation() {
    useEffect(() => {
        let isMounted = true;

        const openProductFromNotificationResponse = (
            response: Notifications.NotificationResponse | null
        ) => {
            const productId =
                response?.notification.request.content.data?.productId;

            if (
                typeof productId === "number" ||
                typeof productId === "string"
            ) {
                router.push(`/products/${productId}`);
            }
        };

        const loadInitialNotificationResponse = async () => {
            const response =
                await Notifications.getLastNotificationResponseAsync();

            if (!isMounted) {
                return;
            }

            openProductFromNotificationResponse(response);
        };

        void loadInitialNotificationResponse();

        const subscription =
            Notifications.addNotificationResponseReceivedListener(
                openProductFromNotificationResponse
            );

        return () => {
            isMounted = false;
            subscription.remove();
        };
    }, []);
}