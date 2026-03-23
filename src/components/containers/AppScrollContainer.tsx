import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

interface AppScrollContainerProps {
  children: React.ReactNode
};

const AppScrollContainer: React.FC<AppScrollContainerProps> = ({ children }) => {
  return (
    <View style={{ height: '100%' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ height: '100%' }}>
          {children}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
};

export default AppScrollContainer;