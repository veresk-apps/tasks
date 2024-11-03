import { html } from "uhtml/preactive";

export function TodoList(topModel) {
  const { todos } = topModel;
  const { onItemClick } = TodoList.model(topModel);
  return html`<ol>
    ${[
      ...todos.map(
        (name, index) =>
          html`<li onclick=${() => onItemClick(index)}>${name}</li>`
      ),
    ]}
  </ol>`;
}

TodoList.model = (topModel) => {
  return {
    onItemClick: topModel.removeTodo,
  };
};
