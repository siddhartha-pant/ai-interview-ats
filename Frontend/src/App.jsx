import { RouterProvider } from "react-router";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { InterviewProvider } from "./features/interview/interview.context.jsx";
import { Toaster } from "react-hot-toast";
function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Toaster position="top-right" />
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;
