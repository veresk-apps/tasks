import { useEffect, useRef } from "react";
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
    if (topic && currentProject) {
      const swarm = swarmsRef.current.get(topic);
      
      swarm &&
        swarm.onPeerConnected((peer) => {
          send(topic, peer.pubKey, {
            type: "share-project",
            payload: { project: currentProject, tasks },
          });
        });
    }
  }, [topic, currentProject]);

  const regsRefs = useRef(new Set());

  useEffect(() => {
    const unregisteredTopicSwarmPairs = [...swarmsRef.current.entries()].filter(
      ([topic]) => !regsRefs.current.has(topic)
    );
    for (const [topic, swarm] of unregisteredTopicSwarmPairs) {
      regsRefs.current.add(topic);

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
