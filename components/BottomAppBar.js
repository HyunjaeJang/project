import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { context } from '../db/language'; // 언어 전환 context 임포트

export default function BottomAppBar() {
  // 현재 활성화된 라우트 이름 확인
  const navigation = useNavigation();
  const currentRouteName = useNavigationState((state) => {
    return state.routes[state.index].name;
  });

  // 애니메이션을 위한 Animated.Value 생성
  const scaleOverview = useRef(new Animated.Value(1)).current;
  const scaleDruglist = useRef(new Animated.Value(1)).current;
  const scaleExpiration = useRef(new Animated.Value(1)).current;

  // currentRouteName이 변할 때마다, 해당 버튼만 scale 1.2로 애니메이션
  useEffect(() => {
    Animated.spring(scaleOverview, {
      toValue: currentRouteName === 'Overview' ? 1.2 : 1,
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleDruglist, {
      toValue: currentRouteName === 'Drug List' ? 1.2 : 1,
      useNativeDriver: true,
    }).start();

    Animated.spring(scaleExpiration, {
      toValue: currentRouteName === 'Expiration' ? 1.2 : 1,
      useNativeDriver: true,
    }).start();
  }, [currentRouteName, scaleOverview, scaleDruglist, scaleExpiration]);

  // 버튼 및 텍스트 색상: 현재 라우트와 비교하여 강조
  const getButtonColor = (routeName) => {
    return currentRouteName === routeName ? 'yellow' : 'white';
  };

  return (
    <View style={styles.bottomAppBar}>
      <TouchableOpacity onPress={() => navigation.navigate('Overview')}>
        <Animated.View
          style={[styles.iconButton, { transform: [{ scale: scaleOverview }] }]}
        >
          <MaterialIcons
            name="medication"
            size={28}
            color={getButtonColor('Overview')}
          />
          <Text style={[styles.iconLabel, { color: getButtonColor('Overview') }]}>
            {context.BAB_OVER}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Drug List')}>
        <Animated.View
          style={[styles.iconButton, { transform: [{ scale: scaleDruglist }] }]}
        >
          <MaterialIcons
            name="view-list"
            size={28}
            color={getButtonColor('Drug List')}
          />
          <Text style={[styles.iconLabel, { color: getButtonColor('Drug List') }]}>
            {context.BAB_LIST}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Expiration')}>
        <Animated.View
          style={[styles.iconButton, { transform: [{ scale: scaleExpiration }] }]}
        >
          <MaterialIcons
            name="hourglass-bottom"
            size={28}
            color={getButtonColor('Expiration')}
          />
          <Text style={[styles.iconLabel, { color: getButtonColor('Expiration') }]}>
            {context.BAB_EXP}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    backgroundColor: '#6200ee',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLabel: {
    marginTop: 4,
    fontSize: 12,
    color: 'white',
  },
});
