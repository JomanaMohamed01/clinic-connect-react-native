import { Redirect } from "expo-router";
import { BootScreen } from "@/components/BootScreen";
import { useClinic } from "@/providers/ClinicProvider";

export default function Index() {
  const { ready, user, isReception } = useClinic();
  if (!ready) return <BootScreen />;
  if (!user) return <Redirect href="/auth" />;
  if (isReception) return <Redirect href="/reception" />;
  return <Redirect href="/doctors" />;
}
