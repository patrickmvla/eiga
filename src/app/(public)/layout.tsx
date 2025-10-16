// app/(public)/layout.tsx
import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const PublicLayout = ({ children }: { children: ReactNode }) => (
  <>
    <Header />
    {children}
    <Footer />
  </>
);

export default PublicLayout;
