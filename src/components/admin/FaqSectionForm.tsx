"use client";

import type { FaqContent } from "@/domain/content/types";
import { QaListEditor } from "@/components/admin/QaListEditor";

export function FaqSectionForm({ initial }: { initial: FaqContent }) {
  return (
    <QaListEditor
      idPrefix="faq"
      heading="Често задавани въпроси"
      helperText="Плъзни въпрос, за да пренаредиш списъка на сайта."
      endpoint="/api/admin/settings/faq"
      initialItems={initial.items}
      questionLabelPrefix="Въпрос"
      addLabel="+ Добави въпрос"
      removeLabel="Премахни въпроса"
    />
  );
}
