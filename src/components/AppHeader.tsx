import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Menu, Stethoscope, X } from "lucide-react-native";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useClinic } from "@/providers/ClinicProvider";

const MENU_MS = 280;
const DRAWER_WIDTH = 300;

const AccountMenuContext = createContext<{ toggleMenu: () => void; menuOpen: boolean }>({
  toggleMenu: () => {},
  menuOpen: false,
});

export function useAccountMenu() {
  return useContext(AccountMenuContext);
}

export function AccountMenuProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, deleteAccount, showToast } = useClinic();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuProgress = useSharedValue(0);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (menuOpen) {
      setMenuMounted(true);
      return;
    }
    if (!menuMounted) return;
    menuProgress.value = withTiming(0, { duration: MENU_MS }, (finished) => {
      if (finished) runOnJS(setMenuMounted)(false);
    });
  }, [menuOpen, menuMounted, menuProgress]);

  useEffect(() => {
    if (!menuMounted || !menuOpen) return;
    menuProgress.value = withTiming(1, { duration: MENU_MS });
  }, [menuMounted, menuOpen, menuProgress]);

  const backdropFade = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
  }));

  const drawerSlide = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - menuProgress.value) * DRAWER_WIDTH }],
  }));

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
    <AccountMenuContext.Provider value={{ toggleMenu, menuOpen }}>
      {children}
      {menuMounted ? (
        <View style={styles.backdrop} pointerEvents={menuOpen ? "auto" : "none"}>
          <Animated.View style={[styles.dim, backdropFade]}>
            <Pressable style={styles.backdropPress} onPress={closeMenu} />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              drawerSlide,
              { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 28 },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Pressable
                style={styles.closeButton}
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              >
                <X color={colors.primaryInk} size={26} />
              </Pressable>
            </View>
            <Pressable
              style={[styles.item, styles.itemDivider]}
              onPress={() => {
                closeMenu();
                router.push("/doctors");
              }}
            >
              <Text style={styles.itemText}>Home</Text>
            </Pressable>
            <Pressable
              style={[styles.item, styles.itemDivider]}
              onPress={() => {
                closeMenu();
                router.push("/appointments");
              }}
            >
              <Text style={styles.itemText}>My visits</Text>
            </Pressable>
            <Pressable
              style={[styles.item, styles.itemDivider]}
              onPress={() => {
                closeMenu();
                router.push("/past-visits");
              }}
            >
              <Text style={styles.itemText}>Past visits</Text>
            </Pressable>
            <Pressable
              style={[styles.item, styles.itemDivider]}
              onPress={() => {
                closeMenu();
                setConfirmSignOut(true);
              }}
            >
              <Text style={styles.itemText}>Sign out</Text>
            </Pressable>
            <Pressable
              style={styles.item}
              onPress={() => {
                closeMenu();
                setConfirmDelete(true);
              }}
            >
              <Text style={[styles.itemText, styles.dangerText]}>Delete account</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
      <ConfirmModal
        visible={confirmSignOut}
        title="Do you want to sign out?"
        confirmLabel="Yes"
        cancelLabel="No"
        confirmFirst
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          void signOut().then(() => router.replace("/auth"));
        }}
      />
      <ConfirmModal
        visible={confirmDelete}
        title="Delete your account?"
        message="This permanently removes your Bloom Clinic sign-in and every appointment saved to this account. This can’t be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete account"}
        cancelLabel="Keep my account"
        confirmFirst
        destructive
        busy={deleting}
        onCancel={() => !deleting && setConfirmDelete(false)}
        onConfirm={() => void onDelete()}
      />
    </AccountMenuContext.Provider>
  );
}

export function AppHeader() {
  const { toggleMenu, menuOpen } = useAccountMenu();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useClinic();
  const firstName = user?.name.split(" ")[0];

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <Pressable
          style={styles.brand}
          onPress={() => router.push("/doctors")}
          accessibilityRole="button"
          accessibilityLabel="Home"
        >
          <View style={styles.mark}>
            <Stethoscope color={colors.primaryInk} size={20} />
          </View>
          <View>
            <Text style={styles.title}>Bloom Clinic</Text>
            {firstName ? <Text style={styles.hello}>Hi, {firstName}</Text> : null}
          </View>
        </Pressable>
        <Pressable
          style={styles.menuButton}
          onPress={toggleMenu}
          accessibilityRole="button"
          accessibilityLabel={menuOpen ? "Close menu" : "Open menu"}
        >
          <Menu color={colors.ink} size={26} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(251, 247, 242, 0.94)",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  bar: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1100,
    elevation: 24,
  },
  dim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(40, 24, 18, 0.45)",
  },
  backdropPress: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.ink,
    paddingHorizontal: 28,
    shadowColor: "#2A1A14",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: -8, height: 0 },
    elevation: 16,
  },
  drawerHeader: {
    alignItems: "flex-end",
    marginBottom: 28,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  item: {
    paddingVertical: 20,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 248, 244, 0.22)",
  },
  itemText: {
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    color: colors.primaryInk,
  },
  dangerText: {
    color: "#F3B2A8",
  },
});
