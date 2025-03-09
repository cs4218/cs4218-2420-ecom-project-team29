import React from "react";
import Layout from "./Layout";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

jest.mock("./Header", () => () => <div>Mock Header</div>);

jest.mock("./Footer", () => () => <div>Mock Footer</div>);

jest.mock("react-hot-toast", () => {
  return {
    Toaster: () => <div>Mock Toaster</div>,
  };
});

jest.mock("react-helmet", () => {
  return {
    Helmet: ({ children }) => <div>{children}</div>,
  };
});

describe("Layout component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render Layout component with all components", () => {
    render(
      <Layout>
        <div>Test Child</div>
      </Layout>
    );
    expect(screen.getByText("Ecommerce app - shop now")).toBeInTheDocument();
    expect(
      document.querySelector('meta[name="description"]').getAttribute("content")
    ).toBe("mern stack project");
    expect(
      document.querySelector('meta[name="keywords"]').getAttribute("content")
    ).toBe("mern,react,node,mongodb");
    expect(
      document.querySelector('meta[name="author"]').getAttribute("content")
    ).toBe("Techinfoyt");

    expect(screen.getByText("Mock Header")).toBeInTheDocument();
    expect(screen.getByText("Mock Toaster")).toBeInTheDocument();

    expect(screen.getByText("Test Child")).toBeInTheDocument();
    expect(screen.getByText("Mock Footer")).toBeInTheDocument();
  });
});
