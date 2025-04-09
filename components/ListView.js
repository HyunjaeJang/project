import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ListItem from './ListItem';

export default function ListView({ onEventListener }) {
  const items = ['요약', '약 목록', '유통 기한'];
  const screenHeight = Dimensions.get('window').height;
  const itemHeight = screenHeight / items.length - 50;

  return (
    <View style={styles.listContainer}>
      {items.map((item, index) => (
        <ListItem
          key={index}
          title={item}
          height={itemHeight}
          onEventListener={onEventListener}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    padding: 16,
  },
});
