"use client";
import { useCallback, useRef, useSyncExternalStore } from "react";

const FILES = {
  pop: "/assets/sound/pop.mp3",
  success: "/assets/sound/success.mp3",
  fail: "/assets/sound/faill.mp3",
  warning: "/assets/sound/warning.mp3",
  levelup: "/assets/sound/levelup.mp3",
  over: "/assets/sound/over.mp3",
  timeout: "/assets/sound/timeout.mp3",
  click: "/assets/sound/btnclick.mp3",
};

// The mute switch is remembered in localStorage and shared by every game.
const listeners = new Set();
let memoryMuted = false;
function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function readMuted() {
  try {
    return localStorage.getItem("ap-muted") === "1";
  } catch {
    return memoryMuted;
  }
}

/** Game sounds with a remembered mute switch. */
export function useSounds() {
  const cache = useRef({});
  const muted = useSyncExternalStore(subscribe, readMuted, () => false);

  const toggleMute = useCallback(() => {
    const next = !readMuted();
    try {
      localStorage.setItem("ap-muted", next ? "1" : "0");
    } catch {
      memoryMuted = next; // storage blocked: remember for this page only
    }
    listeners.forEach((l) => l());
  }, []);

  const play = useCallback(
    (name) => {
      if (muted || typeof Audio === "undefined") return;
      const src = FILES[name];
      if (!src) return;
      const a = cache.current[name] || (cache.current[name] = new Audio(src));
      try {
        a.currentTime = 0;
        a.play().catch(() => {});
      } catch {
        /* ignore */
      }
    },
    [muted]
  );

  return { play, muted, toggleMute };
}
