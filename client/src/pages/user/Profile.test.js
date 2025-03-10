import React from "react";
import axios from "axios";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

let mockAuth = { user: testUser };
const mockSetAuth = jest.fn((newAuth) => {
  mockAuth = newAuth;
});

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [mockAuth, mockSetAuth]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));
jest.mock("../../hooks/useCategory", () => () => []);

const localStorageMock = (() => {
  let store = {
    auth: JSON.stringify({
      user: {
        name: "green",
        email: "green@email.com",
        phone: "9012345678",
        address: "123 Greenvale Lane",
      },
    }),
  };
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  jest.clearAllMocks();
  toast.success.mockClear();
  toast.error.mockClear();

  // Reset auth state before each test
  mockAuth = { user: testUser };
  mockSetAuth.mockClear();

  // Reset localStorage mock
  localStorageMock.setItem("auth", JSON.stringify({ user: testUser }));
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
      screen.getByPlaceholderText("Enter Your New Password")
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

    const initialPassword = screen.getByPlaceholderText(
      "Enter Your New Password"
    );
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

  it("should update user profile when all fields are updated and auth state updated", async () => {
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
    fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
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

      expect(mockSetAuth).toHaveBeenCalledWith(
        expect.objectContaining({ user: updatedUser })
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "auth",
        expect.stringContaining(updatedUser.name)
      );
    });
  });

  it("should update user profile when only 2 fields are updated and update state accordingly", async () => {
    const partiallyUpdatedUser = {
      ...testUser,
      name: updated2FieldsUser.name,
      password: updated2FieldsUser.password,
    };

    axios.put.mockResolvedValueOnce({
      data: {
        success: true,
        updatedUser: partiallyUpdatedUser,
      },
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: updated2FieldsUser.name },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your New Password"), {
      target: { value: updated2FieldsUser.password },
    });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Profile Updated Successfully"
      );
      expect(mockSetAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            name: updated2FieldsUser.name,
          }),
        })
      );
    });
  });

  it("should display toast error message on failed profile update from database without updating state", async () => {
    axios.put.mockResolvedValueOnce({ data: { error: "database error" } });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Change a field
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Changed Name" },
    });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("database error");

      expect(mockSetAuth).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        "auth",
        expect.stringContaining("Changed Name")
      );
    });
  });

  it("should display toast error message on failed profile update from error and not update state", async () => {
    axios.put.mockRejectedValueOnce({ message: "error" });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Changed Name" },
    });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Profile Update Failed");
      expect(mockSetAuth).not.toHaveBeenCalled();
    });
  });

  it("should display toast error message when name is empty and reset input value", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    const nameInput = screen.getByPlaceholderText("Enter Your Name");
    fireEvent.change(nameInput, { target: { value: "" } });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Name cannot be empty");
      expect(axios.put).not.toHaveBeenCalled();
      expect(nameInput.value).toEqual(testUser.name);
    });
  });

  it("should display toast error message when address is empty and reset input value", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
    const addressInput = screen.getByPlaceholderText("Enter Your Address");
    fireEvent.change(addressInput, { target: { value: "" } });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Address cannot be empty");
      expect(axios.put).not.toHaveBeenCalled();
      expect(addressInput.value).toEqual(testUser.address);
    });
  });

  it("should display toast error message when phone is empty and reset input value", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    fireEvent.change(phoneInput, { target: { value: "" } });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Phone cannot be empty");
      expect(axios.put).not.toHaveBeenCalled();
      expect(phoneInput.value).toEqual(testUser.phone);
    });
  });

  it("should validate phone number format and not submit when invalid", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const phoneInput = screen.getByPlaceholderText("Enter Your Phone");
    fireEvent.change(phoneInput, { target: { value: "123abc456" } });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Phone number should contain only numbers"
      );

      expect(axios.put).not.toHaveBeenCalled();
    });
  });

  it("should display error toast based on validation priority - name first, then address, then phone", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Make all fields empty
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "" },
    });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Name cannot be empty");
      expect(toast.error).not.toHaveBeenCalledWith("Address cannot be empty");
      expect(toast.error).not.toHaveBeenCalledWith("Phone cannot be empty");

      expect(axios.put).not.toHaveBeenCalled();
    });
  });

  it("should restore only empty field when one field is empty and another is valid", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "1234567890" },
    });

    const updateButton = screen.getByText("UPDATE");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Name cannot be empty");
      expect(toast.error).not.toHaveBeenCalledWith("Phone cannot be empty");

      expect(axios.put).not.toHaveBeenCalled();
    });
  });

  it("should update form values when auth.user changes", async () => {
    // First render with initial auth state
    const { rerender } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe(
      testUser.name
    );
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(
      testUser.phone
    );
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(
      testUser.email
    );
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe(
      testUser.address
    );

    const updatedAuthUser = {
      name: "Alice Smith",
      email: "alice@example.com",
      phone: "5551234567",
      address: "123 New Street",
    };

    mockAuth = { user: updatedAuthUser };

    rerender(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe(
      updatedAuthUser.name
    );
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(
      updatedAuthUser.phone
    );
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(
      updatedAuthUser.email
    );
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe(
      updatedAuthUser.address
    );
  });

  it("should handle missing user data by using empty strings", async () => {
    mockAuth = {
      user: {
        email: "partial@example.com",
      },
    };

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(
      "partial@example.com"
    );
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe("");
  });

  it("should handle null auth state", async () => {
    mockAuth = null;

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe("");
  });

  it("should handle auth without user attribute", async () => {
    mockAuth = { token: "some-token" };
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe("");
  });
});
