import {
  AppAvatar,
  EmptyCard,
  ErrorState,
  LoadingOverlay,
  LoadingScreen,
  HeroBlobs,
} from "../../components/common";
import { usePullToRefresh, useEmergencyContacts } from "../../hooks";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { alertError } from "../../utils/alertError";
import { colors, typography } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import { ContactFormModal, SOSButton } from "../../components/emergency";
import type { EmergencyContact } from "../../types";
import type { ContactInput } from "../../services";

export default function EmergencyScreen() {
  const { contacts, isLoading, error, addContact, updateContact, deleteContact, reload } =
    useEmergencyContacts();
  const [formVisible, setFormVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const openAddForm = () => {
    setEditingContact(null);
    setFormVisible(true);
  };

  const openContactMenu = (contact: EmergencyContact) => {
    Alert.alert(contact.name, contact.phone, [
      { text: "Gọi", onPress: () => Linking.openURL(`tel:${contact.phone}`) },
      {
        text: "Sửa",
        onPress: () => {
          setEditingContact(contact);
          setFormVisible(true);
        },
      },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => deleteContact(contact.id).catch((e) => alertError(e)),
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const handleFormSubmit = async (input: ContactInput) => {
    if (editingContact) {
      await updateContact(editingContact.id, input);
    } else {
      await addContact(input);
    }
    setFormVisible(false);
  };

  const pullToRefresh = usePullToRefresh(reload);

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={commonStyles.screen}>
      <Animated.View {...pullToRefresh.containerProps}>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          {...pullToRefresh.scrollProps}
        >
          <View style={commonStyles.hero}>
            <HeroBlobs />
            <Text style={commonStyles.heroTitle}>Khẩn cấp</Text>
            <Text style={commonStyles.heroSubtitle}>Gọi 115 và nhắn vị trí cho người thân</Text>
          </View>

          <View style={styles.sosWrapper}>
            <SOSButton variant="large" />
          </View>

          <View style={commonStyles.sections}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Người nhận thông báo</Text>
                <Text style={styles.sectionSubheading}>Nhận tin nhắn kèm vị trí khi bạn bấm SOS</Text>
              </View>
              <TouchableOpacity
                onPress={openAddForm}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add-circle" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {contacts.length === 0 ? (
              <EmptyCard
                icon="people-outline"
                iconSize={28}
                message="Chưa có ai được thêm để nhận thông báo."
                actionText="Thêm người liên hệ"
                onAction={openAddForm}
              />
            ) : (
              <View style={styles.contactList}>
                {contacts.map((contact, index) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.contactRow,
                      index !== contacts.length - 1 && styles.contactRowDivider,
                    ]}
                    activeOpacity={0.6}
                    onPress={() => openContactMenu(contact)}
                  >
                    <AppAvatar name={contact.name} size={40} />
                    <View style={styles.contactInfoCol}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {contact.name}
                      </Text>
                      <Text style={styles.contactMeta}>
                        {contact.relationship} · {contact.phone}
                      </Text>
                    </View>
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      <LoadingOverlay visible={pullToRefresh.refreshing} />

      <ContactFormModal
        visible={formVisible}
        editingContact={editingContact}
        onClose={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sosWrapper: { marginHorizontal: 20, marginTop: -30 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sectionHeading: { fontSize: typography.h2, fontWeight: "700", color: colors.text },
  sectionSubheading: { fontSize: typography.caption, color: colors.textMuted, marginTop: 2 },

  contactList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  contactInfoCol: { flex: 1, gap: 2 },
  contactName: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  contactMeta: { fontSize: typography.caption, color: colors.textMuted },
});
