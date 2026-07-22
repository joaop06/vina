"use client";

import { Toaster } from "sonner";
import "sonner/dist/styles.css";

export function AdminToaster() {
  return (
    <Toaster
      className="admin-toaster"
      position="top-right"
      offset={{ top: "0.75rem", right: "0.75rem" }}
      closeButton
      toastOptions={{
        classNames: {
          toast: "admin-toast",
          title: "admin-toast__title",
          description: "admin-toast__description",
          success: "admin-toast--success",
          error: "admin-toast--error",
          warning: "admin-toast--warning",
          closeButton: "admin-toast__close",
        },
      }}
    />
  );
}
