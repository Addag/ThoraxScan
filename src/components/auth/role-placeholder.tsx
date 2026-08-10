import { logoutAction } from "@/app/(protected)/actions";
import { Brand } from "@/components/brand";
import type { Profile } from "@/lib/auth/types";

export function RolePlaceholder({
  profile,
  title,
}: {
  profile: Profile;
  title: string;
}) {
  return (
    <main className="role-page">
      <header className="role-header">
        <Brand />
        <form action={logoutAction}>
          <button className="secondary-button" type="submit">
            Log out
          </button>
        </form>
      </header>

      <section className="role-card">
        <p className="auth-eyebrow">Authenticated workspace</p>
        <h1>{title}</h1>
        <p>
          Signed in as <strong>{profile.display_name}</strong> with the role of{" "}
          <strong>{profile.role}</strong>.
        </p>
        <p>
          The complete LMS dashboard will be added in the next implementation
          milestone.
        </p>
      </section>
    </main>
  );
}
