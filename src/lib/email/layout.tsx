import * as React from "react"
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export const COLORS = {
  red: "#c1272d",
  gold: "#e5c547",
  sand: "#fdfaf5",
  mint: "#0d7a5f",
  dark: "#1a1a1a",
  text: "#333333",
  muted: "#666666",
  border: "#ececec",
  bg: "#f6f4ef",
} as const

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

type LayoutProps = {
  /** Plain-text preview shown by Gmail/Outlook before opening. */
  preview: string
  /** Override the default language tag. Use "fr" for French emails. */
  lang?: "ar" | "fr"
  /** When passed, renders an `Unsubscribe` link in the footer (newsletter). */
  unsubscribeUrl?: string
  children: React.ReactNode
}

export function EmailLayout({
  preview,
  lang = "ar",
  unsubscribeUrl,
  children,
}: LayoutProps) {
  const dir = lang === "ar" ? "rtl" : "ltr"
  return (
    <Html lang={lang} dir={dir}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: COLORS.bg,
          fontFamily:
            lang === "ar"
              ? "'Cairo', 'Tajawal', Arial, sans-serif"
              : "Inter, 'Helvetica Neue', Arial, sans-serif",
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {/* Header */}
          <Section
            style={{
              backgroundColor: COLORS.red,
              padding: "20px 32px",
              textAlign: "center" as const,
            }}
          >
            <Link
              href={SITE_URL}
              style={{
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "22px",
                fontWeight: 700,
                fontFamily: "Georgia, 'Playfair Display', serif",
              }}
            >
              autobladi<span style={{ color: COLORS.gold }}>.ma</span>
            </Link>
          </Section>

          {/* Body */}
          <Section style={{ padding: "32px" }}>{children}</Section>

          <Hr style={{ borderColor: COLORS.border, margin: 0 }} />

          {/* Footer */}
          <Section
            style={{
              padding: "20px 32px",
              backgroundColor: COLORS.sand,
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                margin: "0 0 8px 0",
                fontSize: "12px",
                color: COLORS.muted,
              }}
            >
              autobladi.ma — {lang === "ar"
                ? "سوق السيارات الأول في المغرب"
                : "Le marché automobile #1 au Maroc"}
            </Text>
            <Text
              style={{
                margin: "0 0 12px 0",
                fontSize: "12px",
              }}
            >
              <Link href={SITE_URL} style={{ color: COLORS.red, marginInlineEnd: 12 }}>
                {SITE_URL.replace(/^https?:\/\//, "")}
              </Link>
              <Link
                href={`${SITE_URL}/${lang}/contact`}
                style={{ color: COLORS.red, marginInlineEnd: 12 }}
              >
                {lang === "ar" ? "اتصل بنا" : "Contact"}
              </Link>
              <Link
                href={`${SITE_URL}/${lang}/privacy`}
                style={{ color: COLORS.red }}
              >
                {lang === "ar" ? "الخصوصية" : "Confidentialité"}
              </Link>
            </Text>
            {unsubscribeUrl && (
              <Text
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: COLORS.muted,
                }}
              >
                <Link href={unsubscribeUrl} style={{ color: COLORS.muted }}>
                  {lang === "ar"
                    ? "إلغاء الاشتراك في النشرة"
                    : "Se désabonner de la newsletter"}
                </Link>
              </Text>
            )}
            <Text
              style={{
                margin: "8px 0 0 0",
                fontSize: "11px",
                color: COLORS.muted,
              }}
            >
              © {new Date().getFullYear()} autobladi.ma
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

export function EmailHeading({
  children,
  align = "start",
}: {
  children: React.ReactNode
  align?: "start" | "center"
}) {
  return (
    <Text
      style={{
        fontSize: "22px",
        fontWeight: 700,
        color: COLORS.dark,
        margin: "0 0 12px 0",
        textAlign: align as "start" | "center",
        lineHeight: 1.3,
      }}
    >
      {children}
    </Text>
  )
}

export function EmailParagraph({
  children,
  muted = false,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <Text
      style={{
        fontSize: "15px",
        lineHeight: 1.6,
        color: muted ? COLORS.muted : COLORS.text,
        margin: "0 0 16px 0",
      }}
    >
      {children}
    </Text>
  )
}

export function EmailButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Section style={{ textAlign: "center" as const, padding: "8px 0 24px 0" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: COLORS.red,
          color: "#ffffff",
          textDecoration: "none",
          padding: "12px 28px",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: 600,
        }}
      >
        {children}
      </Link>
    </Section>
  )
}

export function EmailGoldBox({ children }: { children: React.ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: `${COLORS.gold}1A`,
        border: `1px solid ${COLORS.gold}66`,
        borderRadius: "10px",
        padding: "16px",
        margin: "12px 0 20px 0",
      }}
    >
      <Text style={{ margin: 0, fontSize: "14px", color: COLORS.dark }}>
        {children}
      </Text>
    </Section>
  )
}
