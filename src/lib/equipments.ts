import {
  Activity,
  AlertTriangle,
  Armchair,
  Baby,
  BatteryCharging,
  BellRing,
  Bluetooth,
  Camera,
  CircleDot,
  CircleGauge,
  CloudRain,
  Cpu,
  Disc,
  DoorOpen,
  Droplets,
  Eye,
  Flame,
  Gauge,
  Grip,
  Hand,
  KeyRound,
  Layers,
  LifeBuoy,
  Lightbulb,
  Link2,
  Lock,
  Maximize,
  Monitor,
  Moon,
  Navigation,
  PanelTop,
  Phone,
  Plug,
  Power,
  RectangleHorizontal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sofa,
  Sparkles,
  Star,
  Sun,
  SunMedium,
  Tablet,
  Thermometer,
  Usb,
  Wind,
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
 * The 15 historical keys (climatisation, gps, camera, toit_ouvrant, cuir,
 * abs, esp, airbags, jantes_alu, bluetooth, usb, cruise, park_sensors,
 * auto_lights, heated_seats) are kept verbatim so existing ads keep working.
 */

export type EquipmentGroupKey = "confort" | "exterieur" | "interieur" | "securite"

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
    key: "confort",
    icon: Snowflake,
    ar: "الراحة",
    fr: "Confort",
    items: [
      { key: "climatisation", icon: Snowflake, ar: "تكييف الهواء", fr: "Climatisation" },
      { key: "climatisation_auto", icon: Thermometer, ar: "تكييف أوتوماتيكي", fr: "Climatisation automatique" },
      { key: "climatisation_multizone", icon: Wind, ar: "تكييف متعدد المناطق", fr: "Climatisation bi-zone / multizone" },
      { key: "direction_assistee", icon: LifeBuoy, ar: "مقود مُعزَّز", fr: "Direction assistée" },
      { key: "cruise", icon: CircleGauge, ar: "مثبّت السرعة", fr: "Régulateur de vitesse" },
      { key: "limiteur_vitesse", icon: Gauge, ar: "محدّد السرعة", fr: "Limiteur de vitesse" },
      { key: "acc", icon: Activity, ar: "مثبّت سرعة تكيّفي (ACC)", fr: "Régulateur de vitesse adaptatif (ACC)" },
      { key: "retro_electriques", icon: Maximize, ar: "مرايا كهربائية", fr: "Rétroviseurs électriques" },
      { key: "retro_rabattables", icon: Maximize, ar: "مرايا قابلة للطي كهربائياً", fr: "Rétroviseurs rabattables électriquement" },
      { key: "retro_chauffants", icon: Flame, ar: "مرايا مُدفّأة", fr: "Rétroviseurs chauffants" },
      { key: "vitres_av", icon: RectangleHorizontal, ar: "نوافذ أمامية كهربائية", fr: "Vitres électriques avant" },
      { key: "vitres_av_ar", icon: RectangleHorizontal, ar: "نوافذ كهربائية (أمام وخلف)", fr: "Vitres électriques (avant et arrière)" },
      { key: "heated_seats", icon: Flame, ar: "مقاعد مُدفّأة", fr: "Sièges chauffants" },
      { key: "sieges_ventiles", icon: Wind, ar: "مقاعد مُهوّاة", fr: "Sièges ventilés" },
      { key: "sieges_electriques", icon: Power, ar: "مقاعد كهربائية", fr: "Sièges électriques" },
      { key: "sieges_memoire", icon: Star, ar: "مقاعد بذاكرة", fr: "Sièges à mémoire" },
      { key: "volant_reglable", icon: LifeBuoy, ar: "مقود قابل للضبط", fr: "Volant réglable (hauteur / profondeur)" },
      { key: "volant_chauffant", icon: Flame, ar: "مقود مُدفّأ", fr: "Volant chauffant" },
      { key: "commandes_volant", icon: LifeBuoy, ar: "أزرار تحكم على المقود", fr: "Commandes au volant" },
      { key: "auto_lights", icon: Lightbulb, ar: "إضاءة أوتوماتيكية", fr: "Allumage automatique des feux" },
      { key: "detecteur_pluie", icon: CloudRain, ar: "حسّاس المطر", fr: "Détecteur de pluie" },
      { key: "start_stop", icon: Power, ar: "زر Start & Stop", fr: "Bouton Start & Stop" },
      { key: "keyless", icon: KeyRound, ar: "تشغيل بدون مفتاح", fr: "Démarrage sans clé (Keyless)" },
      { key: "ordinateur_bord", icon: Cpu, ar: "كمبيوتر القيادة", fr: "Ordinateur de bord" },
      { key: "head_up_display", icon: Monitor, ar: "شاشة عرض أمامية (Head-up)", fr: "Affichage tête haute" },
      { key: "frein_parking_elec", icon: Power, ar: "فرامل ركن كهربائية", fr: "Frein de stationnement électrique" },
      { key: "hayon_electrique", icon: DoorOpen, ar: "صندوق خلفي كهربائي", fr: "Hayon / coffre électrique" },
      { key: "chargeur_induction", icon: BatteryCharging, ar: "شاحن لاسلكي بالحثّ", fr: "Chargeur à induction (sans fil)" },
      { key: "toit_ouvrant", icon: Sun, ar: "سقف فتّاح", fr: "Toit ouvrant" },
      { key: "park_sensors", icon: CircleGauge, ar: "مساعد الركن", fr: "Aide au stationnement" },
      { key: "fermeture_centralisee", icon: Lock, ar: "قفل مركزي عن بُعد", fr: "Fermeture centralisée à distance" },
    ],
  },
  {
    key: "exterieur",
    icon: Sparkles,
    ar: "الخارج",
    fr: "Extérieur",
    items: [
      { key: "jantes_alu", icon: CircleDot, ar: "جنوط من الألمنيوم", fr: "Jantes en alliage" },
      { key: "jantes_tole", icon: Disc, ar: "جنوط حديدية مع أغطية", fr: "Jantes tôle (avec enjoliveurs)" },
      { key: "phares_led", icon: Lightbulb, ar: "مصابيح LED", fr: "Phares LED" },
      { key: "phares_xenon", icon: Zap, ar: "مصابيح زينون", fr: "Phares Xénon / Bi-Xénon" },
      { key: "antibrouillard", icon: Sun, ar: "مصابيح ضباب", fr: "Phares antibrouillard" },
      { key: "feux_jour_led", icon: SunMedium, ar: "أضواء نهارية LED", fr: "Feux de jour à LED" },
      { key: "feux_directionnels", icon: Lightbulb, ar: "أضواء انعطاف", fr: "Feux directionnels" },
      { key: "lave_phares", icon: Droplets, ar: "غسّالة المصابيح", fr: "Lave-phares" },
      { key: "vitres_teintees", icon: Moon, ar: "زجاج مُظلَّل", fr: "Vitres teintées" },
      { key: "barres_toit", icon: Layers, ar: "قضبان السقف", fr: "Barres de toit (Galerie)" },
      { key: "becquet", icon: PanelTop, ar: "جناح خلفي", fr: "Becquet / Aileron" },
      { key: "retro_couleur", icon: Sparkles, ar: "مرايا بلون الهيكل", fr: "Rétroviseurs couleur carrosserie" },
      { key: "peinture_metallisee", icon: Sparkles, ar: "طلاء معدني", fr: "Peinture métallisée" },
      { key: "attelage", icon: Link2, ar: "خطّاف الجرّ", fr: "Attelage / Crochet de remorquage" },
      { key: "essuie_glace_ar", icon: CloudRain, ar: "مسّاحة خلفية", fr: "Essuie-glace arrière" },
    ],
  },
  {
    key: "interieur",
    icon: Armchair,
    ar: "الداخل",
    fr: "Intérieur",
    items: [
      { key: "ecran_tactile", icon: Tablet, ar: "شاشة لمس", fr: "Écran tactile" },
      { key: "gps", icon: Navigation, ar: "نظام ملاحة GPS", fr: "Système de navigation GPS" },
      { key: "bluetooth", icon: Bluetooth, ar: "بلوتوث", fr: "Bluetooth" },
      { key: "apple_carplay", icon: Smartphone, ar: "Apple CarPlay", fr: "Apple CarPlay" },
      { key: "android_auto", icon: Smartphone, ar: "Android Auto", fr: "Android Auto" },
      { key: "lecteur_cd", icon: Disc, ar: "مشغّل CD / DVD", fr: "Lecteur CD / DVD" },
      { key: "prise_aux", icon: Plug, ar: "مدخل AUX / Jack", fr: "Prise AUX / Jack" },
      { key: "tableau_numerique", icon: Cpu, ar: "لوحة عدّادات رقمية", fr: "Tableau de bord numérique" },
      { key: "eclairage_ambiance", icon: Lightbulb, ar: "إضاءة محيطية", fr: "Éclairage d'ambiance" },
      { key: "accoudoir_central", icon: Armchair, ar: "مسند ذراع مركزي", fr: "Accoudoir central" },
      { key: "banquette_rabattable", icon: Sofa, ar: "مقعد خلفي قابل للطي", fr: "Banquette arrière rabattable" },
      { key: "sieges_rabattables", icon: Sofa, ar: "مقاعد قابلة للطي", fr: "Sièges rabattables" },
      { key: "volant_multifonction", icon: LifeBuoy, ar: "مقود متعدد الوظائف", fr: "Volant multifonction" },
      { key: "cuir", icon: Armchair, ar: "فرش جلدي", fr: "Sellerie cuir" },
      { key: "volant_cuir", icon: LifeBuoy, ar: "مقود جلدي", fr: "Volant en cuir" },
      { key: "tapis_sol", icon: Grip, ar: "بُسُط أرضية", fr: "Tapis de sol" },
      { key: "usb", icon: Usb, ar: "منفذ USB", fr: "Prise USB / USB-C" },
      { key: "pommeau_cuir", icon: Hand, ar: "مقبض ناقل الحركة جلدي", fr: "Pommeau de levier en cuir" },
    ],
  },
  {
    key: "securite",
    icon: ShieldCheck,
    ar: "السلامة",
    fr: "Sécurité",
    items: [
      { key: "airbags", icon: ShieldAlert, ar: "وسائد هوائية أمامية", fr: "Airbags conducteur et passager" },
      { key: "airbags_lateraux", icon: ShieldAlert, ar: "وسائد هوائية جانبية", fr: "Airbags latéraux" },
      { key: "airbags_rideaux", icon: ShieldAlert, ar: "وسائد هوائية ستائرية", fr: "Airbags rideaux" },
      { key: "airbag_genoux", icon: ShieldAlert, ar: "وسادة هوائية للركبة", fr: "Airbag genoux" },
      { key: "abs", icon: ShieldCheck, ar: "نظام ABS", fr: "ABS (antiblocage des roues)" },
      { key: "esp", icon: Shield, ar: "نظام الثبات ESP", fr: "ESP / Contrôle de stabilité" },
      { key: "asr", icon: Shield, ar: "منع انزلاق العجلات (ASR)", fr: "Anti-patinage (ASR)" },
      { key: "aide_demarrage_cote", icon: Activity, ar: "مساعد الانطلاق على المنحدر", fr: "Aide au démarrage en côte" },
      { key: "antidemarrage", icon: Lock, ar: "مانع التشغيل (Antivol)", fr: "Anti-démarrage (Antivol)" },
      { key: "alarme", icon: BellRing, ar: "نظام إنذار", fr: "Système d'alarme" },
      { key: "tpms", icon: Gauge, ar: "مراقبة ضغط الإطارات (TPMS)", fr: "Contrôle de pression des pneus (TPMS)" },
      { key: "aeb", icon: AlertTriangle, ar: "فرملة طوارئ أوتوماتيكية (AEB)", fr: "Freinage d'urgence automatique (AEB)" },
      { key: "alerte_franchissement", icon: AlertTriangle, ar: "تنبيه مغادرة المسار", fr: "Alerte de franchissement de ligne" },
      { key: "maintien_voie", icon: Navigation, ar: "مساعد الحفاظ على المسار", fr: "Aide au maintien de voie" },
      { key: "angle_mort", icon: Eye, ar: "كاشف الزاوية العمياء", fr: "Détecteur d'angle mort" },
      { key: "reconnaissance_panneaux", icon: Eye, ar: "التعرّف على إشارات المرور", fr: "Reconnaissance des panneaux" },
      { key: "detection_fatigue", icon: Eye, ar: "كشف إرهاق السائق", fr: "Détection de fatigue du conducteur" },
      { key: "isofix", icon: Baby, ar: "تثبيت ISOFIX", fr: "Fixations ISOFIX" },
      { key: "camera", icon: Camera, ar: "كاميرا الرجوع للخلف", fr: "Caméra de recul" },
      { key: "radar_recul", icon: CircleGauge, ar: "رادار الركن", fr: "Radar de recul / stationnement" },
      { key: "securite_enfants", icon: Baby, ar: "قفل أمان الأطفال", fr: "Verrouillage de sécurité enfants" },
      { key: "ecall", icon: Phone, ar: "نداء الطوارئ (eCall)", fr: "Appel d'urgence (eCall)" },
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

/** Total number of catalog options present (for the header counter). */
export function countPresentEquipments(options: string[]): number {
  const set = new Set(options)
  return EQUIPMENT_GROUPS.reduce(
    (acc, g) => acc + g.items.filter((i) => set.has(i.key)).length,
    0,
  )
}
