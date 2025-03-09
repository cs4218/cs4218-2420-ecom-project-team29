import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryForm from "./CategoryForm"; // Adjust the import path accordingly

const setValue = jest.fn();
const handleSubmit = jest.fn();
const categoryFormMock = <CategoryForm setValue={setValue} value="" handleSubmit={handleSubmit} />

describe("CategoryForm Component", () => {

  it("renders with empty input and submit button", () => {

    const { getByText, getByPlaceholderText } = render(categoryFormMock);

    expect(getByPlaceholderText("Enter new category")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter new category")).toHaveValue('');
    expect(getByText("Submit")).toBeInTheDocument();
  });

  it("updates the input value when typing", () => {

    const { getByPlaceholderText } = render(categoryFormMock);

    fireEvent.change(getByPlaceholderText("Enter new category"), { target: { value: "category ABC" } });

    expect(setValue).toHaveBeenCalledWith("category ABC");
  });


  it("submits the form when click submit button", () => {

    const { getByText } = render(categoryFormMock);

    fireEvent.submit(getByText("Submit"));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
  
});