import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ReturnRadar</Text>

      <Text style={styles.title}>
        Track purchases, returns, and warranties.
      </Text>

      <Text style={styles.description}>
        Scan receipts, confirm AI-suggested details, and keep important return
        and warranty deadlines in one place.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>MVP Focus</Text>
        <Text style={styles.cardText}>
          Product tracking will come first. Receipt scanning and AI extraction
          will be added after the core product flow is working.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
});