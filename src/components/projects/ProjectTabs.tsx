import React from "react";
import { useProjects } from "../../model/useProjects";
import clsx from "clsx";
import { useSwarm } from "../../model/useSwarm";

export function ProjectTabs() {
  const { projects, currentProject, selectProject } = useProjects();
  const { connectedTopics } = useSwarm();
  return (
    <ul role="tablist" className="m-3">
      {projects.map((project, index) => (
        <li
          role="tab"
          className={clsx("cursor-pointer", {
            "font-bold": project.id == currentProject?.id,
            "text-blue-600": connectedTopics.has(project.topic ?? "")
          })}
          onClick={() => selectProject(project)}
          key={project.name + index}
        >
          {project.name}
        </li>
      ))}
    </ul>
  );
}
