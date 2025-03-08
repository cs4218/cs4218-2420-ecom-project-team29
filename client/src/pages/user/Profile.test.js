import React from "react";
import axios from "axios";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";

import Profile from "./Profile";

const testUser = {
  name: "green",
  email: "green@email.com",
  password: "password001",
  phone: "9012345678",
  address: "123 Greenvale Lane",
};
const updatedUser = {
  name: "blue",
  email: "green@email.com",
  password: "002password",
  phone: "9876543210",
  address: "123 Tree",
};

const updated2FieldsUser = {
  name: "blue",
  email: "green@email.com",
  password: "002password",
  phone: "9012345678",
  address: "002 Tree Village",
};

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [
    {
      user: testUser,
    },
    jest.fn(),
  ]),
}));
jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));
jest.mock("../../hooks/useCategory", () => () => [{ categories: [] }]);
Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn().mockReturnValue(
      JSON.stringify({
        user: {
          name: "green",
          email: "green@email.com",
          phone: "9012345678",
          address: "123 Greenvale Lane",
        },
      })
    ),
  },
  writable: true,
});

beforeEach(() => {
  toast.success.mockClear();
});

describe("Profile", () => {
  // testing page components
  it("renders heading", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "USER PROFILE" })
    ).toBeInTheDocument();
  });
  it("should display all inputs and button", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter Your Password")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Phone")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter Your Address")
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /UPDATE/i })).toBeInTheDocument();
  });

  it("should display name of user", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const initialName = screen.getByPlaceholderText("Enter Your Name");
    expect(initialName).toBeInTheDocument();
    expect(initialName.value).toEqual(testUser.name);
  });
  it("should display email of user", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const initialEmail = screen.getByPlaceholderText("Enter Your Email");
    expect(initialEmail).toBeInTheDocument();
    expect(initialEmail.value).toEqual(testUser.email);
  });
  it("should not display password of user", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const initialPassword = screen.getByPlaceholderText("Enter Your Password");
    expect(initialPassword).toBeInTheDocument();
    expect(initialPassword.value).toEqual("");
    expect(initialPassword.value).toHaveLength(0);
  });
  it("should disable email input", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const initialEmail = screen.getByPlaceholderText("Enter Your Email");
    expect(initialEmail).toBeInTheDocument();
    expect(initialEmail).toBeDisabled();
  });
  it("should display phone of user", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const initialPhone = screen.getByPlaceholderText("Enter Your Phone");
    expect(initialPhone).toBeInTheDocument();
    expect(initialPhone.value).toEqual(testUser.phone);
  });
  it("should display address of user", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const initialAddress = screen.getByPlaceholderText("Enter Your Address");
    expect(initialAddress).toBeInTheDocument();
    expect(initialAddress.value).toEqual(testUser.address);
  });

  it("should update user profile when all fields are updated", async () => {
    // ensure that axios returns a successful response with success and updatedUser with the required fields
    axios.put.mockResolvedValueOnce({
      data: { success: true, updatedUser: updatedUser },
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: updatedUser.name },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: updatedUser.password },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: updatedUser.phone },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: updatedUser.address },
    });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile",
        updatedUser
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Profile Updated Successfully"
      );
    });
  });

  it("should update user profile when only 2 fields are updated", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: updated2FieldsUser.name },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: updated2FieldsUser.password },
    });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => expect(axios.put).toHaveBeenCalled());

    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
  });

  it("should display toast error message on failed profile update from database", async () => {
    axios.put.mockResolvedValueOnce({ data: { error: "database error" } });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => expect(axios.put).toHaveBeenCalled());

    expect(toast.error).toHaveBeenCalledWith("database error");
  });

  it("should display toast error message on failed profile update from error after getting successful response from database", async () => {
    axios.put.mockRejectedValueOnce({ message: "error" });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => expect(axios.put).toHaveBeenCalled());

    expect(toast.error).toHaveBeenCalledWith("Profile Update Failed");
  });

  it("should display toast error message when password length less than 6", async () => {
    axios.put.mockResolvedValueOnce({ data: { error: "Password is required and at least 6 character long" } });
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "less6" },
    });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Password is required and at least 6 character long"
      )
    );
  });
});
