import React from "react";
import { useProjects } from "../../model/useProjects";
import clsx from "clsx";
import { useSwarmEffect } from "../../model/useSwarmEffect";

export function ProjectTabs() {
  const { projects, currentProject, selectProject } = useProjects();
  useSwarmEffect();
  return (
    <ul role="tablist" className="m-3">
      {projects.map((project, index) => (
        <li
          role="tab"
          className={clsx("cursor-pointer", {
            "font-bold": project.id == currentProject?.id,
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
