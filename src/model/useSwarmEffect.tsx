import { useEffect } from "react";
import { useSwarm } from "./useSwarm";
import { useProjects } from "./useProjects";
import { Project } from "../types/project-types";
import { PeerData } from "../types/swarm-types";


export function useSwarmEffect() {
  const { swarmRef, setPeerCount, send, sendAll, topic, joinTopic } = useSwarm();
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
    swarmRef.current.onPeerConnected((peer) => {
      if (currentProject && topic && currentProject.topic == topic) {
        send(peer.pubKey, {
          type: "share-project",
          payload: { project: currentProject, tasks },
        });
      }
    });
  }, [currentProject, topic]);

  useEffect(() => {
    swarmRef.current.onConnectionsUpdate((connections) => {
      setPeerCount(connections.size);
    });

    swarmRef.current.onPeerData((peer, data) => {
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

    eventsRef.current.on("task-update", (task) => {
      sendAll({ type: "task-update", payload: task });
    });

    eventsRef.current.on("task-delete", (taskId) => {
      sendAll({ type: "task-delete", payload: taskId });
    });

    eventsRef.current.on("task-add", (task) => {
      sendAll({ type: "task-add", payload: task });
    });

    eventsRef.current.on("project-selected", async (project: Project) => {
      if (project.topic) {
        await joinTopic(project.topic);
      }
    })
  }, []);
}
