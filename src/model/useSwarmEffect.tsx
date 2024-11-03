import { useEffect } from "react";
import { useSwarm } from "./useSwarm";
import { useProjects } from "./useProjects";
import { Project } from "../types/project-types";
import { PeerData } from "../types/swarm-types";

export function useSwarmEffect() {
  const { swarmsRef, setPeerCount, send, sendAll, topic, joinTopic } =
    useSwarm();
  const {
    currentProject,
    tasks,
    addSharedProject,
    selectProject,
    eventsRef,
    updateTask,
    removeTask,
    addTask,
  } = useProjects();

  useEffect(() => {
    const swarm = topic && swarmsRef.current[topic];
    swarm &&
      swarm.onPeerConnected((peer) => {
        if (currentProject && topic && currentProject.topic == topic) {
          send(currentProject.topic, peer.pubKey, {
            type: "share-project",
            payload: { project: currentProject, tasks },
          });
        }
      });
  }, [currentProject, topic]);

  useEffect(() => {
    const swarm = topic && swarmsRef.current[topic];
    if (swarm) {
      swarm.onConnectionsUpdate((connections) => {
        setPeerCount(connections.size);
      });

      swarm.onPeerData((peer, data) => {
        const { type, payload }: PeerData = JSON.parse(data);

        switch (type) {
          case "share-project":
            addSharedProject(payload.project, payload.tasks);
            selectProject(payload.project);
            break;
          case "task-update":
            updateTask(
              payload.id,
              () => ({
                text: payload.text,
                completed: payload.completed,
              }),
              false
            );
            break;
          case "task-delete":
            removeTask(payload, false);
            break;
          case "task-add":
            addTask(payload, false);
            break;
          default:
            console.error("unknown swarm message type", type, payload);
        }
      });
    }
  }, [topic]);

  useEffect(() => {
    eventsRef.current.on("task-update", (project, task) => {
      project.topic &&
        sendAll(project.topic, { type: "task-update", payload: task });
    });

    eventsRef.current.on("task-delete", (project, taskId) => {
      project.topic &&
        sendAll(project.topic, { type: "task-delete", payload: taskId });
    });

    eventsRef.current.on("task-add", (project, task) => {
      project.topic &&
        sendAll(project.topic, { type: "task-add", payload: task });
    });

    eventsRef.current.on("project-selected", async (project: Project) => {
      if (project.topic) {
        await joinTopic(project.topic);
      }
    });
  }, []);
}
