import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/themes/AppTheme';
import { FONT_FAMILY } from '@/constants/Fonts';

type Props = {
  label: string;
  value: string;
  hint?: string;
};

const MetricCard: React.FC<Props> = ({ label, value, hint }) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      {hint ? <Text style={[styles.hint, { color: colors.secondary }]}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: FONT_FAMILY.poppinsRegular },
  value: { fontSize: 28, marginTop: 6, fontFamily: FONT_FAMILY.nexaBold },
  hint: { marginTop: 4, fontSize: 12, fontFamily: FONT_FAMILY.poppinsRegular },
});

export default MetricCard;
