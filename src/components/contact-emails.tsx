import { Fragment } from "react";

import { PRIVACY_CONTACT_EMAILS } from "@/lib/legal/privacy";

/** Renders the privacy contacts as "a, b, c, or d" mailto links. */
export function ContactEmails({ className }: { className: string }) {
  const last = PRIVACY_CONTACT_EMAILS.length - 1;
  return PRIVACY_CONTACT_EMAILS.map((email, index) => (
    <Fragment key={email}>
      {index > 0 ? (index === last ? (last > 1 ? ", or " : " or ") : ", ") : null}
      <a className={`${className} break-all`} href={`mailto:${email}`}>{email}</a>
    </Fragment>
  ));
}
