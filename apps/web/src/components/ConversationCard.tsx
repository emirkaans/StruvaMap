import { useState } from "react";
import { toTurkishUpper } from "../lib/text";
import { Reveal } from "./Reveal";

/* Kıyaslamadaki bir boyut için açık uçlu konuşma soruları; mobildeki
   ConversationCard'ın web karşılığı. Bir seferde tek soru, sıradakine geçilir. */
export function ConversationCard({ dimensionName, note, prompts }: { dimensionName: string; note: string; prompts: string[] }) {
  const [index, setIndex] = useState(0);
  if (prompts.length === 0) return null;

  return (
    <Reveal className="card conversation-card">
      <span className="eyebrow">{toTurkishUpper(dimensionName)}</span>
      <p className="conversation-prompt">“{prompts[index]}”</p>
      <div className="conversation-foot">
        <span className="small muted">{note}</span>
        {prompts.length > 1 && (
          <button type="button" className="conversation-next" onClick={() => setIndex((i) => (i + 1) % prompts.length)}>
            Sonraki soru →
          </button>
        )}
      </div>
    </Reveal>
  );
}
