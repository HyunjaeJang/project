import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppBar({title}) {
  return (
    <View style={styles.appBar}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: {
    height: 50,
    backgroundColor: '#4635B1',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});