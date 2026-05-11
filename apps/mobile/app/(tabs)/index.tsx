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

import { listProducts } from "@/src/features/products/api";
import type { Product } from "@/src/features/products/types";
import { getDaysUntilDate } from "@/src/features/products/deadlineUtils";


export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await listProducts();
      setProducts(data);
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
    let missingReturnDeadlines = 0;

    for (const product of products) {
      const daysUntilReturn = getDaysUntilDate(product.return_deadline);

      if (daysUntilReturn === null) {
        missingReturnDeadlines += 1;
      } else if (daysUntilReturn < 0) {
        expiredReturns += 1;
      } else if (daysUntilReturn <= 7) {
        upcomingReturns += 1;
      }
    }

    return {
      totalProducts: products.length,
      upcomingReturns,
      expiredReturns,
      missingReturnDeadlines,
    };
  }, [products]);

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
            label="Expired returns"
            value={dashboardStats.expiredReturns.toString()}
          />

          <StatCard
            label="Missing deadlines"
            value={dashboardStats.missingReturnDeadlines.toString()}
          />
        </View>
      )}

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
});