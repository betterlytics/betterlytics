"use client";

import React, { createContext, useContext, useState, Dispatch, SetStateAction } from "react";

type UserJourneyFilterContextType = {
  numberOfSteps: number;
  numberOfJourneys: number;
  setNumberOfSteps: Dispatch<SetStateAction<number>>;
  setNumberOfJourneys: Dispatch<SetStateAction<number>>;
};

const UserJourneyFilterContext = createContext<UserJourneyFilterContextType | undefined>(undefined);

export function useUserJourneyFilter() {
  const context = useContext(UserJourneyFilterContext);
  if (!context) throw new Error("useUserJourneyFilter must be used within UserJourneyFilterProvider");
  return context;
}

type Props = {
  children: React.ReactNode;
  initialNumberOfSteps?: number;
  initialNumberOfJourneys?: number;
};

export function UserJourneyFilterProvider({ children, initialNumberOfSteps, initialNumberOfJourneys }: Props) {
  const [numberOfSteps, setNumberOfSteps] = useState<number>(initialNumberOfSteps ?? 3);
  const [numberOfJourneys, setNumberOfJourneys] = useState<number>(initialNumberOfJourneys ?? 10);

  return (
    <UserJourneyFilterContext.Provider value={{ numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys }}>
      {children}
    </UserJourneyFilterContext.Provider>
  );
} 