import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

function Example() {
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" />

      <button type="submit">Submit</button>
    </form>
  );
}

test("supports accessible user interaction", async () => {
  const user = userEvent.setup();

  render(<Example />);

  const email = screen.getByRole("textbox", {
    name: "Email",
  });

  await user.type(email, "john@example.com");

  expect(email).toHaveValue("john@example.com");

  expect(
    screen.getByRole("button", {
      name: "Submit",
    }),
  ).toBeInTheDocument();
});
