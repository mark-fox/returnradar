import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  listDeadlineReminders,
  listProducts,
} from "@/src/features/products/api";
import type {
  DeadlineReminder,
  Product,
} from "@/src/features/products/types";
import { getDaysUntilDate } from "@/src/features/products/deadlineUtils";


export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deadlineReminders, setDeadlineReminders] = useState<DeadlineReminder[]>([]);

  const loadProducts = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [productData, reminderData] = await Promise.all([
        listProducts({
          limit: 50,
          offset: 0,
        }),
        listDeadlineReminders(),
      ]);

      setProducts(productData);
      setDeadlineReminders(reminderData);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      void loadProducts();
    }, [loadProducts])
  );

  const dashboardStats = useMemo(() => {
    let upcomingReturns = 0;
    let expiredReturns = 0;
    let upcomingWarranties = 0;
    let expiredWarranties = 0;

    for (const product of products) {
      const daysUntilReturn = getDaysUntilDate(product.return_deadline);
      const daysUntilWarranty = getDaysUntilDate(product.warranty_deadline);

      if (daysUntilReturn !== null && daysUntilReturn < 0) {
        expiredReturns += 1;
      } else if (daysUntilReturn !== null && daysUntilReturn <= 7) {
        upcomingReturns += 1;
      }

      if (daysUntilWarranty !== null && daysUntilWarranty < 0) {
        expiredWarranties += 1;
      } else if (daysUntilWarranty !== null && daysUntilWarranty <= 30) {
        upcomingWarranties += 1;
      }
    }

    return {
      totalProducts: products.length,
      upcomingReturns,
      expiredReturns,
      upcomingWarranties,
      expiredWarranties,
    };
  }, [products]);

  const recentProducts = useMemo(() => {
    return products.slice(0, 5);
  }, [products]);


  const topDeadlineReminders = useMemo(() => {
    return deadlineReminders.slice(0, 4);
  }, [deadlineReminders]);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>ReturnRadar</Text>

      <Text style={styles.title}>
        Track purchases, returns, and warranties.
      </Text>

      <Text style={styles.description}>
        Keep return windows and warranty deadlines visible before they become
        expensive surprises.
      </Text>

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator />
          <Text style={styles.stateText}>Loading dashboard...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Dashboard unavailable</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>

          <Pressable style={styles.primaryButton} onPress={() => void loadProducts()}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.dashboardGrid}>
          <StatCard
            label="Tracked products"
            value={dashboardStats.totalProducts.toString()}
          />

          <StatCard
            label="Returns due soon"
            value={dashboardStats.upcomingReturns.toString()}
          />

          <StatCard
            label="Warranties ending soon"
            value={dashboardStats.upcomingWarranties.toString()}
          />

          <StatCard
            label="Expired deadlines"
            value={(
              dashboardStats.expiredReturns + dashboardStats.expiredWarranties
            ).toString()}
          />
        </View>
      )}

      {!isLoading && !errorMessage ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming reminders</Text>

          {topDeadlineReminders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>
                Return and warranty reminders will appear here when deadlines are close.
              </Text>
            </View>
          ) : (
            topDeadlineReminders.map((reminder) => (
              <Pressable
                key={`${reminder.product_id}-${reminder.deadline_type}`}
                style={styles.reminderCard}
                onPress={() => router.push(`/products/${reminder.product_id}`)}
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
      ) : null}

      {!isLoading && !errorMessage ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently added</Text>

          {recentProducts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>
                Your recently added products will appear here.
              </Text>
            </View>
          ) : (
            recentProducts.map((product) => (
              <Pressable
                key={product.id}
                style={styles.recentProductCard}
                onPress={() => router.push(`/products/${product.id}`)}
              >
                <Text style={styles.recentProductName}>{product.name}</Text>

                <Text style={styles.recentProductMeta}>
                  {product.merchant ?? "Merchant not set"}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/(tabs)/deadlines")}
      >
        <Text style={styles.primaryButtonText}>View Deadlines</Text>
      </Pressable>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/receipt-scan")}
      >
        <Text style={styles.primaryButtonText}>Scan Receipt</Text>
      </Pressable>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/products/new")}
      >
        <Text style={styles.primaryButtonText}>Add Product</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push("/(tabs)/products")}
      >
        <Text style={styles.secondaryButtonText}>View Products</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 120,
    backgroundColor: "#F8FAFC",
  },
  eyebrow: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 25,
    color: "#475569",
    marginBottom: 28,
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#64748B",
  },
  stateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  stateText: {
    marginTop: 12,
    fontSize: 15,
    color: "#475569",
  },
  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#991B1B",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#7F1D1D",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
  },
  recentProductCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recentProductName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  recentProductMeta: {
    fontSize: 14,
    color: "#64748B",
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