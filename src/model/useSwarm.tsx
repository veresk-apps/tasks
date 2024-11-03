import React, {
  createContext,
  MutableRefObject,
  PropsWithChildren,
  useContext,
  useRef,
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

type SwamrModelProviderProps = PropsWithChildren<{
  createTopic: CreateTopic;
  createSwarm: CreateSwarm;
}>;

export function SwarmModelProvider({
  children,
  createTopic,
  createSwarm,
}: SwamrModelProviderProps) {
  const model = useSwarmModel({ createSwarm, createTopic });
  return <SwarmModelContext.Provider value={model} children={children} />;
}

export type CreateTopic = () => string;

export type CreateSwarm = () => SwarmI;

export type SwarmMessage = {
  type: string;
  payload: Object;
};

export interface SwarmModel {
  createTopic: CreateTopic;
  peerCount: number;
  joinTopic: (topic: string) => Promise<void>;
  isJoining: boolean;
  sendAll: (topic: string, data: SwarmMessage) => void;
  send: (topic: string, to: string, data: SwarmMessage) => void;
  setPeerCount: (count: number) => void;
  swarmsRef: MutableRefObject<Map<string, SwarmI>>;
  connectedTopics: Set<string>;
}

interface UseSwarmModelProps {
  createSwarm: CreateSwarm;
  createTopic: CreateTopic;
}

function useSwarmModel({
  createSwarm,
  createTopic,
}: UseSwarmModelProps): SwarmModel {
  const [connectedTopics, setConnectedTopics] = useState<Set<string>>(new Set);
  const [peerCount, setPeerCount] = useState(0);
  const [isJoining, setIsJoining] = useState(false);

  const swarmsRef = useRef<Map<string, SwarmI>>(new Map());

  function addConnectedTopic(topic: string) {
    setConnectedTopics(topics => new Set([...topics, topic]))
  }

  async function joinTopic(topic: string) {
    if (!swarmsRef.current.get(topic)) {
      const swarm = createSwarm();
      swarmsRef.current.set(topic, swarm)
      setIsJoining(true);
      await swarm.join(topic);
      setIsJoining(false);
      addConnectedTopic(topic);
    }
  }

  function sendAll(topic: string, data: SwarmMessage) {
    const swarm = swarmsRef.current.get(topic);
    swarm && swarm.sendAll(JSON.stringify(data));
  }

  function send(topic: string, to: string, data: SwarmMessage) {
    const swarm = swarmsRef.current.get(topic);
    swarm && swarm.send(to, JSON.stringify(data));
  }

  return {
    createTopic,
    peerCount,
    joinTopic,
    isJoining,
    sendAll,
    send,
    setPeerCount,
    swarmsRef,
    connectedTopics
  };
}
