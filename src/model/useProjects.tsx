import React, {
  createContext,
  MutableRefObject,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Task } from "../types/task-types";
import { Project } from "../types/project-types";
import { randomStringOfNumbers } from "../utils/random";
import { Persist } from "../types/persist-types";
import { EventEmitter } from "events";

export function useProjects(): ProjectsModel {
  const model = useContext(ProjectsModelContext);
  if (!model) {
    throw new Error("useProjects must be used within a ProjectsModelProvider");
  } else return model;
}

export function ProjectsModelProvider({
  children,
  persist,
}: PropsWithChildren<{ persist: Persist }>) {
  const model = useProjectsModel({ persist });
  return <ProjectsModelContext.Provider value={model} children={children} />;
}

const ProjectsModelContext = createContext<ProjectsModel | null>(null);

type TaskUpdater = (task: Task) => Partial<Omit<Task, "id" | "projectId">>;

export interface ProjectsModel {
  tasks: Array<Task>;
  addTask: (
    partialTask: { text: string; projectId: string; id?: string },
    emit?: boolean
  ) => void;
  editTask: (taskId: string, text: string) => void;
  removeTask: (taskId: string, emit?: boolean) => void;
  toggleTaskCompleted: (taskId: string) => void;
  projects: Array<Project>;
  currentProject: Project | null;
  addNewProject: (name: string) => void;
  removeProject: (projectId: string) => void;
  setProjectTopic: (projectId: string, topic: string) => void;
  addSharedProject: (project: Project, task: Task[]) => void;
  eventsRef: MutableRefObject<EventEmitter>;
  updateTask: (taskId: string, updater: TaskUpdater, emit?: boolean) => void;
  selectProject: (project: Project) => void;
}

function useProjectsModel({ persist }: { persist: Persist }): ProjectsModel {
  const [tasks, setTasks] = useState<Array<Task>>([]);
  const [projects, setProjects] = useState<Array<Project>>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const currentProject = useMemo(
    () => projects.find((propject) => propject.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  const eventsRef = useRef(new EventEmitter());

  const { setProjectsPersist, setTasksPersist } = usePersistance({
    persist,
    setProjects,
    setTasks,
    onStateLoaded({ projects }) {
      if (projects[0]) {
        eventsRef.current.emit("project-selected", projects[0]);
        setCurrentProjectId(projects[0].id);
      }
    },
  });

  const addTask = useCallback(
    (
      {
        text,
        projectId,
        id,
      }: { text: string; projectId: string; id?: string;},
      emit = true
    ) => {
      const task = createNewTask({ text, projectId, id });
      currentProject &&
        setTasksPersist((tasks) => [
          ...tasks,
          { ...task, owner: currentProject.owner },
        ]);
      emit && eventsRef.current.emit("task-add", currentProject, task);
    },
    [currentProject]
  );

  function editTask(taskId: string, text: string) {
    updateTask(taskId, () => ({ text }));
  }

  const removeTask = useCallback(
    (taskId: string, emit: boolean = true) => {
      setTasksPersist((tasks) => tasks.filter((task) => task.id != taskId));
      emit && eventsRef.current.emit("task-delete", currentProject, taskId);
    },
    [currentProject]
  );

  function toggleTaskCompleted(taskId: string) {
    updateTask(taskId, (task) => ({ completed: !task.completed }));
  }

  const updateTask = useCallback(
    (taskId: string, updater: TaskUpdater, emit: boolean = true) => {
      setTasksPersist((tasks) =>
        tasks.map((task) => {
          if (task.id == taskId) {
            const updatedTask = {
              ...task,
              ...updater(task),
            };
            emit &&
              eventsRef.current.emit(
                "task-update",
                currentProject,
                updatedTask
              );
            return updatedTask;
          } else {
            return task;
          }
        })
      );
    },
    [currentProject]
  );

  function addNewProject(projectName: string) {
    const project = createNewProject(projectName);
    addProject(project);
    setCurrentProjectId(project.id);
    eventsRef.current.emit("project-selected", project);
  }

  function addProject(project: Project) {
    setProjectsPersist((projects) => [project, ...projects]);
  }

  function removeProject(projectId: string) {
    setProjectsPersist((projects) =>
      projects.filter((project) => project.id != projectId)
    );
    setCurrentProjectId(null);
  }

  function updateProject(
    projectId: string,
    updater: (project: Project) => Partial<Project>
  ) {
    setProjectsPersist((projects) =>
      projects.map((project) =>
        project.id == projectId ? { ...project, ...updater(project) } : project
      )
    );
  }

  function setProjectTopic(projectId: string, topic: string) {
    updateProject(projectId, () => ({ topic }));
  }

  function addSharedProject(project: Project, tasks: Task[]) {
    setProjectsPersist((projects) => [
      ...intersectionLeftById(projects, [project]),
      project,
    ]);
    setTasksPersist((tasksBefore) => [
      ...intersectionLeftById(tasksBefore, tasks),
      ...tasks,
    ]);
  }

  function selectProject(project: Project) {
    setCurrentProjectId(project.id);
    eventsRef.current.emit("project-selected", project);
  }

  return {
    tasks: tasks.filter((task) => task.projectId == currentProject?.id),
    addTask,
    editTask,
    removeTask,
    toggleTaskCompleted,
    projects,
    currentProject,
    addNewProject,
    addSharedProject,
    removeProject,
    setProjectTopic,
    eventsRef,
    updateTask,
    selectProject,
  };
}

function usePersistance({
  persist,
  setProjects,
  setTasks,
  onStateLoaded,
}: {
  persist: Persist;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onStateLoaded: ({
    projects,
    tasks,
  }: {
    projects: Project[];
    tasks: Task[];
  }) => void;
}) {
  useEffect(() => {
    loadState().then(onStateLoaded);
  }, []);

  async function loadState() {
    const projects = await persist.getParsed<Project[]>("projects", []);
    const tasks = await persist.getParsed<Task[]>("tasks", []);

    setProjects(projects);
    setTasks(tasks);
    return { projects, tasks };
  }

  return {
    setProjectsPersist: (updater: (projects: Project[]) => Project[]) => {
      setProjects((projects) => {
        const updated = updater(projects);
        persist
          .set(
            "projects",
            JSON.stringify(updated.filter(({ owner }) => owner == "me"))
          )
          .catch(console.error);
        return updated;
      });
    },
    setTasksPersist: (updater: (tasks: Task[]) => Task[]) => {
      setTasks((tasks) => {
        const updated = updater(tasks);
        persist
          .set(
            "tasks",
            JSON.stringify(updated.filter(({ owner }) => owner == "me"))
          )
          .catch(console.error);
        return updated;
      });
    },
  };
}

export function createNewTask({
  text,
  projectId,
  id = randomStringOfNumbers(),
  owner = "me",
}: {
  text: string;
  projectId: string;
  id?: string;
  owner?: string;
}): Task {
  return { text, id, projectId, completed: false, owner };
}

export function createNewProject(name: string): Project {
  return {
    name,
    id: randomStringOfNumbers(),
    topic: null,
    owner: "me",
  };
}

type IdTrait = { id: string };
function intersectionLeftById<A extends IdTrait, B extends IdTrait>(
  itemsA: Array<A>,
  itemsB: Array<B>
) {
  return itemsA.filter(
    (itemA) => !itemsB.find((itemB) => itemA.id == itemB.id)
  );
}
