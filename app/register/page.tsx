// app/register/page.jsx
import AuthLayout from "@/components/AuthLayout";
import AuthCard from "@/components/AuthCard";

export const metadata = {
  title: "Daftar | GalaTech",
  description: "Buat akun GalaTech dan mulai berbelanja.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthCard mode="register" />
    </AuthLayout>
  );
}
