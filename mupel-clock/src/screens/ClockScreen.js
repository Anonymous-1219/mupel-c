import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';

const FORMAT_KEY = 'mupel_clock_format_24h';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ClockScreen() {
  const [now, setNow] = useState(new Date());
  const [is24h, setIs24h] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(FORMAT_KEY);
        if (saved !== null) setIs24h(saved === 'true');
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const toggleFormat = useCallback(() => {
    setIs24h((prev) => {
      const next = !prev;
      AsyncStorage.setItem(FORMAT_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  let suffix = '';
  if (!is24h) {
    suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
  }
  const hoursStr = hours.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.day}>{DAYS[now.getDay()]}</Text>
      <Text style={styles.date}>
        {MONTHS[now.getMonth()]} {now.getDate()}, {now.getFullYear()}
      </Text>

      <View style={styles.clockRow}>
        <Text style={styles.time}>
          {hoursStr}:{minutes}
          <Text style={styles.seconds}>:{seconds}</Text>
        </Text>
        {!is24h && <Text style={styles.suffix}>{suffix}</Text>}
      </View>

      <Pressable style={styles.toggle} onPress={toggleFormat}>
        <Text style={styles.toggleText}>{is24h ? '24H' : '12H'} · tap to switch</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  day: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  date: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 32,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  time: {
    color: colors.text,
    fontSize: 72,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  seconds: {
    fontSize: 32,
    color: colors.textMuted,
  },
  suffix: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 8,
    marginBottom: 10,
  },
  toggle: {
    marginTop: 40,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
