// app/login/page.jsx
import AuthLayout from "@/components/AuthLayout";
import AuthCard from "@/components/AuthCard";

export const metadata = {
  title: "Masuk | GalaTech",
  description: "Masuk ke akun GalaTech untuk bertransaksi dengan mudah.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard mode="login" />
    </AuthLayout>
  );
}
