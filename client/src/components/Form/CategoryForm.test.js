import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryForm from "./CategoryForm";
import "@testing-library/jest-dom";

const setValue = jest.fn();
const handleSubmit = jest.fn();
const mockedCategoryForm = <CategoryForm setValue={setValue} value="" handleSubmit={handleSubmit} />

describe("CategoryForm Component", () => {

  it("Renders with empty input and submit button", () => {
    const { getByText, getByPlaceholderText } = render(mockedCategoryForm);

    expect(getByPlaceholderText("Enter new category")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter new category")).toHaveValue('');
    expect(getByText("Submit")).toBeInTheDocument();
  });

  it("Updates the input value when typing", () => {
    const { getByPlaceholderText } = render(mockedCategoryForm);
    fireEvent.change(getByPlaceholderText("Enter new category"), { target: { value: "category ABC" } });
    expect(setValue).toHaveBeenCalledWith("category ABC");
  });


  it("Submits the form when click submit button", () => {
    const { getByText } = render(mockedCategoryForm);
    fireEvent.submit(getByText("Submit"));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
  
});