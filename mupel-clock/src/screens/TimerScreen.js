import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { colors } from '../theme/colors';
import { useTimer } from '../context/TimerContext';

export default function TimerScreen() {
  const {
    remainingSeconds,
    durationSeconds,
    running,
    paused,
    finished,
    progress,
    start,
    pause,
    resume,
    stop,
    addFiveMinutes,
    restart,
  } = useTimer();
  const [minutesInput, setMinutesInput] = useState('5');

  const m = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (remainingSeconds % 60).toString().padStart(2, '0');

  const idle = !running && !paused && !finished;

  return (
    <View style={styles.container}>
      {finished && <Text style={styles.finishedBanner}>Time's up!</Text>}

      <Text style={styles.digits}>
        {m}:{s}
      </Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {idle && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={minutesInput}
            onChangeText={setMinutesInput}
            maxLength={4}
            placeholder="Minutes"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.inputLabel}>minutes</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        {idle && (
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => {
              const val = parseFloat(minutesInput);
              if (!Number.isNaN(val) && val > 0) start(val);
            }}
          >
            <Text style={styles.primaryButtonText}>Start</Text>
          </Pressable>
        )}

        {running && (
          <Pressable style={[styles.button, styles.secondaryButton]} onPress={pause}>
            <Text style={styles.secondaryButtonText}>Pause</Text>
          </Pressable>
        )}

        {paused && (
          <Pressable style={[styles.button, styles.primaryButton]} onPress={resume}>
            <Text style={styles.primaryButtonText}>Resume</Text>
          </Pressable>
        )}

        {(running || paused || finished) && (
          <Pressable style={[styles.button, styles.dangerButton]} onPress={stop}>
            <Text style={styles.dangerButtonText}>Stop</Text>
          </Pressable>
        )}
      </View>

      {(running || paused || finished) && (
        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.ghostButton]} onPress={addFiveMinutes}>
            <Text style={styles.ghostButtonText}>+5 Minutes</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.ghostButton]} onPress={restart}>
            <Text style={styles.ghostButtonText}>Restart</Text>
          </Pressable>
        </View>
      )}

      {durationSeconds > 0 && !idle && (
        <Text style={styles.durationHint}>
          Duration: {Math.round(durationSeconds / 60)} min
        </Text>
      )}
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
  finishedBanner: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  digits: {
    color: colors.text,
    fontSize: 88,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    marginBottom: 24,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    color: colors.text,
    fontSize: 28,
    minWidth: 60,
    textAlign: 'right',
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 16,
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 26,
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
    fontSize: 14,
  },
  durationHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 24,
  },
});
