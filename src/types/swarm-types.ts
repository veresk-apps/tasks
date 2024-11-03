import { Project } from "./project-types";
import { Task } from "./task-types";

export interface Swarm {
  join: (topic: string) => Promise<void>;
  leave: (topic: string) => Promise<void>;
  sendAll: (message: string) => void;
  send: (to: string, message: string) => void;
  onConnectionsUpdate: (cb: (connections: Set<Peer>) => void) => void;
  onPeerData: (cb: (peer: Peer, data: string) => void) => void;
  onPeerConnected: (cb: (peer: Peer) => void) => void;
}

export interface PeerHyperswarm {
  remotePublicKey: Buffer;
  write: (data: Buffer) => void;
}

export interface Peer {
  pubKey: string;
}

export type PeerData =
  | {
      type: "share-project";
      payload: { project: Project; tasks: Task[] };
    }
  | { type: "task-update"; payload: Task }
  | { type: "task-delete"; payload: string }
  | { type: "task-add"; payload: Task };
