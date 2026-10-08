'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_SLOTS, PHOTO_MANIFEST, type PhotoMeta, type PhotoSlot, toSlots } from './photos';

export type ReadyPhoto = { slot: PhotoSlot; image: HTMLImageElement };

// Load and decode the very element PhotoCell will display. Moving it into the
// card avoids a second request/decode between the readiness check and paint.
function loadPhoto(photo: PhotoMeta, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      image.onload = null;
      image.onerror = null;
      if (error) {
        image.removeAttribute('src');
        reject(error);
      } else resolve(image);
    };
    const abort = () => finish(new Error('Photo load cancelled'));
    const timer = setTimeout(() => finish(new Error('Photo load timed out')), 2500);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) return abort();
    image.alt = '';
    image.decoding = 'async';
    image.onerror = () => finish(new Error('Photo unavailable'));
    image.onload = () => {
      image.decode().then(
        () => finish(image.naturalWidth ? undefined : new Error('Empty photo')),
        () => finish(new Error('Photo decode failed')),
      );
    };
    image.src = `/photos/${photo.file}`;
  });
}

export function usePhotoShuffle() {
  const [slots, setSlots] = useState<readonly PhotoSlot[]>(INITIAL_SLOTS);
  const [incoming, setIncoming] = useState<ReadyPhoto[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const current = useRef(slots);
  const active = useRef<AbortController | null>(null);
  const pending = useRef<ReadyPhoto[] | null>(null);
  const finished = useRef(new Set<string>());
  const failures = useRef(new Map<string, number>());

  const shuffle = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage('Loading the next photographs');
    const available = PHOTO_MANIFEST.filter(
      (photo) =>
        !current.current.some((slot) => slot.photo.file === photo.file) &&
        (failures.current.get(photo.file) ?? 0) < Date.now(),
    ).sort((a, b) => a.hue - b.hue);
    const offset = Math.floor(Math.random() * Math.max(1, available.length - 1));
    const ordered = [...available.slice(offset), ...available.slice(0, offset)];
    const findReady = async (index: number) => {
      // Disjoint candidate lists prevent duplicate photos when one slot fails.
      const candidates = ordered.filter((_, i) => i % 2 === index).slice(0, 4);
      for (const photo of candidates) {
        try {
          const image = await loadPhoto(photo, controller.signal);
          return { photo, image };
        } catch {
          if (controller.signal.aborted) return null;
          failures.current.set(photo.file, Date.now() + 60_000);
        }
      }
      return null;
    };
    const results = await Promise.all([findReady(0), findReady(1)]);
    if (controller.signal.aborted) return;
    const [first, second] = results;
    if (!first || !second) {
      active.current = null;
      setBusy(false);
      setMessage('Keeping the current photographs. New photos are temporarily unavailable.');
      return;
    }
    const nextSlots = toSlots([first.photo, second.photo]);
    const ready = [first, second].map((result, i) => ({
      slot: nextSlots[i],
      image: result.image,
    }));
    pending.current = ready;
    finished.current.clear();
    setIncoming(ready);
  }, []);

  const onSettled = useCallback((file: string) => {
    const next = pending.current;
    if (!next?.some((photo) => photo.slot.photo.file === file)) return;
    finished.current.add(file);
    if (finished.current.size !== next.length) return;
    current.current = next.map((photo) => photo.slot);
    setSlots(current.current);
    setIncoming(null);
    pending.current = null;
    active.current = null;
    setBusy(false);
    setMessage('Photos shuffled');
  }, []);

  useEffect(() => {
    void shuffle();
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [shuffle]);

  return { slots, incoming, busy, message, shuffle, onSettled };
}
