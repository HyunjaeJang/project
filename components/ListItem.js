import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function ListItem({ title, height, onEventListener, icon="checkmark-circle" }) {
  return (
    <TouchableOpacity 
      style={[styles.listItem, { height }]} 
      onPress={() => onEventListener(title)}
    >
      <View style={styles.iconContainer}>
        <FontAwesome6 name={icon} size={32} color="#B771E5" />
      </View>
      <Text style={styles.itemTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listItem: {
    justifyContent: 'left',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '90%', // Set width to match parent
    flexDirection: 'row', // Ensure icon and text are in the same row
    flexWrap: 'nowrap', // Prevent wrapping of the text
    alignItems: 'center', // Vertically center items
  },
  iconContainer: {
    width: 40, // Set a fixed width for the icon container
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    marginLeft: 8, // Add some spacing between icon and text
  },
});
