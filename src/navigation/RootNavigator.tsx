import { LoadingScreen } from "../components/common";
import {
  useAuth,
  useReminderSync,
  useCaregiverAlertWatch,
  usePushRegistration,
} from "../hooks";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AuthNavigator from "./AuthNavigator";
import { colors, typography } from "../theme/colors";
import { navigationRef } from "./navigationRef";
import { ROLE_TABS } from "../constants/roles";
import {
  AlertsScreen,
  AppointmentHistoryScreen,
  ConditionsScreen,
  ElderlyDetailScreen,
  FormerPatientsScreen,
  MeasurementHistoryScreen,
  MetricHistoryScreen,
  NotificationsScreen,
  PatientDetailScreen,
  ProfileScreen,
  SettingsScreen,
  StaffNotificationsScreen,
} from "../screens";
import type { Role } from "../types/auth";
import type { MetricType } from "../types/health";

const Tab = createBottomTabNavigator();

// Stack bọc ngoài các tab: màn con (Cảnh báo, Lịch sử chỉ số...) mở đè lên tab, có nút quay lại.
// Mục đang mở của màn Hồ sơ bệnh nhân (bác sĩ).
export type PatientDetailTab = "health" | "record" | "appointments";

export type MainStackParamList = {
  Main: { screen?: string } | undefined;
  Alerts: undefined;
  MetricHistory: { type: MetricType };
  MeasurementHistory: undefined;
  AppointmentHistory: undefined;
  ElderlyDetail: undefined;
  PatientDetail: { tab?: PatientDetailTab } | undefined;
  FormerPatients: undefined;
  StaffNotifications: undefined;
  Notifications: undefined;
  Settings: undefined;
  Conditions: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

function MainStack({ role }: { role: Role }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
        // Nút quay lại chỉ hiện icon mũi tên, không kèm chữ.
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="Main" options={{ headerShown: false }}>
        {() => <MainTabs role={role} />}
      </Stack.Screen>
      <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: "Cảnh báo" }} />
      <Stack.Screen name="MeasurementHistory" component={MeasurementHistoryScreen} options={{ title: "Lịch sử kiểm tra chỉ số" }} />
      <Stack.Screen name="AppointmentHistory" component={AppointmentHistoryScreen} options={{ title: "Lịch sử khám" }} />
      <Stack.Screen name="MetricHistory" component={MetricHistoryScreen} options={{ title: "Lịch sử chỉ số" }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: "Hồ sơ bệnh nhân" }} />
      <Stack.Screen name="StaffNotifications" component={StaffNotificationsScreen} options={{ title: "Thông báo" }} />
      <Stack.Screen name="FormerPatients" component={FormerPatientsScreen} options={{ title: "Cựu bệnh nhân" }} />
      <Stack.Screen name="ElderlyDetail" component={ElderlyDetailScreen} options={{ title: "Hồ sơ" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Thông báo" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Cài đặt" }} />
      <Stack.Screen name="Conditions" component={ConditionsScreen} options={{ title: "Bệnh nền & Tiền sử" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function MainTabs({ role }: { role: Role }) {
  const tabs = ROLE_TABS[role];
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 14);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: [
          styles.floatingTabBar,
          {
            bottom: bottomOffset,
          },
        ],
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, focused }) => {
              const iconName = focused ? tab.icon : `${tab.icon}-outline`;
              return (
                <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                  <Ionicons name={iconName as any} size={22} color={color} />
                </View>
              );
            },
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { currentUser, isRestoring } = useAuth();
  useReminderSync();
  useCaregiverAlertWatch();
  usePushRegistration();

  // Chờ khôi phục phiên đã lưu để không nháy màn đăng nhập với người đã đăng nhập.
  if (isRestoring) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {currentUser ? <MainStack role={currentUser.role} /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  floatingTabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    paddingBottom: 0,
    paddingTop: 0,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  tabBarItem: {
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 4,
  },
  tabIconWrapper: {
    width: 40,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapperActive: {
    backgroundColor: `${colors.primary}18`,
  },
});

