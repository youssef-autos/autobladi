import {
  Activity,
  AlertTriangle,
  Armchair,
  BatteryCharging,
  Bluetooth,
  Camera,
  CircleDot,
  CircleGauge,
  Cpu,
  DoorOpen,
  Eye,
  Flame,
  KeyRound,
  Layers,
  Lightbulb,
  Link2,
  Lock,
  Maximize,
  Monitor,
  Moon,
  Navigation,
  Phone,
  Power,
  Radio,
  RectangleHorizontal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Speaker,
  Sun,
  SunMedium,
  Tablet,
  Thermometer,
  Usb,
  Zap,
  type LucideIcon,
} from "lucide-react"

/**
 * Data-driven equipment catalog for the annonce detail page.
 *
 * Every entry is a checkbox on the seller side; on the detail page we render
 * ONLY the ones present in `annonce.options` (never "Non disponible").
 *
 * To add a new option: drop one line into the relevant group with a `key`
 * (the value stored in `annonce.options`), a Lucide `icon`, and the ar/fr
 * label. Nothing else to wire — the UI is generated from this list.
 *
 * Keys reused from the previous catalog (so existing ads keep resolving a
 * label): climatisation, gps, camera, toit_ouvrant, cuir, abs, esp, airbags,
 * jantes_alu, bluetooth, usb, cruise, park_sensors, heated_seats.
 */

export type EquipmentGroupKey = "securite" | "confort" | "infotainment" | "exterieur"

export type Equipment = {
  key: string
  icon: LucideIcon
  ar: string
  fr: string
}

export type EquipmentGroup = {
  key: EquipmentGroupKey
  icon: LucideIcon
  ar: string
  fr: string
  items: Equipment[]
}

