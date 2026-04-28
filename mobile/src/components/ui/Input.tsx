import { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Radius } from '@/src/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export default function Input({ label, error, rightIcon, onRightIconPress, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, focused && styles.focused, error ? styles.errorBorder : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.gray400}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.icon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { marginBottom: 16 },
  label:       { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  inputWrap:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.gray200,
    paddingHorizontal: 14,
  },
  focused:     { borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  errorBorder: { borderColor: Colors.error },
  input:       { flex: 1, fontSize: 15, color: Colors.gray900, paddingVertical: 14 },
  icon:        { paddingLeft: 8 },
  error:       { fontSize: 12, color: Colors.error, marginTop: 4 },
});
