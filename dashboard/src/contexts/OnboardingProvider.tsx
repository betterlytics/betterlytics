'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

interface OnboardingAccountData {
  email: string;
  password?: string;
  confirmPassword?: string;
  name: string;
  isOAuth: boolean;
  provider?: 'google' | 'github' | 'credentials';
}

interface OnboardingWebsiteData {
  domain: string;
}

interface OnboardingIntegrationData {
  installationComplete: boolean;
}

interface OnboardingState {
  currentStep: number;
  isCompleted: boolean;
  userId?: string;
  siteId?: string;
  dashboardId?: string;
  account: Partial<OnboardingAccountData>;
  website: Partial<OnboardingWebsiteData>;
  integration: Partial<OnboardingIntegrationData>;
}

type OnboardingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'UPDATE_WEBSITE'; payload: Partial<OnboardingWebsiteData> }
  | { type: 'UPDATE_INTEGRATION'; payload: Partial<OnboardingIntegrationData> }
  | { type: 'SET_USER_ID'; payload: string }
  | { type: 'SET_SITE_ID'; payload: string }
  | { type: 'SET_DASHBOARD_ID'; payload: string }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'LOAD_FROM_STORAGE'; payload: OnboardingState };

const TOTAL_STEPS = 3;
const STORAGE_KEY = 'betterlytics-onboarding';

const initialState: OnboardingState = {
  currentStep: 1,
  isCompleted: false,
  account: {},
  website: {},
  integration: {
    installationComplete: false,
  },
};

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: Math.max(1, Math.min(TOTAL_STEPS, action.payload)) };

    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(TOTAL_STEPS, state.currentStep + 1) };

    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(1, state.currentStep - 1) };

    case 'UPDATE_WEBSITE':
      return { ...state, website: { ...state.website, ...action.payload } };

    case 'UPDATE_INTEGRATION':
      return { ...state, integration: { ...state.integration, ...action.payload } };

    case 'SET_USER_ID':
      return { ...state, userId: action.payload };

    case 'SET_SITE_ID':
      return { ...state, siteId: action.payload };

    case 'SET_DASHBOARD_ID':
      return { ...state, dashboardId: action.payload };

    case 'COMPLETE_ONBOARDING':
      return { ...state, isCompleted: true };

    case 'RESET_ONBOARDING':
      return initialState;

    case 'LOAD_FROM_STORAGE':
      return action.payload;

    default:
      return state;
  }
}

interface OnboardingContextType {
  state: OnboardingState;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateWebsite: (data: Partial<OnboardingWebsiteData>) => void;
  updateIntegration: (data: Partial<OnboardingIntegrationData>) => void;
  setUserId: (id: string) => void;
  setDashboardId: (id: string) => void;
  setSiteId: (id: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedState = JSON.parse(saved);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: savedState });
      } catch (error) {
        console.warn('Failed to load onboarding state from storage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!state.isCompleted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  const contextValue = useMemo<OnboardingContextType>(
    () => ({
      state,
      setStep: (step: number) => dispatch({ type: 'SET_STEP', payload: step }),
      nextStep: () => dispatch({ type: 'NEXT_STEP' }),
      prevStep: () => dispatch({ type: 'PREV_STEP' }),
      updateWebsite: (data: Partial<OnboardingWebsiteData>) => dispatch({ type: 'UPDATE_WEBSITE', payload: data }),
      updateIntegration: (data: Partial<OnboardingIntegrationData>) =>
        dispatch({ type: 'UPDATE_INTEGRATION', payload: data }),
      setUserId: (id: string) => dispatch({ type: 'SET_USER_ID', payload: id }),
      setDashboardId: (id: string) => dispatch({ type: 'SET_DASHBOARD_ID', payload: id }),
      setSiteId: (id: string) => dispatch({ type: 'SET_SITE_ID', payload: id }),
      completeOnboarding: () => dispatch({ type: 'COMPLETE_ONBOARDING' }),
      resetOnboarding: () => dispatch({ type: 'RESET_ONBOARDING' }),
    }),
    [state],
  );

  return <OnboardingContext.Provider value={contextValue}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
