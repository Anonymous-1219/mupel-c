import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { colors } from '../theme/colors';

function formatMs(totalMs) {
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const msStr = Math.floor(ms / 10)
    .toString()
    .padStart(2, '0');
  const base = h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
  return `${base}.${msStr}`;
}

export default function StopwatchScreen() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]); // [{ id, cumulativeMs, lapMs }]
  const startRef = useRef(null);
  const accumulatedRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    const loop = () => {
      const now = Date.now();
      setElapsedMs(accumulatedRef.current + (now - startRef.current));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const handleStart = useCallback(() => {
    startRef.current = Date.now();
    setRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    accumulatedRef.current += Date.now() - startRef.current;
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    accumulatedRef.current = 0;
    setElapsedMs(0);
    setRunning(false);
    setLaps([]);
  }, []);

  const handleLap = useCallback(() => {
    setLaps((prev) => {
      const prevCumulative = prev.length > 0 ? prev[0].cumulativeMs : 0;
      const lapMs = elapsedMs - prevCumulative;
      return [{ id: Date.now(), cumulativeMs: elapsedMs, lapMs }, ...prev];
    });
  }, [elapsedMs]);

  const idle = !running && elapsedMs === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.digits}>{formatMs(elapsedMs)}</Text>

      <View style={styles.buttonRow}>
        {!running ? (
          <Pressable style={[styles.button, styles.primaryButton]} onPress={handleStart}>
            <Text style={styles.primaryButtonText}>{elapsedMs === 0 ? 'Start' : 'Resume'}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={handlePause}>
            <Text style={styles.secondaryButtonText}>Pause</Text>
          </Pressable>
        )}

        {running ? (
          <Pressable style={[styles.button, styles.ghostButton]} onPress={handleLap}>
            <Text style={styles.ghostButtonText}>Lap</Text>
          </Pressable>
        ) : (
          !idle && (
            <Pressable style={[styles.button, styles.dangerButton]} onPress={handleReset}>
              <Text style={styles.dangerButtonText}>Reset</Text>
            </Pressable>
          )
        )}
      </View>

      <FlatList
        style={styles.lapList}
        data={laps}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <View style={styles.lapRow}>
            <Text style={styles.lapIndex}>#{laps.length - index}</Text>
            <Text style={styles.lapTime}>{formatMs(item.lapMs)}</Text>
            <Text style={styles.lapCumulative}>{formatMs(item.cumulativeMs)}</Text>
          </View>
        )}
        ListHeaderComponent={
          laps.length > 0 ? (
            <View style={styles.lapHeader}>
              <Text style={styles.lapHeaderText}>Lap</Text>
              <Text style={styles.lapHeaderText}>Split</Text>
              <Text style={styles.lapHeaderText}>Total</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  digits: {
    color: colors.text,
    fontSize: 60,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 18,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerButtonText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 16,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  lapList: {
    width: '100%',
  },
  lapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lapHeaderText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  lapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lapIndex: {
    color: colors.textMuted,
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  lapTime: {
    color: colors.text,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    flex: 1,
    textAlign: 'center',
  },
  lapCumulative: {
    color: colors.primary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    flex: 1,
    textAlign: 'center',
  },
});