export const EQUIPMENT_GROUPS: EquipmentGroup[] = [
  {
    key: "securite",
    icon: ShieldCheck,
    ar: "السلامة",
    fr: "Sécurité",
    items: [
      { key: "abs", icon: ShieldCheck, ar: "نظام ABS", fr: "ABS" },
      { key: "esp", icon: Shield, ar: "نظام الثبات ESP", fr: "ESP" },
      { key: "airbags", icon: ShieldAlert, ar: "وسائد هوائية أمامية", fr: "Airbags frontaux" },
      { key: "airbags_lateraux", icon: ShieldAlert, ar: "وسائد هوائية جانبية", fr: "Airbags latéraux" },
      { key: "camera", icon: Camera, ar: "كاميرا الرجوع للخلف", fr: "Caméra de recul" },
      { key: "park_sensors_avant", icon: CircleGauge, ar: "حسّاس ركن أمامي", fr: "Capteur de stationnement avant" },
      { key: "park_sensors", icon: CircleGauge, ar: "حسّاس ركن خلفي", fr: "Capteur de stationnement arrière" },
      { key: "acc", icon: Activity, ar: "مثبّت سرعة تكيّفي", fr: "Régulateur de vitesse adaptatif" },
      { key: "angle_mort", icon: Eye, ar: "مراقبة الزاوية العمياء", fr: "Surveillance angle mort" },
      { key: "ecall", icon: Phone, ar: "نظام نداء الطوارئ", fr: "Système d'appel d'urgence" },
      { key: "aeb", icon: AlertTriangle, ar: "فرملة طوارئ أوتوماتيكية", fr: "Freinage d'urgence automatique" },
      { key: "maintien_voie", icon: Navigation, ar: "مساعد الحفاظ على المسار", fr: "Aide au maintien de voie" },
    ],
  },
  {
    key: "confort",
    icon: Snowflake,
    ar: "الراحة",
    fr: "Confort",
    items: [
      { key: "climatisation", icon: Snowflake, ar: "تكييف الهواء", fr: "Climatisation" },
      { key: "climatisation_auto", icon: Thermometer, ar: "تكييف أوتوماتيكي", fr: "Climatisation automatique" },
      { key: "heated_seats", icon: Flame, ar: "مقاعد مُدفّأة", fr: "Sièges chauffants" },
      { key: "sieges_electriques", icon: Power, ar: "مقاعد كهربائية", fr: "Sièges électriques" },
      { key: "cuir", icon: Armchair, ar: "مقاعد جلدية", fr: "Sièges cuir" },
      { key: "volant_chauffant", icon: Flame, ar: "مقود مُدفّأ", fr: "Volant chauffant" },
      { key: "toit_ouvrant", icon: Sun, ar: "سقف فتّاح", fr: "Toit ouvrant" },
      { key: "toit_panoramique", icon: Sun, ar: "سقف بانورامي", fr: "Toit panoramique" },
      { key: "cruise", icon: CircleGauge, ar: "مثبّت السرعة", fr: "Régulateur de vitesse" },
      { key: "vitres_electriques", icon: RectangleHorizontal, ar: "نوافذ كهربائية", fr: "Vitres électriques" },
      { key: "retro_electriques", icon: Maximize, ar: "مرايا كهربائية", fr: "Rétroviseurs électriques" },
      { key: "fermeture_centralisee", icon: Lock, ar: "قفل مركزي", fr: "Fermeture centralisée" },
      { key: "keyless", icon: KeyRound, ar: "دخول وتشغيل بدون مفتاح", fr: "Accès et démarrage sans clé" },
      { key: "hayon_electrique", icon: DoorOpen, ar: "صندوق خلفي كهربائي", fr: "Hayon électrique" },
    ],
  },
  {
    key: "infotainment",
    icon: Monitor,
    ar: "نظام المعلومات والترفيه",
    fr: "Infotainment",
    items: [
      { key: "ecran_tactile", icon: Tablet, ar: "شاشة لمس", fr: "Écran tactile" },
      { key: "gps", icon: Navigation, ar: "نظام ملاحة GPS", fr: "GPS / Navigation" },
      { key: "bluetooth", icon: Bluetooth, ar: "بلوتوث", fr: "Bluetooth" },
      { key: "apple_carplay", icon: Smartphone, ar: "Apple CarPlay", fr: "Apple CarPlay" },
      { key: "android_auto", icon: Smartphone, ar: "Android Auto", fr: "Android Auto" },
      { key: "usb", icon: Usb, ar: "منفذ USB", fr: "USB" },
      { key: "audio_premium", icon: Speaker, ar: "نظام صوتي فاخر", fr: "Système audio premium" },
      { key: "dab", icon: Radio, ar: "راديو رقمي DAB+", fr: "DAB+" },
      { key: "chargeur_induction", icon: BatteryCharging, ar: "شاحن لاسلكي", fr: "Chargeur sans fil" },
      { key: "tableau_numerique", icon: Cpu, ar: "لوحة عدّادات رقمية", fr: "Cockpit numérique" },
      { key: "head_up_display", icon: Monitor, ar: "شاشة عرض أمامية", fr: "Affichage tête haute" },
    ],
  },
  {
    key: "exterieur",
    icon: Sparkles,
    ar: "الخارج",
    fr: "Extérieur",
    items: [
      { key: "jantes_alu", icon: CircleDot, ar: "جنوط ألمنيوم", fr: "Jantes alliage" },
      { key: "phares_led", icon: Lightbulb, ar: "مصابيح LED", fr: "Phares LED" },
      { key: "phares_xenon", icon: Zap, ar: "مصابيح زينون", fr: "Phares Xenon" },
      { key: "feux_jour_led", icon: SunMedium, ar: "أضواء نهارية LED", fr: "Feux de jour LED" },
      { key: "barres_toit", icon: Layers, ar: "قضبان السقف", fr: "Barres de toit" },
      { key: "vitres_teintees", icon: Moon, ar: "زجاج مُظلَّل", fr: "Vitres teintées" },
      { key: "attelage", icon: Link2, ar: "خطّاف الجرّ", fr: "Attelage de remorque" },
      { key: "peinture_metallisee", icon: Sparkles, ar: "طلاء معدني", fr: "Peinture métallisée" },
    ],
  },
]

/** Flat lookup of every catalog entry by its key. */
export const EQUIPMENT_BY_KEY: Record<string, Equipment> = Object.fromEntries(
  EQUIPMENT_GROUPS.flatMap((g) => g.items).map((item) => [item.key, item]),
)

/** Localized label for an option key (falls back to the raw key if unknown). */
export function equipmentLabel(key: string, locale: string): string {
  const item = EQUIPMENT_BY_KEY[key]
  if (!item) return key
  return locale === "ar" ? item.ar : item.fr
}

/** Groups that have at least one of the given option keys present. */
export function presentEquipmentGroups(
  options: string[],
): { group: EquipmentGroup; items: Equipment[] }[] {
  const set = new Set(options)
  return EQUIPMENT_GROUPS.map((group) => ({
    group,
    items: group.items.filter((item) => set.has(item.key)),
  })).filter((g) => g.items.length > 0)
}
