import type {
  DescriptionInput,
  PriceEstimate,
  PriceEstimateInput,
} from "@/lib/ai/types"

// Provider-agnostic prompt builders + response parsing, shared by every model
// (Gemini, OpenAI, …). Keep free of provider SDK imports.

function arabicDescriptionPrompt(v: DescriptionInput): string {
  return `أنت كاتب إعلانات سيارات محترف في المغرب. اكتب وصفاً جذاباً ومقنعاً بالعربية الفصحى المبسطة لسيارة بالمواصفات التالية:

- الماركة: ${v.brand}
- الموديل: ${v.model}
- السنة: ${v.year}
${v.mileage ? `- الكيلومتراج: ${v.mileage} كم` : ""}
${v.fuelType ? `- نوع الوقود: ${v.fuelType}` : ""}
${v.transmission ? `- ناقل الحركة: ${v.transmission}` : ""}
- الحالة: ${v.condition === "neuf" ? "جديدة" : "مستعملة"}
${v.firstOwner ? "- مالك أول" : ""}
${v.accidentFree ? "- خالية من الحوادث" : ""}
- الخيارات: ${v.options.join("، ")}

اكتب 3-4 أسطر فقط، بأسلوب احترافي وجذاب، يبرز نقاط القوة، بدون مبالغة وبدون استعمال رموز تعبيرية. ابدأ مباشرة بالوصف دون مقدمات.`
}

function frenchDescriptionPrompt(v: DescriptionInput): string {
  return `Tu es un rédacteur professionnel d'annonces automobiles au Maroc. Rédige une description attractive en français pour une voiture avec les caractéristiques suivantes :

- Marque : ${v.brand}
- Modèle : ${v.model}
- Année : ${v.year}
${v.mileage ? `- Kilométrage : ${v.mileage} km` : ""}
${v.fuelType ? `- Carburant : ${v.fuelType}` : ""}
${v.transmission ? `- Transmission : ${v.transmission}` : ""}
- État : ${v.condition === "neuf" ? "Neuve" : "Occasion"}
${v.firstOwner ? "- Premier propriétaire" : ""}
${v.accidentFree ? "- Sans accident" : ""}
- Options : ${v.options.join(", ")}

Écris 3-4 lignes seulement, professionnel et attractif, mettant en avant les points forts, sans exagération ni emojis. Commence directement par la description.`
}

export function descriptionPrompt(v: DescriptionInput): string {
  return v.language === "ar"
    ? arabicDescriptionPrompt(v)
    : frenchDescriptionPrompt(v)
}

const GRADE_LABEL_AR: Record<string, string> = {
  excellent: "ممتازة",
  very_good: "جيدة جداً",
  good: "جيدة",
  fair: "متوسطة",
}

const GRADE_LABEL_FR: Record<string, string> = {
  excellent: "Excellent",
  very_good: "Très bon",
  good: "Bon",
  fair: "Moyen",
}

function arabicEstimatePrompt(v: PriceEstimateInput): string {
  const conditionLine =
    v.condition === "neuf"
      ? "- الحالة: جديدة"
      : `- الحالة: مستعملة${v.conditionGrade ? ` (${GRADE_LABEL_AR[v.conditionGrade]})` : ""}`
  const accidentLine =
    v.hadAccident === undefined
      ? ""
      : `\n- تاريخ الحوادث: ${v.hadAccident ? "سبق أن تعرّضت لحادث سير" : "لم تتعرّض لأي حادث (خالية من الحوادث)"}`

  return `أنت خبير في سوق السيارات المغربي. قدّم تقديراً لسعر سيارة في السوق المغربية الحالية:

- الماركة: ${v.brand}
- الموديل: ${v.model}
- السنة: ${v.year}
- الكيلومتراج: ${v.mileage} كم
- الوقود: ${v.fuelType}
${conditionLine}${accidentLine}

استرشد بأسعار السوق المغربية الحالية. أعد JSON صارم فقط بدون أي نص آخر أو ترميز markdown. يجب أن يكون "reasoning" و "marketContext" باللغة العربية حصراً:
{
  "priceMin": <رقم بالدرهم>,
  "priceMax": <رقم بالدرهم>,
  "reasoning": "<شرح قصير بالعربية في 2-3 أسطر>",
  "marketContext": "<معلومة عن السوق بالعربية في سطر واحد>"
}`
}

function frenchEstimatePrompt(v: PriceEstimateInput): string {
  const conditionLine =
    v.condition === "neuf"
      ? "- État : Neuve"
      : `- État : Occasion${v.conditionGrade ? ` (${GRADE_LABEL_FR[v.conditionGrade]})` : ""}`
  const accidentLine =
    v.hadAccident === undefined
      ? ""
      : `\n- Historique d'accident : ${v.hadAccident ? "A déjà subi un accident de la route" : "N'a subi aucun accident (sans accident)"}`

  return `Tu es un expert du marché automobile marocain. Donne une estimation du prix d'une voiture sur le marché marocain actuel :

- Marque : ${v.brand}
- Modèle : ${v.model}
- Année : ${v.year}
- Kilométrage : ${v.mileage} km
- Carburant : ${v.fuelType}
${conditionLine}${accidentLine}

Base-toi sur les prix actuels du marché marocain. Réponds UNIQUEMENT avec un JSON strict, sans aucun autre texte ni markdown. Les champs "reasoning" et "marketContext" doivent être rédigés exclusivement en français :
{
  "priceMin": <nombre en dirhams>,
  "priceMax": <nombre en dirhams>,
  "reasoning": "<explication courte en français, 2-3 lignes>",
  "marketContext": "<information sur le marché en français, une ligne>"
}`
}

export function estimatePrompt(v: PriceEstimateInput): string {
  return v.language === "ar"
    ? arabicEstimatePrompt(v)
    : frenchEstimatePrompt(v)
}

export function stripJsonFences(text: string): string {
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .replace(/^```/g, "")
    .trim()
}

export function isPriceEstimate(value: unknown): value is PriceEstimate {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.priceMin === "number" &&
    typeof v.priceMax === "number" &&
    typeof v.reasoning === "string" &&
    typeof v.marketContext === "string"
  )
}

/** Parses + validates a model's JSON price-estimate response. */
export function parsePriceEstimate(rawText: string): PriceEstimate {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFences(rawText.trim()))
  } catch {
    throw new Error("AI returned non-JSON response")
  }
  if (!isPriceEstimate(parsed)) {
    throw new Error("AI response missing required fields")
  }
  if (parsed.priceMin < 0 || parsed.priceMax < parsed.priceMin) {
    throw new Error("AI returned an invalid price range")
  }
  return parsed
}
