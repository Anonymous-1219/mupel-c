import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { TimerProvider } from './src/context/TimerContext';
import ClockScreen from './src/screens/ClockScreen';
import TimerScreen from './src/screens/TimerScreen';
import StopwatchScreen from './src/screens/StopwatchScreen';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

function TabIcon({ symbol, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TimerProvider>
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                height: 64,
                paddingBottom: 10,
                paddingTop: 8,
              },
              tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
              tabBarIcon: ({ focused }) => {
                const symbol =
                  route.name === 'Clock' ? '🕐' : route.name === 'Timer' ? '⏱' : '⏲';
                return <TabIcon symbol={symbol} focused={focused} />;
              },
            })}
          >
            <Tab.Screen name="Clock" component={ClockScreen} />
            <Tab.Screen name="Timer" component={TimerScreen} />
            <Tab.Screen name="Stopwatch" component={StopwatchScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </TimerProvider>
    </SafeAreaProvider>
  );
}
