import React from "react";
import { Projects } from "../projects/Projects";
import { Persist } from "../../utils/persist";
import { createTopic, createSwarm } from "../../backend/swarm";

const persist = new Persist();

export function App() {
  return (
    <Projects persist={persist} createTopic={createTopic} createSwarm={createSwarm} />
  );
}
