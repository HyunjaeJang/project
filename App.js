import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native'; // Text, View 임포트 추가
import MainTabs from './MainTabs';
import { initDatabase } from './db/database'; // initDatabase 임포트
import { initNotifications } from './db/notifier'; // initNotifications 임포트 추가
import AddPills from './screens/sub_screens/AddPills';
import AddPillDetail from './screens/sub_screens/AddPillDetail';
import { context } from './db/language'; // 언어 전환 context 임포트

const RootStack = createNativeStackNavigator();

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await initDatabase();
        await initNotifications(); // 알림 시스템 초기화 호출 추가
        setIsDbReady(true);
        console.log("Database and Notifications initialized successfully.");
      } catch (e) {
        console.error("Error initializing app:", e);
        // 오류 처리 로직 (예: 사용자에게 오류 메시지 표시)
      }
    }
    prepareApp(); // 함수 이름 변경 반영
  }, []);

  if (!isDbReady) {
    // 데이터베이스 준비 중 로딩 화면 표시
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading database...</Text>
      </View>
    );
  }

  // 데이터베이스 준비 완료 후 메인 네비게이션 렌더링
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4635B1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {/* 탭 전체를 하나의 Screen으로 등록 */}
        <RootStack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }} // 탭 화면은 상단 헤더 숨김
        />
        {/* AddPillDetail Screen 추가 */}
        <RootStack.Screen
          name="AddPills"
          component={AddPills}
          options={{ title: context.ADD_PILL }}
        />
        <RootStack.Screen
          name="AddPillDetail"
          component={AddPillDetail}
          options={{ title: context.ADD_PILL_DETAIL }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
