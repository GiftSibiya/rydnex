import React, { useMemo } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useAppTheme } from "@/themes/AppTheme";
import { AppThemeColors } from "@/themes/theme";

type Props = ViewProps & {
  elevated?: boolean;
  noPad?: boolean;
};

export default function LuxCard({ children, style, elevated, noPad, ...rest }: Props) {
  const { colors: C } = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        noPad && { padding: 0 },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const createStyles = (C: AppThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
  },
  elevated: {
    backgroundColor: C.surfaceElevated,
    borderColor: C.surfaceBorder,
  },
});
