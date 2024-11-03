import React from "react";
import { useProjects } from "../../model/useProjects";
import clsx from "clsx";
import { useSwarm } from "../../model/useSwarm";

export function ProjectTabs() {
  const { projects, currentProject, selectProject } = useProjects();
  const { connectedTopics } = useSwarm();

  const ownProjects = projects.filter((project) => project.owner == "me");
  const sharedProjects = projects.filter((project) => project.owner != "me");

  return (
    <ul role="tablist" className="m-3">
      {ownProjects.map((project, index) => (
        <ProjectTab
          title={project.name}
          isSelected={project.id == currentProject?.id}
          isHighlightened={connectedTopics.has(project.topic ?? "")}
          onClick={() => selectProject(project)}
          key={project.name + index}
        />
      ))}
      {ownProjects.length > 0 && sharedProjects.length > 0 && <p>---</p>}
      {sharedProjects.map((project, index) => (
        <ProjectTab
          title={project.name}
          isSelected={project.id == currentProject?.id}
          isHighlightened={connectedTopics.has(project.topic ?? "")}
          onClick={() => selectProject(project)}
          key={project.name + index}
        />
      ))}
    </ul>
  );
}

interface ProjectTabProps {
  title: string;
  onClick: () => void;
  isSelected: boolean;
  isHighlightened: boolean;
}

function ProjectTab({
  title,
  onClick,
  isSelected,
  isHighlightened,
}: ProjectTabProps) {
  return (
    <li
      role="tab"
      className={clsx("cursor-pointer", {
        "font-bold": isSelected,
        "text-blue-600": isHighlightened,
      })}
      onClick={onClick}
    >
      {title}
    </li>
  );
}
