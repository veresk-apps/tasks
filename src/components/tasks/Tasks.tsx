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
  const { joinTopic, createTopic, peerCount, topic, isJoining } = useSwarm();
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
        {topic && topic == currentProject?.topic && (
          <>
            <p>{topic}</p>
            <p>Peers: {peerCount}</p>
          </>
        )}
        {isJoining && <p>Joining swarm...</p>}
      </>
    )
  );
}
