'use client';
import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
  PropsWithChildren,
  useEffect,
} from 'react';
import {
  type MapUpdateHandler,
  type MapCommand,
  type MapRunCommand,
  MAP_COMMAND_RESOLVERS,
} from '@/types/deckgl-viewtypes';
import { MapViewState } from '@deck.gl/core';

/**
 * Context type for map commands and subscriptions.
 * Note: viewState is NOT stored here — it lives inside the map component for smooth updates.
 */
export type MapCommandContextType = {
  subscribe: (handler: MapUpdateHandler) => () => void;
  runCommand: MapRunCommand;
};

const MapCommandContext = createContext<MapCommandContextType | null>(null);

/**
 * Hook to subscribe a map component to command updates.
 * The map owns the viewState and applies updates via its own dispatch.
 *
 * @param setViewState - React dispatch to update the map's viewState
 */
export function useMapSubscriptions(setViewState: React.Dispatch<React.SetStateAction<MapViewState>>) {
  const { subscribe } = useMapCommands();

  useEffect(() => {
    const unsubscribe = subscribe((cmd: MapCommand, args: any) => {
      setViewState((prev) => MAP_COMMAND_RESOLVERS[cmd](args, prev));
    });

    return unsubscribe;
  }, [subscribe, setViewState]);
}

/**
 * Hook to access the MapCommandContext for sending commands.
 */
export const useMapCommands = () => {
  const ctx = useContext(MapCommandContext);
  if (!ctx) throw new Error('useMapCommands must be used inside a MapCommandProvider');
  return ctx;
};

/**
 * Provider for the MapCommandContext.
 * Maintains a set of subscribers and exposes runCommand to broadcast commands.
 *
 * Note: This does NOT store viewState — the map component keeps it locally.
 */
export function MapCommandProvider({ children }: PropsWithChildren) {
  const subscribers = useRef<Set<MapUpdateHandler>>(new Set());

  // Broadcast a command to all subscribers
  const broadcast = useCallback((cmd: MapCommand, args: any) => {
    for (const handler of subscribers.current) {
      handler(cmd, args);
    }
  }, []);

  // Add a subscriber
  const subscribe = useCallback((handler: MapUpdateHandler) => {
    subscribers.current.add(handler);
    return () => subscribers.current.delete(handler);
  }, []);

  // Exposed API for sending commands
  const runCommand: MapRunCommand = useCallback((cmd, args) => broadcast(cmd, args), [broadcast]);

  const value = useMemo(() => ({ subscribe, runCommand }), [subscribe, runCommand]);

  return <MapCommandContext.Provider value={value}>{children}</MapCommandContext.Provider>;
}
