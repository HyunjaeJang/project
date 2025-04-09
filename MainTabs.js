import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import OverviewScreen from './screens/OverviewScreen';
import ExpirationScreen from './screens/ExpirationScreen';
import DruglistScreen from './screens/DruglistScreen';
import { context } from './db/language'; // 언어 전환 context를 임포트

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Overview"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4635B1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // 하단 탭바 숨김
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={OverviewScreen}
        options={({ navigation }) => ({
          title: context.TITLE_OVER, // 예: 한국어일 경우 '복용 관리'
        })}
      />
      <Tab.Screen
        name="Drug List"
        component={DruglistScreen}
        options={{
          title: context.TITLE_LIST, // 예: 한국어일 경우 '등록 현황'
        }}
      />
      <Tab.Screen
        name="Expiration"
        component={ExpirationScreen}
        options={{
          title: context.TITLE_EXP, // 예: 한국어일 경우 '폐기 방법 / 목록 / 위치'
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRightButton: {
    marginRight: 16,
    // 헤더의 기본 높이가 약 56px 정도이므로, 40px 정도의 정사각형 버튼 사용
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
