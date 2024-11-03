import React, { useEffect, useState } from "react";
import { Swarm } from "../../types/swarm-types";
import { isValidTopic } from "../../backend/swarm";
import { Message } from "../../types/communication-types";
import { Button } from "../common/Button";

interface Props {
  swarm: Swarm;
  createTopic: () => string;
}

export function Chat({ swarm, createTopic }: Props) {
  const [topic, setTopic] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    swarm.onConnectionsUpdate((connections) => {
      setPeerCount(connections.size);
    });

    swarm.onPeerData((peer, data) => {
      addMessage(data, peer.pubKey.slice(0, 4));
    });
  }, []);

  function addMessage(text: string, from: string) {
    setMessages((messages) => [...messages, { text, from }]);
  }

  return (
    <div>
      {!topic ? (
        <StartPanel
          onTopic={async (topic) => {
            setIsJoining(true);
            await swarm.join(topic);
            setIsJoining(false)
            setTopic(topic);
          }}
          createTopic={createTopic}
          isJoining={isJoining}
        />
      ) : (
        <>
          <p>{topic}</p>
          <p>Peers: {peerCount}</p>
          <div className="h-24 overflow-y-auto text-wrap">
            {messages.map((message, idx) => (
              <p key={message.text + idx}>
                {`${message.from}: ${message.text}`}
              </p>
            ))}
          </div>
          <MessageEditor
            onSubmit={(message) => {
              addMessage(message, "me");
              swarm.sendAll(message);
            }}
          />
        </>
      )}
    </div>
  );
}

function StartPanel({
  onTopic,
  createTopic,
  isJoining,
}: {
  onTopic: (topic: string) => void;
  createTopic: () => string;
  isJoining: boolean;
}) {
  const [showTopicForm, setShowTopicForm] = useState(false);

  return (
    <div>
      <Button
        className="mx-2 disabled:border-gray-500 disabled:text-gray-500"
        onClick={async () => {
          onTopic(createTopic());
        }}
        disabled={isJoining}
      >
        Start Chat
      </Button>
      <Button
        className="disabled:border-gray-500 disabled:text-gray-500"
        onClick={() => setShowTopicForm(true)}
        disabled={isJoining}
      >
        Join Chat
      </Button>
      {showTopicForm && <TopicEditor onSubmit={onTopic} />}
    </div>
  );
}

function TopicEditor({ onSubmit }: { onSubmit: (topic: string) => void }) {
  const [topicDraft, setTopicDraft] = useState("");
  const [topicError, setTopicError] = useState("");

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!isValidTopic(topicDraft)) {
          setTopicError("invalid topic");
        } else {
          onSubmit(topicDraft);
        }
      }}
    >
      <label htmlFor="topic-input">Topic</label>
      <input
        id="topic-input"
        className="border-2 border-black rounded-md p-1 mx-1"
        autoFocus
        value={topicDraft}
        onChange={(event) => {
          setTopicDraft(event.target.value);
        }}
      />
      <Button type="submit">Join</Button>
      {Boolean(topicError) && <p>{topicError}</p>}
    </form>
  );
}

function MessageEditor({ onSubmit }: { onSubmit: (message: string) => void }) {
  const [message, setMessage] = useState("");

  return (
    <form
      className="flex"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(message);
        setMessage("");
      }}
    >
      <label htmlFor="message-input" className="hidden">
        Message
      </label>
      <input
        className="flex-auto border-2 border-black rounded-md p-1"
        id="message-input"
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
        }}
      />
      <Button type="submit" className="mx-1 text-blue-700">
        Send
      </Button>
    </form>
  );
}