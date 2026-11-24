import { useContext } from "react";
import { SubjectContext } from "../../context/SubjectContext";

export function useSubject() {
  const ctx = useContext(SubjectContext);
  if (!ctx) {
    throw new Error("useSubject phải được sử dụng bên trong một SubjectProvider");
  }
  return ctx;
}
