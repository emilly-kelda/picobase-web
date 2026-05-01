import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 48,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 32,
  },
  logo: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  schoolName: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 2,
  },
  season: {
    fontSize: 10,
    color: '#aaaaaa',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#aaaaaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLabel: {
    fontSize: 11,
    color: '#555555',
  },
  rowValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 4,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1D9E75',
  },
  badge: {
    marginTop: 16,
    backgroundColor: '#EAF3DE',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    color: '#3B6D11',
    fontFamily: 'Helvetica-Bold',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  sessionLeft: {
    flex: 1,
  },
  sessionStudent: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  sessionMeta: {
    fontSize: 9,
    color: '#aaaaaa',
    marginTop: 1,
  },
  sessionPrice: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#cccccc',
  },
})

interface ReceiptProps {
  instructor:  string
  school:      string
  season:      string
  period:      string
  sessions:    { student: string; activity: string; duration: number; price: number }[]
  revenue:     number
  commissionPct: number
  commission:  number
  bonus:       number
  total:       number
  generatedAt: string
}

export function ReceiptPDF({
  instructor,
  school,
  season,
  period,
  sessions,
  revenue,
  commissionPct,
  commission,
  bonus,
  total,
  generatedAt,
}: ReceiptProps) {
  function fmt(n: number) {
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Pico Base</Text>
          <Text style={styles.schoolName}>{school}</Text>
          <Text style={styles.season}>Season {season}</Text>
        </View>

        <View style={styles.divider} />

        {/* Title */}
        <Text style={styles.title}>Payment Receipt</Text>
        <Text style={styles.subtitle}>
          To: {instructor} · Period: {period}
        </Text>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Sessions taught</Text>
            <Text style={styles.rowValue}>{sessions.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Revenue generated</Text>
            <Text style={styles.rowValue}>{fmt(revenue)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              Commission ({(commissionPct * 100).toFixed(0)}%)
            </Text>
            <Text style={styles.rowValue}>{fmt(commission)}</Text>
          </View>
          {bonus > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Bonus</Text>
              <Text style={styles.rowValue}>{fmt(bonus)}</Text>
            </View>
          )}
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total to receive</Text>
          <Text style={styles.totalValue}>{fmt(total)}</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Awaiting payment</Text>
        </View>

        <View style={styles.divider} />

        {/* Sessions detail */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Sessions ({sessions.length})
            </Text>
            {sessions.map((s, i) => (
              <View key={i} style={styles.sessionRow}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionStudent}>{s.student}</Text>
                  <Text style={styles.sessionMeta}>
                    {s.activity} · {s.duration} min
                  </Text>
                </View>
                <Text style={styles.sessionPrice}>{fmt(s.price)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Pico Base · {generatedAt}
          </Text>
          <Text style={styles.footerText}>{school}</Text>
        </View>

      </Page>
    </Document>
  )
}