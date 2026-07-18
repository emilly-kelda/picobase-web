import {
  Document,
  Page,
  Text,
  View,
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
    backgroundColor: '#0B1F2E',
  },
  content: {
    padding: '48px 64px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0B1F2E',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 32,
  },
  divider: {
    width: 48,
    height: 1.5,
    backgroundColor: '#2EC4B6',
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
    color: '#0B1F2E',
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
    backgroundColor: '#E8F8F7',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginVertical: 24,
    alignItems: 'center',
  },
  highlightActivity: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0B5E75',
    textAlign: 'center',
    marginBottom: 4,
  },
  highlightLevel: {
    fontSize: 12,
    color: '#0B5E75',
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
    color: '#0B1F2E',
  },
  signatureSection: {
    borderTopWidth: 0.5,
    borderTopColor: '#DDD8CF',
    paddingTop: 16,
    alignItems: 'center',
    marginTop: 'auto',
    width: '100%',
  },
  signatureName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0B1F2E',
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
    backgroundColor: '#F0EEE8',
    borderTopWidth: 0.5,
    borderTopColor: '#DDD8CF',
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

const LEVEL_LABELS: Record<string, string> = {
  experimental: 'Experimental',
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export interface CertificateProps {
  studentName: string
  activityName: string
  level: string | null
  hoursTotal: number
  completedAt: string
  instructorName: string | null
  schoolName: string
  ownerName: string
  certificateId: string
}

export function CertificatePDF({
  studentName,
  activityName,
  level,
  hoursTotal,
  completedAt,
  instructorName,
  schoolName,
  ownerName,
  certificateId,
}: CertificateProps) {
  const date = new Date(completedAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const levelLabel = level ? (LEVEL_LABELS[level] ?? level) : null

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.topBar} />

        <View style={styles.content}>
          <Text style={styles.schoolName}>{schoolName}</Text>

          <View style={styles.divider} />

          <Text style={styles.certTitle}>Certificado de Conclusão</Text>

          <Text style={styles.studentName}>{studentName}</Text>

          <Text style={styles.bodyText}>
            concluiu com êxito o programa de treinamento em
          </Text>

          <View style={styles.highlightBox}>
            <Text style={styles.highlightActivity}>{activityName}</Text>
            {levelLabel && (
              <Text style={styles.highlightLevel}>Nível {levelLabel}</Text>
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
