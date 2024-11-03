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
  topic: string | null;
  setTopic: (topic: string | null) => void;
  peerCount: number;
  joinTopic: (topic: string) => Promise<void>;
  isJoining: boolean;
  sendAll: (data: SwarmMessage) => void;
  send: (to: string, data: SwarmMessage) => void;
  setPeerCount: (count: number) => void;
  swarmRef: MutableRefObject<SwarmI>;
}

interface UseSwarmModelProps {
  createSwarm: CreateSwarm;
  createTopic: CreateTopic;
}

function useSwarmModel({
  createSwarm,
  createTopic,
}: UseSwarmModelProps): SwarmModel {
  const [topic, setTopic] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const swarmRef = useRef(createSwarm());

  async function joinTopic(topic: string) {
    setIsJoining(true);
    await swarmRef.current.join(topic);
    setIsJoining(false);
    setTopic(topic);
  }

  function sendAll(data: SwarmMessage) {
    swarmRef.current.sendAll(JSON.stringify(data));
  }

  function send(to: string, data: SwarmMessage) {
    swarmRef.current.send(to, JSON.stringify(data));
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
    swarmRef,
  };
}
