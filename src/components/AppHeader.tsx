import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Calendar, LogOut, Stethoscope, UserX } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useClinic } from "@/providers/ClinicProvider";

export function AppHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, deleteAccount, showToast } = useClinic();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const firstName = user?.name.split(" ")[0];

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      setConfirmDelete(false);
      showToast("Your account has been deleted.");
      router.replace("/auth");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete your account.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Pressable style={styles.brand} onPress={() => setMenuOpen(true)}>
        <View style={styles.mark}>
          <Stethoscope color={colors.primaryInk} size={20} />
        </View>
        <View>
          <Text style={styles.title}>Bloom Clinic</Text>
          {firstName ? <Text style={styles.hello}>Hi, {firstName}</Text> : null}
        </View>
      </Pressable>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.menu, { top: insets.top + 62 }]}>
            <Pressable
              style={styles.item}
              onPress={() => {
                setMenuOpen(false);
                router.push("/appointments");
              }}
            >
              <View style={[styles.itemIcon, { backgroundColor: colors.blush }]}>
                <Calendar color={colors.primary} size={16} />
              </View>
              <Text style={styles.itemText}>My visits</Text>
            </Pressable>
            <Pressable
              style={styles.item}
              onPress={() => {
                setMenuOpen(false);
                void signOut().then(() => router.replace("/auth"));
              }}
            >
              <View style={[styles.itemIcon, { backgroundColor: "#F3EBE4" }]}>
                <LogOut color={colors.muted} size={16} />
              </View>
              <Text style={styles.itemText}>Sign out</Text>
            </Pressable>
            <View style={styles.separator} />
            <Pressable
              style={styles.item}
              onPress={() => {
                setMenuOpen(false);
                setConfirmDelete(true);
              }}
            >
              <View style={[styles.itemIcon, { backgroundColor: "#F8E4E1" }]}>
                <UserX color={colors.danger} size={16} />
              </View>
              <Text style={[styles.itemText, styles.dangerText]}>Delete account</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={confirmDelete}
        title="Delete your account?"
        message="This permanently removes your Bloom Clinic sign-in and every appointment saved to this account. This can’t be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete account"}
        cancelLabel="Keep my account"
        destructive
        busy={deleting}
        onCancel={() => !deleting && setConfirmDelete(false)}
        onConfirm={() => void onDelete()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(251, 247, 242, 0.94)",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  hello: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    left: 16,
    width: 230,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 8,
    shadowColor: "#8A5A48",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
  dangerText: {
    color: colors.danger,
  },
  separator: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
