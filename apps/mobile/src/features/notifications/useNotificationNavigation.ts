import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

export function useNotificationNavigation() {
    useEffect(() => {
        const subscription =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    const productId =
                        response.notification.request.content.data?.productId;

                    if (
                        typeof productId === "number" ||
                        typeof productId === "string"
                    ) {
                        router.push(`/products/${productId}`);
                    }
                }
            );

        return () => {
            subscription.remove();
        };
    }, []);
}