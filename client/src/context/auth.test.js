import React from 'react';
import { render } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth";
import axios from "axios";

jest.mock("axios");

const authData = {
  user: { name: "John Doe" },
  token: "test-token",
};

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn().mockReturnValueOnce(JSON.stringify(authData)),
    removeItem: jest.fn(),
  },
  writable: true,
});

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("sets auth token in axios headers if exists in local storage", () => {
    const TestComponent = () => {
      const [auth] = useAuth();
      return <div>{auth.user ? auth.user.name : "No User"}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(axios.defaults.headers.common["Authorization"]).toBe(authData.token);
  });

  test("does not set auth token in axios headers if does not exist in local storage", () => {
    window.localStorage.getItem = jest.fn().mockReturnValueOnce(null);

    const TestComponent = () => {
      const [auth] = useAuth();
      return <div>{auth.user ? auth.user.name : "No User"}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });
});