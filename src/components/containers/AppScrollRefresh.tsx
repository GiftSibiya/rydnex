import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react';
import { RefreshControl } from 'react-native-gesture-handler';

interface AppScrollRefresh {
  children: React.ReactNode;
  loading: boolean;
  onRefresh: () => void
}

const AppScrollRefresh: React.FC<AppScrollRefresh> = ({ children, loading, onRefresh }) => {
  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => onRefresh()}>
      </RefreshControl>}>
      {children}
    </ScrollView>
  )
}

export default AppScrollRefresh

const styles = StyleSheet.create({})