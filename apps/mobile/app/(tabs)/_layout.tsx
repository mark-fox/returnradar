import { Tabs } from "expo-router";
import { Bot, CalendarClock, Package, Radar } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#64748B",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Radar size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="deadlines"
        options={{
          title: "Deadlines",
          tabBarIcon: ({ color }) => <CalendarClock size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color }) => <Package size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="ai-status"
        options={{
          title: "AI",
          tabBarIcon: ({ color }) => (
            <Bot size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}