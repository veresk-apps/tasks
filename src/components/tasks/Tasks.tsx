import React from "react";
import { TaskList } from "./TaskList";
import { useProjects } from "../../model/useProjects";
import { TaskCreator } from "./TaskCreator";
import { TasksTitle } from "./TasksTitle";
import { Button } from "../common/Button";
import { useSwarm } from "../../model/useSwarm";
import { useSwarmEffect } from "../../model/useSwarmEffect";

export function Tasks() {
  const {
    currentProject,
    setCurrentProjectId,
    removeProject,
    setProjectTopic
  } = useProjects();
  const { joinTopic, createTopic } = useSwarm();
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
            setCurrentProjectId(null);
          }}
        >
          Delete project
        </Button>
        {!currentProject.topic ? (
          <Button
            onClick={async () => {
              const topic = createTopic();
              await joinTopic(topic);
              setProjectTopic(currentProject.id, topic);
            }}
          >
            Share project
          </Button>
        ) : (
          <p>{currentProject.topic}</p>
        )}
      </>
    )
  );
}
