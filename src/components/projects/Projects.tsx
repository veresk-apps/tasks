import React from "react";
import { Tasks } from "../tasks/Tasks";
import { ProjectsModelProvider } from "../../model/useProjects";
import { ProjectCreator } from "./ProjectCreator";
import { ProjectTabs } from "./ProjectTabs";
import { Persist } from "../../types/persist-types";
import {
  CreateSwarm,
  CreateTopic,
  SwarmModelProvider,
  useSwarm,
} from "../../model/useSwarm";
import { ModalLike } from "../common/ModalLike";

interface Props {
  persist: Persist;
  createSwarm: CreateSwarm;
  createTopic: CreateTopic;
}

export function Projects({ persist, createSwarm, createTopic }: Props) {
  return (
    <ProjectsModelProvider persist={persist}>
      <SwarmModelProvider createSwarm={createSwarm} createTopic={createTopic}>
        <div className="grid grid-cols-12">
          <div className="col-span-3">
            <ProjectCreator />
            <ProjectTabs />
            <ProjectJoiner />
          </div>
          <div className="col-span-9">
            <Tasks />
          </div>
        </div>
      </SwarmModelProvider>
    </ProjectsModelProvider>
  );
}

function ProjectJoiner() {
  const { joinTopic } = useSwarm();
  return (
    <ModalLike
      mainLabel="Join project"
      secondaryLabel="Join topic"
      inputLabel="Topic"
      onSubmit={joinTopic}
    />
  );
}

