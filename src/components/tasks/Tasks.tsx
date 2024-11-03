import React from "react";
import { TaskList } from "./TaskList";
import { useProjects } from "../../model/useProjects";
import { TaskCreator } from "./TaskCreator";
import { TasksTitle } from "./TasksTitle";
import { Button } from "../common/Button";
import { useSwarm } from "../../model/useSwarm";
import { useSwarmEffect } from "../../model/useSwarmEffect";

export function Tasks() {
  const { currentProject, removeProject, setProjectTopic } = useProjects();
  const {
    joinTopic,
    leaveTopic,
    reconnectTopic,
    createTopic,
    peerCounts,
    isJoining,
    connectedTopics,
  } = useSwarm();
  useSwarmEffect();

  return (
    currentProject && (
      <>
        <TasksTitle />
        <TaskList />
        <TaskCreator />
        <Button
          className="text-sm"
          onClick={() => {
            removeProject(currentProject.id);
          }}
        >
          Delete project
        </Button>
        {!currentProject.topic && (
          <Button
            onClick={async () => {
              const topic = createTopic();
              await joinTopic(topic);
              setProjectTopic(currentProject.id, topic);
            }}
          >
            Share project
          </Button>
        )}
        {currentProject.topic && <p>{currentProject.topic}</p>}
        {currentProject.topic && connectedTopics.has(currentProject.topic) && (
          <>
            <p>Peers: {peerCounts[currentProject.topic] ?? 0}</p>
            <Button onClick={() => leaveTopic(currentProject.topic!)}>
              Disconnect
            </Button>
          </>
        )}
        {currentProject.topic && !connectedTopics.has(currentProject.topic) && (
          <Button onClick={() => reconnectTopic(currentProject.topic!)}>
            Connect again
          </Button>
        )}
        {isJoining && <p>Joining swarm...</p>}
      </>
    )
  );
}
