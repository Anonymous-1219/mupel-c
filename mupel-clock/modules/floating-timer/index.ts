import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';
import FloatingTimerModule from './src/FloatingTimerModule';

const emitter = new EventEmitter(FloatingTimerModule ?? NativeModulesProxy.FloatingTimer);

export type BubbleActionEvent = {
  action: 'pause' | 'plus5' | 'stop';
};

export default {
  /** Returns true if "Display over other apps" is already granted. */
  hasOverlayPermission(): boolean {
    return FloatingTimerModule.hasOverlayPermission();
  },
  /** Opens the system settings screen for the user to grant the overlay permission. */
  requestOverlayPermission(): void {
    FloatingTimerModule.requestOverlayPermission();
  },
  /** Starts the foreground service and shows the floating bubble. */
  showBubble(secondsRemaining: number): void {
    FloatingTimerModule.showBubble(secondsRemaining);
  },
  /** Pushes the latest countdown state to the already-visible bubble. */
  updateBubble(secondsRemaining: number, running: boolean, paused: boolean): void {
    FloatingTimerModule.updateBubble(secondsRemaining, running, paused);
  },
  /** Stops the foreground service and removes the bubble. */
  hideBubble(): void {
    FloatingTimerModule.hideBubble();
  },
  addListener(eventName: 'onBubbleAction', listener: (event: BubbleActionEvent) => void): Subscription {
    return emitter.addListener(eventName, listener);
  },
};
