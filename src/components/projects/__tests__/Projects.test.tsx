import {
  render,
  screen,
  within,
  act,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { Projects } from "../Projects";
import {
  addProjects,
  addTasks,
  hasClass,
  joinTopic,
  mockTopicHex,
  PersistMock,
  SwarmMock,
} from "../../../utils/testing";
import { createNewProject, createNewTask } from "../../../model/useProjects";
import { Persist } from "../../../types/persist-types";
import { createTopic as originalCreateTopic } from "../../../backend/swarm";
import { CreateTopic } from "../../../model/useSwarm";
import { Swarm } from "../../../types/swarm-types";
import { Project } from "../../../types/project-types";
import { Task } from "../../../types/task-types";

function renderProjects({
  persist = new PersistMock(),
  createTopic = originalCreateTopic,
  createSwarm = () => new SwarmMock(),
}: {
  persist?: Persist;
  createTopic?: CreateTopic;
  swarm?: Swarm;
  createSwarm?: () => Swarm;
} = {}) {
  render(
    <Projects
      persist={persist}
      createSwarm={createSwarm}
      createTopic={createTopic}
    />
  );
}

describe("Projects", () => {
  it("should not create a project with empty name", async () => {
    renderProjects();
    const projects = await screen.findByRole("tablist");
    await userEvent.click(screen.getByText("New project"));
    await userEvent.click(screen.getByText("Create"));

    expect(projects.children).toHaveLength(0);
  });

  it("should have create form appear after new project button is clicked", async () => {
    renderProjects();
    expect(screen.queryByRole("form")).toBeNull();
    expect(screen.queryByLabelText("Project name")).toBeNull();
    expect(screen.queryByText("Create")).toBeNull();

    await userEvent.click(screen.getByText("New project"));
    expect(screen.queryByRole("form")).toBeTruthy();
    expect(screen.queryByLabelText("Project name")).toBeTruthy();
    expect(screen.queryByText("Create")).toBeTruthy();
  });

  it("should focus on input after clicking new project", async () => {
    renderProjects();
    await userEvent.click(screen.getByText("New project"));
    expect(screen.queryByLabelText("Project name")).toBe(
      document.activeElement
    );
  });

  it("should hide project creating form after clicking create", async () => {
    renderProjects();
    await userEvent.click(screen.getByText("New project"));
    expect(screen.queryByRole("form")).toBeTruthy();
    await userEvent.keyboard("my project {Enter}");
    expect(screen.queryByRole("form")).toBeNull();
  });

  it("should add one project to the list of projects", async () => {
    renderProjects();
    const projects = await screen.findByRole("tablist");

    await addProjects(["Veresk"]);
    expect(projects.children).toHaveLength(1);
    expect(projects.children[0].textContent).toBe("Veresk");
  });

  it("should add one project to the list of by clicking Create button", async () => {
    renderProjects();
    const projects = await screen.findByRole("tablist");

    await userEvent.click(screen.getByText("New project"));
    await userEvent.type(screen.getByLabelText("Project name"), "Project 1");
    await userEvent.click(screen.getByText("Create"));
    expect(projects.children).toHaveLength(1);
    expect(projects.children[0].textContent).toBe("Project 1");
  });

  it("should add two projects to the list of projects", async () => {
    renderProjects();
    const projects = await screen.findByRole("tablist");

    await addProjects(["Veresk", "Candy"]);
    expect(projects.children).toHaveLength(2);
    expect(projects.children[0].textContent).toBe("Candy");
    expect(projects.children[1].textContent).toBe("Veresk");
  });

  it("should select project by clicking", async () => {
    renderProjects();
    await addProjects(["Veresk", "Candy"]);
    const projects = await screen.findByRole("tablist");

    expect(hasClass(within(projects).getByText("Candy"), "font-bold")).toBe(
      true
    );
    await userEvent.click(screen.getByText("Veresk"));
    expect(hasClass(within(projects).getByText("Veresk"), "font-bold")).toBe(
      true
    );
    expect(hasClass(within(projects).getByText("Candy"), "font-bold")).toBe(
      false
    );
  });

  it("should not rely on project name as uniq identificator", async () => {
    renderProjects();
    await addProjects(["Metoo", "Metoo"]);

    const [first, second] = screen.getAllByText("Metoo");
    await userEvent.click(second);
    expect(hasClass(first, "font-bold")).toBe(false);
    expect(hasClass(second, "font-bold")).toBe(true);
  });

  it("should display project tasks after the project was created", async () => {
    renderProjects();
    expect(screen.queryByRole("heading", { level: 2 })).toBe(null);
    await addProjects(["Veresk"]);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("Veresk");
  });

  it("should save tasks inside the project", async () => {
    renderProjects();
    await addProjects(["Veresk", "Candy"]);
    await addTasks(["Candy task"]);

    await userEvent.click(getProjectTab("Veresk"));
    await addTasks(["Veresk task"]);

    await userEvent.click(getProjectTab("Candy"));
    expect(screen.queryByText("Candy task")).not.toBeNull();
    expect(screen.queryByText("Veresk task")).toBeNull();

    await userEvent.click(getProjectTab("Veresk"));
    expect(screen.queryByText("Candy task")).toBeNull();
    expect(screen.queryByText("Veresk task")).not.toBeNull();
  });

  it("should be able to complete task in one of the projects", async () => {
    renderProjects();
    await addProjects(["Veresk", "Candy"]);
    await addTasks(["Candy task"]);

    await userEvent.click(getProjectTab("Veresk"));
    await addTasks(["Veresk task"]);

    await userEvent.click(screen.getByText("Veresk task"));

    expect(hasClass(screen.getByText("Veresk task"), "line-through"));
  });

  it("should be able to delete task in one of the projects", async () => {
    renderProjects();
    await addProjects(["Veresk", "Candy"]);
    await addTasks(["Candy task"]);

    await userEvent.click(getProjectTab("Veresk"));
    await addTasks(["Veresk task"]);

    await userEvent.click(screen.getByText("Delete"));

    expect(screen.queryByText("Veresk task")).toBeNull();
  });

  it("should be able to delete the project", async () => {
    renderProjects();
    await addProjects(["Veresk"]);
    await userEvent.click(screen.getByText("Delete project"));
    expect(screen.queryAllByText("Veresk")).toHaveLength(0);
  });

  describe("persistance", () => {
    it("should init state from the persistence store", async () => {
      const project = createNewProject("Veresk");
      const persist = new PersistMock({
        projects: JSON.stringify([project]),
        tasks: JSON.stringify([
          createNewTask({ text: "task 1", projectId: project.id }),
          createNewTask({ text: "task 2", projectId: project.id }),
        ]),
      });
      renderProjects({ persist });

      expect(await findProjectTab("Veresk")).not.toBeNull();
      expect(await screen.findByText("task 1")).not.toBeNull();
      expect(await screen.findByText("task 2")).not.toBeNull();
    });

    it("should save state in the persistance state", async () => {
      const persist = new PersistMock();
      renderProjects({ persist });
      await addProjects(["Veresk"]);
      await addTasks(["task 1"]);

      expect(await persist.get("projects")).toBeTruthy();
      expect(await persist.get("tasks")).toBeTruthy();

      const persistedProjects = JSON.parse(await persist.get("projects"));
      expect(persistedProjects[0].name).toEqual("Veresk");
      const persistedTasks = JSON.parse(await persist.get("tasks"));
      expect(persistedTasks[0].text).toEqual("task 1");
    });

    it("should save projects in the persistance state after init", async () => {
      const persist = new PersistMock({
        projects: JSON.stringify([createNewProject("Veresk")]),
      });
      renderProjects({ persist });
      await addProjects(["Candy"]);
      const persistedProjects = JSON.parse(await persist.get("projects"));
      expect(persistedProjects[0].name).toEqual("Candy");
      expect(persistedProjects[1].name).toEqual("Veresk");
    });

    it("should not persist alian projects", async () => {
      const persist = new PersistMock();
      const swarm = new SwarmMock();
      renderProjects({ persist, createSwarm: () => swarm });

      const project = getProjectMock("Alian", "projid", mockTopicHex("a"));
      const tasks = [getTaskMock("alian task 1", "taskid", "projid", "other")];
      await addSharedProject(project, tasks, swarm);
      await addTasks(["my ephemeral task"]);

      const persistedProjects = await persist.getParsed("projects", []);
      const persistedTasks = await persist.getParsed("tasks", []);
      expect(persistedProjects).toHaveLength(0);
      expect(persistedTasks).toHaveLength(0);
    });
  });

  describe("share", () => {
    it("should have share project button", async () => {
      renderProjects();
      await addProjects(["Veresk"]);
      screen.getByText("Share project");
    });
    it("should dispaly topic after clicking Share project button", async () => {
      const topic = mockTopicHex("a");
      renderProjects({ createTopic: () => topic });
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));
      await screen.findByText(topic);
    });
    it("should not show display button if project is already shared", async () => {
      const topic = mockTopicHex("a");
      const persist = new PersistMock({
        projects: JSON.stringify([{ ...createNewProject("Veresk"), topic }]),
      });
      renderProjects({ persist });
      await expect(
        screen.findByText("Share project").catch(() => "not found")
      ).resolves.toBe("not found");
    });
    it("should show topic if project is already shared", async () => {
      const topic = mockTopicHex("a");
      const project = { ...createNewProject("Veresk"), topic };
      const persist = new PersistMock({
        projects: JSON.stringify([project]),
      });
      renderProjects({ persist });
      await screen.findByText(topic);
    });
    it("should join topic automatically if the project is already shared", async () => {
      const topic = mockTopicHex("a");
      const project = { ...createNewProject("Veresk"), topic };
      const persist = new PersistMock({
        projects: JSON.stringify([project]),
      });
      const swarm = new SwarmMock();
      renderProjects({ persist, createSwarm: () => swarm });
      await screen.findByText(topic);
      expect(swarm.join).toHaveBeenCalled();
    });
    it("should assign swarm topic to a project", async () => {
      const topic = mockTopicHex("a");
      const persist = new PersistMock();
      renderProjects({ persist, createTopic: () => topic });
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));
      const persistedProject = JSON.parse(await persist.get("projects"))[0];
      expect(persistedProject.topic).toBe(topic);
    });
  });

  describe("join", () => {
    it("should have join project button", async () => {
      renderProjects();
      await screen.findByText("Join project");
    });
    it("should show input after clicking", async () => {
      renderProjects();
      await userEvent.click(screen.getByText("Join project"));
      screen.getByLabelText("Topic");
    });
    it("should join swarm on submit", async () => {
      const swarm = new SwarmMock();
      renderProjects({ createSwarm: () => swarm });
      await userEvent.click(screen.getByText("Join project"));
      const topic = mockTopicHex("a");
      await userEvent.keyboard(`${topic}{Enter}`);
      expect(swarm.join).toHaveBeenCalledWith(topic);
    });
    it("should close form after submit and clear the form", async () => {
      renderProjects();
      const topic = mockTopicHex("a");
      await joinTopic(topic);

      expect(screen.queryByText("Topic")).toBeNull();
      await userEvent.click(screen.getByText("Join project"));
      const input: HTMLInputElement = screen.getByLabelText("Topic");
      expect(input.value).toBe("");
    });
  });

  describe("leave", () => {
    it("should have disconnect button and peer count", async () => {
      renderProjects();
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));

      await screen.findByText("Peers: 0");
      await screen.findByText("Disconnect");
    });
    it("should show connect button after disconnect", async () => {
      renderProjects();
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));
      await userEvent.click(screen.getByText("Disconnect"));
      await screen.findByText("Connect again");
    });
    it("should call swarm.leave on disconnect", async () => {
      const swarm = new SwarmMock();
      const topic = mockTopicHex("c");
      renderProjects({ createSwarm: () => swarm, createTopic: () => topic });
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));
      await userEvent.click(screen.getByText("Disconnect"));
      expect(swarm.leave).toHaveBeenCalledWith(topic);
    });
    it("should call swarm.join on reconnect", async () => {
      const swarm = new SwarmMock();
      const topic = mockTopicHex("d");
      renderProjects({ createSwarm: () => swarm, createTopic: () => topic });
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));
      await userEvent.click(screen.getByText("Disconnect"));
      await userEvent.click(screen.getByText("Connect again"));
      expect(swarm.join).toHaveBeenNthCalledWith(2, topic);
    });
    it("should show peer count and disconnect button after reconnect", async () => {
      const swarm = new SwarmMock();
      const topic = mockTopicHex("d");
      renderProjects({ createSwarm: () => swarm, createTopic: () => topic });
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));
      await userEvent.click(screen.getByText("Disconnect"));
      await userEvent.click(screen.getByText("Connect again"));

      await screen.findByText("Peers: 0");
      await screen.findByText("Disconnect");
    });
    it("should show joining swarm message", async () => {
      const swarm = new SwarmMock();

      const topic = mockTopicHex("d");
      renderProjects({ createSwarm: () => swarm, createTopic: () => topic });
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));
      await userEvent.click(screen.getByText("Disconnect"));

      swarm.join.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5))
      );
      await userEvent.click(screen.getByText("Connect again"));
      await screen.findByText("Joining swarm...");

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Joining swarm...")
      );
    });
  });

  describe("shared project", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should send project and tasks to a connected peer", async () => {
      const swarm = new SwarmMock();
      const topic = "topic";
      renderProjects({ createSwarm: () => swarm, createTopic: () => topic });

      jest.spyOn(global.Math, "random").mockReturnValue(0.1);
      await addProjects(["Veresk"]);
      const project = getProjectMock("Veresk", "1", topic);

      jest.spyOn(global.Math, "random").mockReturnValue(0.2);
      await addTasks(["task 1"]);
      const tasks = [createNewTask({ text: "task 1", projectId: "1" })];

      await userEvent.click(screen.getByText("Share project"));
      const peer = { pubKey: "abc" };
      act(() => {
        swarm.simulatePeerConnection(peer);
      });
      expect(swarm.send).toHaveBeenCalledWith(
        peer.pubKey,
        JSON.stringify({
          type: "share-project",
          payload: {
            project,
            tasks,
          },
        })
      );
      expect(swarm.send).toHaveBeenCalledTimes(1);
    });

    it("should mark project if it connected to a swarm", async () => {
      const swarm = new SwarmMock();
      renderProjects({ createSwarm: () => swarm });
      await addProjects(["Veresk"]);
      await userEvent.click(screen.getByText("Share project"));
      hasClass(getProjectTab("Veresk"), "text-blue-600");
    });

    it("should display shared project in the list", async () => {
      const swarm = new SwarmMock();
      renderProjects({ createSwarm: () => swarm });

      const project = getProjectMock("Alian", "projid", mockTopicHex("a"));
      await addSharedProject(project, [], swarm);

      await findProjectTab("Alian");
    });
    it("should display tasks from shared project list", async () => {
      const swarm = new SwarmMock();
      renderProjects({ createSwarm: () => swarm });
      const project = getProjectMock("Alian", "projid", mockTopicHex("a"));
      const tasks = [getTaskMock("alian task 1", "taskid", "projid")];
      await addSharedProject(project, tasks, swarm);

      await screen.findByText("alian task 1");
    });

    it("should display shared projects below own", async () => {
      const swarm = new SwarmMock();
      renderProjects({ createSwarm: () => swarm });

      await addSharedProject(
        getProjectMock("Alian 1", "1", mockTopicHex("a")),
        [],
        swarm
      );

      await addProjects(["Own 2", "Own 1"]);

      await addSharedProject(
        getProjectMock("Alian 2", "2", mockTopicHex("b")),
        [],
        swarm
      );

      const renderedTabs = [...screen.getByRole("tablist").children].map(
        (child) => child.textContent
      );

      expect(renderedTabs).toEqual([
        "Own 1",
        "Own 2",
        "---",
        "Alian 1",
        "Alian 2",
      ]);
    });
  });
});

function getProjectTab(name: string) {
  return within(screen.getByRole("tablist")).getByText(name);
}

function findProjectTab(name: string) {
  return within(screen.getByRole("tablist")).findByText(name);
}

function getProjectMock(
  name: string,
  id: string,
  topic: null | string,
  owner: string = "me"
): Project {
  return { name, id, topic, owner };
}

function getTaskMock(
  text: string,
  id: string,
  projectId: string,
  owner = "me"
): Task {
  return { text, id, projectId, owner, completed: false };
}

async function addSharedProject(
  project: Project,
  tasks: Task[],
  swarm: SwarmMock
) {
  await joinTopic(project.topic!);

  act(() => {
    swarm.simulatePeerData(
      { pubKey: "abcdef" },
      JSON.stringify({
        type: "share-project",
        payload: {
          project,
          tasks,
        },
      })
    );
  });
}
