// FAB.js
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function FAB({ onPress, icon = 'add' }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <MaterialIcons name={icon} size={28} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#03dac6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
