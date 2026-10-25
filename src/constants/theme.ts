export const colors = {
  background: "#FBF7F2",
  ink: "#4E382E",
  muted: "#8A7368",
  card: "#FFFFFF",
  line: "#EADFD6",
  primary: "#E08B78",
  primaryDeep: "#D47262",
  primaryInk: "#FFF8F4",
  sage: "#8FCBAA",
  sageInk: "#24382C",
  blush: "#F6E7DA",
  peach: "#F0C9B0",
  danger: "#C45448",
  amber: "#C4841D",
  success: "#1F8A5B",
  white: "#FFFFFF",
} as const;

export const gradient = {
  peach: ["#E59A7A", "#D47262"] as const,
  wash: ["#F8EFE6", "#F6E4D8", "#E7F0E8"] as const,
};

export const shadow = {
  shadowColor: "#8A5A48",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.12,
  shadowRadius: 18,
  elevation: 4,
} as const;

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  sans: "Nunito_400Regular",
  sansMedium: "Nunito_600SemiBold",
  sansBold: "Nunito_700Bold",
} as const;
