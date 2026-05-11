import { useState } from "react";
import { Link } from "react-router-dom";

import AuthLayout from "../../../shared/layouts/AuthLayout";
import TextInput from "../../../shared/components/TextInput";
import Button from "../../../shared/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to continue to Kugrow OS"
    >
      <form className="space-y-5">
        <TextInput
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit">
          Login
        </Button>

      </form>
      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
      <Link
        to="/signup"
        className="font-medium text-black hover:underline"
      >
        Sign up
      </Link>
      </p>      
    </AuthLayout>
  );
}