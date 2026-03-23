import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/themes/AppTheme';
import { FONT_FAMILY } from '@/constants/Fonts';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const ScreenScaffold: React.FC<Props> = ({ title, subtitle, children }) => {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 30, fontFamily: FONT_FAMILY.nexaBold, letterSpacing: 0.4 },
  subtitle: { fontSize: 13, marginTop: 6, fontFamily: FONT_FAMILY.poppinsRegular },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
});

export default ScreenScaffold;
