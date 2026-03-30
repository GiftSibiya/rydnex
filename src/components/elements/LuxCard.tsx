import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.dark;

type Props = ViewProps & {
  elevated?: boolean;
  noPad?: boolean;
};

export default function LuxCard({ children, style, elevated, noPad, ...rest }: Props) {
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

const styles = StyleSheet.create({
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
