// app/(public)/layout.tsx
import { Header } from "@/components/layout/header";
import type { ReactNode } from "react";

const PublicLayout = ({ children }: { children: ReactNode }) => (
  <>
    <Header />
    {children}
  </>
);

export default PublicLayout;
