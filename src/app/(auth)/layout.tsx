// app/(public)/layout.tsx
import { Header } from "@/components/layout/Header";
import type { ReactNode } from "react";

const PublicLayout = ({ children }: { children: ReactNode }) => (
  <>
    <Header />
    {children}
  </>
);

export default PublicLayout;
