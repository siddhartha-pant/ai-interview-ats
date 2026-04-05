import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import Navbar from "./features/auth/components/Navbar";
import React from "react";

const WithNav = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <Protected>
        <WithNav>
          <Home />
        </WithNav>
      </Protected>
    ),
  },
  {
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <WithNav>
          <Interview />
        </WithNav>
      </Protected>
    ),
  },
]);
