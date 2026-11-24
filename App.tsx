import { ChatbotFAB } from "./src/components/chatbot";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./src/context/AuthContext";
import { SubjectProvider } from "./src/context/SubjectContext";
import { queryClient } from "./src/config/queryClient";
import { useAuth } from "./src/hooks";

/** Chatbot chỉ hiển thị với bệnh nhân (ELDERLY) và người thân (CAREGIVER). */
const CHATBOT_ROLES = ["ELDERLY", "CAREGIVER"];

function AppContent() {
  const { currentUser } = useAuth();
  const showChatbot = currentUser && CHATBOT_ROLES.includes(currentUser.role);

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
      {showChatbot && <ChatbotFAB role={currentUser.role} />}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubjectProvider>
            <AppContent />
          </SubjectProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
