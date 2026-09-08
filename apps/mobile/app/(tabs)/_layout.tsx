import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  scan: { active: "qr-code", inactive: "qr-code-outline" },
  search: { active: "search", inactive: "search-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

function tabIcon(routeName: keyof typeof ICONS) {
  function TabBarIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    const pair = ICONS[routeName];
    return <Ionicons name={focused ? pair.active : pair.inactive} size={size} color={color} />;
  }
  return TabBarIcon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1d4ed8",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tabs.Screen name="scan" options={{ title: "Scan", tabBarIcon: tabIcon("scan") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: tabIcon("search") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: tabIcon("profile") }} />
    </Tabs>
  );
}
