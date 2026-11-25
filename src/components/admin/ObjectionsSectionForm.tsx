"use client";

import type { ObjectionsContent } from "@/domain/content/types";
import { QaListEditor } from "@/components/admin/QaListEditor";

export function ObjectionsSectionForm({ initial }: { initial: ObjectionsContent }) {
  return (
    <QaListEditor
      idPrefix="objection"
      heading="Секция „Ами ако…“"
      helperText="Плъзни реплика, за да пренаредиш списъка на сайта. Въпросът е репликата в лилавото балонче, отговорът — в кремавото."
      endpoint="/api/admin/settings/objections"
      initialItems={initial.items}
      questionLabelPrefix="Реплика"
      addLabel="+ Добави реплика"
      removeLabel="Премахни репликата"
    />
  );
}
