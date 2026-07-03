import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { AppState, Platform } from 'react-native';

// Native floating-bubble module is only present after `expo prebuild`.
// Guard every access so the JS app still works fine before that step.
let FloatingTimer = null;
try {
  // eslint-disable-next-line global-require
  FloatingTimer = require('../../modules/floating-timer').default;
} catch (e) {
  FloatingTimer = null;
}

const STORAGE_KEY = 'mupel_timer_state_v1';
const ONGOING_NOTIFICATION_ID = 'mupel-timer-ongoing';
const COMPLETION_NOTIFICATION_ID = 'mupel-timer-complete';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  // durationSeconds: the last full duration used (for Restart)
  // endTimestamp: ms epoch when timer hits zero (only meaningful while running)
  // remainingSeconds: authoritative remaining time, recomputed from endTimestamp
  const [durationSeconds, setDurationSeconds] = useState(5 * 60);
  const [endTimestamp, setEndTimestamp] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);

  const tickRef = useRef(null);
  const soundRef = useRef(null);
  const hydratedRef = useRef(false);

  // ---------- persistence ----------
  const persist = useCallback(async (state) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setDurationSeconds(saved.durationSeconds ?? 5 * 60);
          if (saved.running && saved.endTimestamp) {
            const remaining = Math.round((saved.endTimestamp - Date.now()) / 1000);
            if (remaining > 0) {
              setEndTimestamp(saved.endTimestamp);
              setRemainingSeconds(remaining);
              setRunning(true);
              setPaused(false);
            } else {
              setRemainingSeconds(0);
              setFinished(true);
              setRunning(false);
            }
          } else if (saved.paused) {
            setRemainingSeconds(saved.remainingSeconds ?? saved.durationSeconds ?? 5 * 60);
            setPaused(true);
            setRunning(false);
          } else {
            setRemainingSeconds(saved.durationSeconds ?? 5 * 60);
          }
        }
      } catch (e) {
        // ignore, start fresh
      } finally {
        hydratedRef.current = true;
      }
    })();
  }, []);

  // ---------- notification permissions ----------
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (e) {
        // non-fatal
      }
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('timer-ongoing', {
            name: 'Timer running',
            importance: Notifications.AndroidImportance.LOW,
            sound: null,
          });
          await Notifications.setNotificationChannelAsync('timer-complete', {
            name: 'Timer finished',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 500, 250, 500],
          });
        } catch (e) {
          // non-fatal
        }
      }
    })();
  }, []);

  // ---------- helpers ----------
  const formatRemaining = (secs) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  const clearCompletionNotification = async () => {
    try {
      await Notifications.cancelScheduledNotificationAsync(COMPLETION_NOTIFICATION_ID);
    } catch (e) {
      // non-fatal
    }
  };

  const scheduleCompletionNotification = async (secondsFromNow) => {
    try {
      await clearCompletionNotification();
      const fireDate = new Date(Date.now() + secondsFromNow * 1000);
      await Notifications.scheduleNotificationAsync({
        identifier: COMPLETION_NOTIFICATION_ID,
        content: {
          title: 'Mupel Clock',
          body: "Time's up!",
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          channelId: 'timer-complete',
        },
        // Passing a raw Date is the stable trigger format across
        // expo-notifications versions (see build lessons).
        trigger: fireDate,
      });
    } catch (e) {
      // never let a notification failure crash the countdown
    }
  };

  const updateOngoingNotification = async (secs, isRunning) => {
    try {
      if (!isRunning) {
        await Notifications.dismissNotificationAsync(ONGOING_NOTIFICATION_ID).catch(() => {});
        return;
      }
      await Notifications.scheduleNotificationAsync({
        identifier: ONGOING_NOTIFICATION_ID,
        content: {
          title: 'Timer running',
          body: `${formatRemaining(secs)} remaining`,
          sticky: true,
          autoDismiss: false,
          channelId: 'timer-ongoing',
        },
        trigger: null,
      });
    } catch (e) {
      // non-fatal
    }
  };

  const playAlarmAndVibrate = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // non-fatal
    }
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/alarm.mp3')
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      // non-fatal — silent completion is better than a crash
    }
  };

  // ---------- native floating bubble sync ----------
  const syncBubble = useCallback((secs, isRunning, isPaused) => {
    if (!FloatingTimer) return;
    try {
      FloatingTimer.updateBubble(Math.max(0, Math.round(secs)), isRunning, isPaused);
    } catch (e) {
      // native module not available on this build — safe to ignore
    }
  }, []);

  // ---------- tick loop (recomputed from endTimestamp, so backgrounding is safe) ----------
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!running || !endTimestamp) return undefined;

    tickRef.current = setInterval(() => {
      const remaining = Math.round((endTimestamp - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(tickRef.current);
        setRemainingSeconds(0);
        setRunning(false);
        setFinished(true);
        syncBubble(0, false, false);
        updateOngoingNotification(0, false);
        playAlarmAndVibrate();
      } else {
        setRemainingSeconds(remaining);
        syncBubble(remaining, true, false);
      }
    }, 250);

    return () => clearInterval(tickRef.current);
  }, [running, endTimestamp, syncBubble]);

  // Ongoing notification: refresh once a second while running & app in foreground.
  useEffect(() => {
    if (!running) return undefined;
    updateOngoingNotification(remainingSeconds, true);
    const id = setInterval(() => {
      updateOngoingNotification(remainingSeconds, true);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Recompute immediately whenever the app returns to foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && running && endTimestamp) {
        const remaining = Math.round((endTimestamp - Date.now()) / 1000);
        if (remaining <= 0) {
          setRemainingSeconds(0);
          setRunning(false);
          setFinished(true);
        } else {
          setRemainingSeconds(remaining);
        }
      }
    });
    return () => sub.remove();
  }, [running, endTimestamp]);

  // Persist on every meaningful change.
  useEffect(() => {
    if (!hydratedRef.current) return;
    persist({ durationSeconds, endTimestamp, remainingSeconds, running, paused });
  }, [durationSeconds, endTimestamp, remainingSeconds, running, paused, persist]);

  // ---------- public actions ----------
  const start = useCallback(
    (minutes) => {
      const secs = Math.max(1, Math.round(minutes * 60));
      const end = Date.now() + secs * 1000;
      setDurationSeconds(secs);
      setEndTimestamp(end);
      setRemainingSeconds(secs);
      setRunning(true);
      setPaused(false);
      setFinished(false);
      scheduleCompletionNotification(secs);
      syncBubble(secs, true, false);
      if (FloatingTimer) {
        try {
          FloatingTimer.showBubble(secs);
        } catch (e) {
          // ignore
        }
      }
    },
    [syncBubble]
  );

  const pause = useCallback(() => {
    if (!running || !endTimestamp) return;
    const remaining = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
    setRemainingSeconds(remaining);
    setRunning(false);
    setPaused(true);
    clearCompletionNotification();
    updateOngoingNotification(remaining, false);
    syncBubble(remaining, false, true);
  }, [running, endTimestamp, syncBubble]);

  const resume = useCallback(() => {
    if (running || remainingSeconds <= 0) return;
    const end = Date.now() + remainingSeconds * 1000;
    setEndTimestamp(end);
    setRunning(true);
    setPaused(false);
    scheduleCompletionNotification(remainingSeconds);
    syncBubble(remainingSeconds, true, false);
  }, [running, remainingSeconds, syncBubble]);

  const stop = useCallback(() => {
    setRunning(false);
    setPaused(false);
    setFinished(false);
    setEndTimestamp(null);
    setRemainingSeconds(durationSeconds);
    clearCompletionNotification();
    updateOngoingNotification(0, false);
    syncBubble(0, false, false);
    if (FloatingTimer) {
      try {
        FloatingTimer.hideBubble();
      } catch (e) {
        // ignore
      }
    }
  }, [durationSeconds, syncBubble]);

  const addFiveMinutes = useCallback(() => {
    const extra = 5 * 60;
    if (running && endTimestamp) {
      const newEnd = endTimestamp + extra * 1000;
      const remaining = Math.round((newEnd - Date.now()) / 1000);
      setEndTimestamp(newEnd);
      setRemainingSeconds(remaining);
      setDurationSeconds(remaining);
      scheduleCompletionNotification(remaining);
      syncBubble(remaining, true, false);
    } else {
      // Finished or stopped: extending re-starts a fresh 5 minute countdown.
      start(5);
    }
  }, [running, endTimestamp, start, syncBubble]);

  const restart = useCallback(() => {
    const secs = durationSeconds > 0 ? durationSeconds : 5 * 60;
    start(secs / 60);
  }, [durationSeconds, start]);

  // Listen for button taps coming from the native floating bubble.
  useEffect(() => {
    if (!FloatingTimer || !FloatingTimer.addListener) return undefined;
    const sub = FloatingTimer.addListener('onBubbleAction', (event) => {
      if (event?.action === 'pause') {
        running ? pause() : resume();
      } else if (event?.action === 'plus5') {
        addFiveMinutes();
      } else if (event?.action === 'stop') {
        stop();
      }
    });
    return () => sub?.remove?.();
  }, [running, pause, resume, addFiveMinutes, stop]);

  const value = {
    durationSeconds,
    remainingSeconds,
    running,
    paused,
    finished,
    progress:
      durationSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / durationSeconds)) : 0,
    formatRemaining,
    start,
    pause,
    resume,
    stop,
    addFiveMinutes,
    restart,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider');
  return ctx;
}
