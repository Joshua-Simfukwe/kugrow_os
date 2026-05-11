import { useState } from "react";
import { Link } from "react-router-dom";

import AuthLayout from "../../../shared/layouts/AuthLayout";
import TextInput from "../../../shared/components/TextInput";
import Button from "../../../shared/components/Button";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start using Kugrow OS today"
    >
      <form className="space-y-5">
        <TextInput
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-black hover:underline"
        >
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}