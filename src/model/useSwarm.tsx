import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from "react";
import { Swarm as SwarmI } from "../types/swarm-types";

const SwarmModelContext = createContext<SwarmModel | null>(null);

export function useSwarm() {
  const model = useContext(SwarmModelContext);
  if (!model) {
    throw new Error("useProjects must be used within a SwarmModelProvider");
  } else return model;
}

export function SwarmModelProvider({
  children,
  swarm,
  createTopic,
}: PropsWithChildren<{ swarm: SwarmI; createTopic: CreateTopic }>) {
  const model = useSwarmModel({ swarm, createTopic });
  return <SwarmModelContext.Provider value={model} children={children} />;
}

export type CreateTopic = () => string;

export type SwarmMessage = {
  type: string,
  payload: Object
}

export interface SwarmModel {
  createTopic: CreateTopic;
  topic: string | null;
  setTopic: (topic: string | null) => void;
  peerCount: number;
  joinTopic: (topic: string) => Promise<void>;
  isJoining: boolean;
  sendAll: (data: SwarmMessage) => void;
  send: (to: string, data: SwarmMessage) => void;
  setPeerCount: (count: number) => void;
  swarm: SwarmI;
}

function useSwarmModel({
  swarm,
  createTopic,
}: {
  swarm: SwarmI;
  createTopic: CreateTopic;
}): SwarmModel {
  const [topic, setTopic] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const [isJoining, setIsJoining] = useState(false);

  async function joinTopic(topic: string) {
    setIsJoining(true);
    await swarm.join(topic);
    setIsJoining(false);
    setTopic(topic);
  }

  function sendAll(data: SwarmMessage) {
    swarm.sendAll(JSON.stringify(data));
  }

  function send(to: string, data: SwarmMessage) {
    swarm.send(to, JSON.stringify(data))
  }

  return {
    topic,
    setTopic,
    createTopic,
    peerCount,
    joinTopic,
    isJoining,
    sendAll,
    send,
    setPeerCount,
    swarm,
  };
}
