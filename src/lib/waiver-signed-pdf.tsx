import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    padding: 0,
  },
  topBar: {
    height: 8,
    backgroundColor: '#1A1C22',
  },
  content: {
    padding: '36px 48px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  schoolName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1C22',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1C22',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#8A8C98',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#8A8C98',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 18,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dataItem: {
    width: '50%',
    marginBottom: 10,
  },
  dataLabel: {
    fontSize: 8,
    color: '#8A8C98',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1C22',
  },
  waiverBox: {
    backgroundColor: '#F7F6F3',
    borderRadius: 6,
    padding: 14,
  },
  waiverText: {
    fontSize: 9.5,
    color: '#4A5568',
    lineHeight: 1.6,
  },
  signatureBox: {
    borderWidth: 1,
    borderColor: '#DDD8CF',
    borderRadius: 6,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  signatureImage: {
    maxHeight: 90,
    maxWidth: 260,
  },
  consentLine: {
    fontSize: 10,
    color: '#1A1C22',
    marginBottom: 4,
  },
  auditBox: {
    marginTop: 'auto',
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#DDD8CF',
  },
  auditLine: {
    fontSize: 7.5,
    color: '#8A8C98',
    fontFamily: 'Courier',
    marginBottom: 2,
  },
})

const DOCUMENT_LABEL: Record<string, string> = {
  cpf: 'CPF',
  passport: 'Passaporte',
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export interface SignedWaiverProps {
  checkinId: string
  schoolName: string
  studentName: string
  documentType: string | null
  documentNumber: string | null
  nationality: string | null
  birthdate: string | null
  activityName: string | null
  instructorName: string | null
  isMinor: boolean
  guardianName: string | null
  waiverSourceType: string | null
  waiverContent: string | null
  waiverVersionHash: string | null
  signedAt: string | null
  ipAddress: string | null
  userAgent: string | null
  signatureDataUrl: string | null
  lgpdConsent: boolean
}

/** Compiled, on-demand "signed record" of a check-in waiver — regenerated
 *  fresh from the checkins row every time it's downloaded (same pattern as
 *  certificate-pdf.tsx / receipt-pdf.tsx: no pre-rendered file sits in
 *  Storage that could drift from the row it describes). For file-mode
 *  waivers this can't literally merge the school's uploaded PDF pages (react
 *  -pdf composes its own document, it doesn't import existing PDF pages) —
 *  it instead prints the exact URL and SHA-256 hash that were captured at
 *  signing time, which is what actually matters for the audit trail: proof
 *  of which document version was in force, not a visual copy of it. */
export function SignedWaiverPDF({
  checkinId,
  schoolName,
  studentName,
  documentType,
  documentNumber,
  nationality,
  birthdate,
  activityName,
  instructorName,
  isMinor,
  guardianName,
  waiverSourceType,
  waiverContent,
  waiverVersionHash,
  signedAt,
  ipAddress,
  userAgent,
  signatureDataUrl,
  lgpdConsent,
}: SignedWaiverProps) {
  const dataItems: Array<[string, string]> = [
    ['Aluno', studentName],
    [documentType ? DOCUMENT_LABEL[documentType] ?? 'Documento' : 'Documento', documentNumber ?? '—'],
    ['Nacionalidade', nationality ?? '—'],
    ['Data de nascimento', fmtDate(birthdate)],
    ['Atividade', activityName ?? '—'],
    ['Instrutor', instructorName ?? '—'],
  ]
  if (isMinor) dataItems.push(['Responsável legal', guardianName ?? '—'])

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />
        <View style={styles.content}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          <Text style={styles.title}>Termo de Assunção de Risco e Responsabilidade</Text>
          <Text style={styles.subtitle}>Registro de assinatura digital · ID {checkinId}</Text>

          <Text style={styles.sectionLabel}>Dados do aluno</Text>
          <View style={styles.dataGrid}>
            {dataItems.map(([label, value]) => (
              <View key={label} style={styles.dataItem}>
                <Text style={styles.dataLabel}>{label}</Text>
                <Text style={styles.dataValue}>{value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Conteúdo do termo assinado</Text>
          <View style={styles.waiverBox}>
            {waiverSourceType === 'file' ? (
              <>
                <Text style={styles.waiverText}>
                  Documento oficial anexado pela escola, exibido e integralmente rolado pelo
                  aluno antes da assinatura. URL do arquivo no momento da assinatura:
                </Text>
                <Text style={[styles.waiverText, { marginTop: 4 }]}>{waiverContent ?? '—'}</Text>
              </>
            ) : (
              <Text style={styles.waiverText}>{waiverContent ?? '—'}</Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>Assinatura do aluno</Text>
          <View style={styles.signatureBox}>
            {signatureDataUrl
              ? <Image src={signatureDataUrl} style={styles.signatureImage} />
              : <Text style={{ fontSize: 9, color: '#8A8C98' }}>Assinatura não registrada</Text>}
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.consentLine}>
              ✓ Aceite integral do Termo de Assunção de Risco e Responsabilidade em {fmtDateTime(signedAt)}.
            </Text>
            <Text style={styles.consentLine}>
              {lgpdConsent ? '✓' : '✗'} Consentimento para tratamento de dados pessoais (LGPD).
            </Text>
          </View>

          <View style={styles.auditBox}>
            <Text style={styles.auditLine}>Data/hora da assinatura: {fmtDateTime(signedAt)}</Text>
            <Text style={styles.auditLine}>Endereço IP: {ipAddress ?? '—'}</Text>
            <Text style={styles.auditLine}>User-Agent: {userAgent ?? '—'}</Text>
            <Text style={styles.auditLine}>Hash SHA-256 do documento assinado: {waiverVersionHash ?? '—'}</Text>
            <Text style={styles.auditLine}>Gerado automaticamente por Pico Base · Lei nº 14.063/2020 · MP 2.200-2</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
