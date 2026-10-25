import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, shadow } from "@/constants/theme";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={() => !busy && onCancel()}>
        <Pressable style={[styles.card, shadow]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable disabled={busy} onPress={onCancel} style={styles.cancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={onConfirm}
              style={[styles.confirm, destructive && styles.danger, busy && styles.busy]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(78, 56, 46, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
  },
  message: {
    marginTop: 8,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  cancel: {
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    fontSize: 15,
  },
  confirm: {
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  danger: {
    backgroundColor: colors.danger,
  },
  busy: {
    opacity: 0.7,
  },
  confirmText: {
    fontFamily: fonts.sansBold,
    color: colors.primaryInk,
    fontSize: 15,
  },
});
