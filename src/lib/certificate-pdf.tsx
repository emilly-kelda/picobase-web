import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
} from '@react-pdf/renderer'

// Cursive fonts for the signature block ('text' mode: owner picks one;
// 'fictitious' mode: each preset below has one baked in). Google Fonts'
// static single-weight files via jsdelivr's GitHub mirror, pinned to @main —
// react-pdf's fontkit parses these directly at render time (network fetch
// per PDF generation), so these must stay real, resolvable, non-variable
// TTF files or certificate generation breaks. Verified reachable (200,
// font/ttf) as of this feature's implementation.
const FONT_FILES: Record<string, { family: string; url: string }> = {
  great_vibes: { family: 'Great Vibes', url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/greatvibes/GreatVibes-Regular.ttf' },
  pacifico:    { family: 'Pacifico',    url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/pacifico/Pacifico-Regular.ttf' },
  sacramento:  { family: 'Sacramento',  url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sacramento/Sacramento-Regular.ttf' },
  alex_brush:  { family: 'Alex Brush',  url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/alexbrush/AlexBrush-Regular.ttf' },
  allura:      { family: 'Allura',      url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/allura/Allura-Regular.ttf' },
}
for (const { family, url } of Object.values(FONT_FILES)) {
  Font.register({ family, src: url })
}

// "Fictitious" signature gallery (settings UI task 2's "escolher uma
// assinatura fictícia") — since the PDF is generated server-side via
// @react-pdf/renderer (not a browser/print-CSS flow), there's no real
// scanned-signature image asset to offer. Each preset is a generic,
// sport-agnostic caption rendered in a distinct cursive font — a real
// vector graphic drawn by the PDF, not a fabricated bitmap.
export const FICTITIOUS_SIGNATURE_PRESETS: Record<string, { text: string; fontKey: string }> = {
  direcao_tecnica:        { text: 'Direção Técnica',        fontKey: 'great_vibes' },
  coordenacao_pedagogica: { text: 'Coordenação Pedagógica', fontKey: 'allura' },
  instrutor_responsavel:  { text: 'Instrutor Responsável',  fontKey: 'alex_brush' },
  direcao_geral:          { text: 'Direção Geral',          fontKey: 'sacramento' },
  coordenacao_ensino:     { text: 'Coordenação de Ensino',  fontKey: 'pacifico' },
}

type Theme = {
  topBar: string
  brand: string
  divider: string
  highlightBg: string
  highlightAccent: string
  bottomBarBg: string
  border: string
}

// Built-in background "gallery" (settings UI task 2's "tema da galeria base
// do sistema") — code-defined color palettes, not stock photography. A
// custom uploaded background_image_url always takes priority over these.
const THEMES: Record<string, Theme> = {
  oceano: { // current default look — navy/teal
    topBar: '#0B1F2E', brand: '#0B1F2E', divider: '#2EC4B6',
    highlightBg: '#E8F8F7', highlightAccent: '#0B5E75',
    bottomBarBg: '#F0EEE8', border: '#DDD8CF',
  },
  areia: { // warm sand tones
    topBar: '#6B4226', brand: '#6B4226', divider: '#D4A574',
    highlightBg: '#FBF1E0', highlightAccent: '#8B5E34',
    bottomBarBg: '#F5EDE0', border: '#E8DCC8',
  },
  vento: { // cool sky/wind blue-grey
    topBar: '#1E3A5F', brand: '#1E3A5F', divider: '#5DADE2',
    highlightBg: '#EBF5FB', highlightAccent: '#2874A6',
    bottomBarBg: '#EEF3F7', border: '#D6E4ED',
  },
}

function createStyles(themeKey: string) {
  const theme = THEMES[themeKey] ?? THEMES.oceano

  return StyleSheet.create({
    page: {
      backgroundColor: '#ffffff',
      fontFamily: 'Helvetica',
      padding: 0,
    },
    backgroundImage: {
      position: 'absolute',
      top: 0, left: 0,
      width: '100%', height: '100%',
    },
    topBar: {
      height: 8,
      backgroundColor: theme.topBar,
    },
    content: {
      padding: '48px 64px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    logo: {
      width: 56,
      height: 56,
      marginBottom: 12,
      objectFit: 'contain',
    },
    schoolName: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: theme.brand,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 3,
      marginBottom: 32,
    },
    divider: {
      width: 48,
      height: 1.5,
      backgroundColor: theme.divider,
      marginBottom: 24,
    },
    certTitle: {
      fontSize: 11,
      color: '#8A8C98',
      textTransform: 'uppercase',
      letterSpacing: 4,
      marginBottom: 24,
      textAlign: 'center',
    },
    studentName: {
      fontSize: 36,
      fontFamily: 'Helvetica-Bold',
      color: theme.brand,
      textAlign: 'center',
      marginBottom: 24,
    },
    bodyText: {
      fontSize: 12,
      color: '#4A5568',
      textAlign: 'center',
      lineHeight: 1.8,
      marginBottom: 8,
      maxWidth: 380,
    },
    highlightBox: {
      backgroundColor: theme.highlightBg,
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 32,
      marginVertical: 24,
      alignItems: 'center',
    },
    highlightActivity: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: theme.highlightAccent,
      textAlign: 'center',
      marginBottom: 4,
    },
    highlightLevel: {
      fontSize: 12,
      color: theme.highlightAccent,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    detailsRow: {
      flexDirection: 'row',
      gap: 40,
      marginTop: 24,
      marginBottom: 40,
    },
    detailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 9,
      color: '#8A8C98',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: theme.brand,
    },
    signatureSection: {
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
      paddingTop: 16,
      alignItems: 'center',
      marginTop: 'auto',
      width: '100%',
    },
    signatureImage: {
      height: 40,
      marginBottom: 6,
      objectFit: 'contain',
    },
    signatureCursive: {
      fontSize: 24,
      marginBottom: 6,
      color: theme.brand,
    },
    signatureName: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: theme.brand,
      marginBottom: 2,
    },
    signatureRole: {
      fontSize: 9,
      color: '#8A8C98',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    bottomBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 12,
      backgroundColor: theme.bottomBarBg,
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
    },
    poweredBy: {
      fontSize: 8,
      color: '#8A8C98',
      letterSpacing: 1,
    },
    certId: {
      fontSize: 8,
      color: '#8A8C98',
      fontFamily: 'Courier',
    },
  })
}

// Covers both level vocabularies in the app: sessions.level
// (experimental/iniciante/intermediario/avancado) and student_progression.level
// (level_1_discovery/level_2_intermediate/level_3_independent, IKO-style —
// the proficiency certificate reads the latter). The old
// beginner/intermediate/advanced keys are kept as a fallback for any row
// not yet touched by the 20260809000003 data migration.
const LEVEL_LABELS: Record<string, string> = {
  experimental: 'Experimental',
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  level_1_discovery: 'Nível 1 · Discovery',
  level_2_intermediate: 'Nível 2 · Intermediate',
  level_3_independent: 'Nível 3 · Independent',
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

export interface CertificateProps {
  docType: 'hours' | 'proficiency'
  studentName: string
  activityName: string
  level: string | null
  hoursTotal: number
  completedAt: string
  instructorName: string | null
  schoolName: string
  ownerName: string
  certificateId: string
  // Template customization (owner-configured via /owner/settings ·
  // Certificados) — all optional so a school that never touches that
  // section gets exactly today's look (oceano theme, no logo, plain text
  // signature = ownerName).
  schoolLogoUrl?: string | null
  themeKey?: string
  backgroundImageUrl?: string | null
  signatureType?: 'upload' | 'fictitious' | 'text'
  signatureData?: string | null
  fontFamily?: string | null
}

export function CertificatePDF({
  docType,
  studentName,
  activityName,
  level,
  hoursTotal,
  completedAt,
  instructorName,
  schoolName,
  ownerName,
  certificateId,
  schoolLogoUrl,
  themeKey = 'oceano',
  backgroundImageUrl,
  signatureType = 'text',
  signatureData,
  fontFamily,
}: CertificateProps) {
  const styles = createStyles(themeKey)
  const date = new Date(completedAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const levelLabel = level ? (LEVEL_LABELS[level] ?? level) : null

  // Resolves the signature block above the printed name/role — an uploaded
  // PNG, a cursive rendering of a typed name/title, or one of the
  // fictitious presets. Left out entirely (falls back to just the printed
  // ownerName/role, today's only behavior) when nothing is configured.
  let signatureBlock: { kind: 'image'; url: string } | { kind: 'cursive'; text: string; family: string } | null = null
  if (signatureType === 'upload' && signatureData) {
    signatureBlock = { kind: 'image', url: signatureData }
  } else if (signatureType === 'text' && signatureData) {
    const family = FONT_FILES[fontFamily ?? '']?.family ?? FONT_FILES.great_vibes.family
    signatureBlock = { kind: 'cursive', text: signatureData, family }
  } else if (signatureType === 'fictitious' && signatureData) {
    const preset = FICTITIOUS_SIGNATURE_PRESETS[signatureData]
    if (preset) {
      signatureBlock = { kind: 'cursive', text: preset.text, family: FONT_FILES[preset.fontKey].family }
    }
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {backgroundImageUrl && (
          <Image src={backgroundImageUrl} style={styles.backgroundImage} />
        )}
        <View style={styles.topBar} />

        <View style={styles.content}>
          {schoolLogoUrl && <Image src={schoolLogoUrl} style={styles.logo} />}
          <Text style={styles.schoolName}>{schoolName}</Text>

          <View style={styles.divider} />

          <Text style={styles.certTitle}>
            {docType === 'proficiency' ? 'Certificado de Proficiência' : 'Atestado de Horas Praticadas'}
          </Text>

          <Text style={styles.studentName}>{studentName}</Text>

          <Text style={styles.bodyText}>
            {docType === 'proficiency'
              ? 'concluiu com êxito o programa de treinamento em'
              : 'praticou aulas de'}
          </Text>

          <View style={styles.highlightBox}>
            <Text style={styles.highlightActivity}>{activityName}</Text>
            {docType === 'proficiency' && levelLabel && (
              <Text style={styles.highlightLevel}>{levelLabel}</Text>
            )}
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Horas concluídas</Text>
              <Text style={styles.detailValue}>{hoursTotal}h</Text>
            </View>
            {instructorName && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Instrutor</Text>
                <Text style={styles.detailValue}>{instructorName}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Data de conclusão</Text>
              <Text style={styles.detailValue}>{date}</Text>
            </View>
          </View>

          <View style={styles.signatureSection}>
            {signatureBlock?.kind === 'image' && (
              <Image src={signatureBlock.url} style={styles.signatureImage} />
            )}
            {signatureBlock?.kind === 'cursive' && (
              <Text style={{ ...styles.signatureCursive, fontFamily: signatureBlock.family }}>
                {signatureBlock.text}
              </Text>
            )}
            <Text style={styles.signatureName}>{ownerName}</Text>
            <Text style={styles.signatureRole}>Diretor · {schoolName}</Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.poweredBy}>Powered by Pico Base</Text>
          <Text style={styles.certId}>ID: {certificateId}</Text>
        </View>
      </Page>
    </Document>
  )
}
