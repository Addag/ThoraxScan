"use client";

import Form from "next/form";
import type { ComponentProps } from "react";

// GET filter form that applies as soon as a select changes. A new workspace clears the activity choice, since the
// old activity usually belongs to the previous workspace.
export function FilterForm(props: Omit<ComponentProps<typeof Form>, "action">) {
  return (
    <Form
      {...props}
      action=""
      scroll={false}
      onChange={(event) => {
        const form = event.currentTarget;
        const activity = form.elements.namedItem("activity");
        if ((event.target as EventTarget as HTMLSelectElement).name === "workspace" && activity instanceof HTMLSelectElement) activity.value = "";
        form.requestSubmit();
      }}
    />
  );
}
