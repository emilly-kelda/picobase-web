'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AddBookingModal from './AddBookingModal'

type Activity = {
  id: string
  name: string
}

type Booking = {
  id: string
  student_name: string
  whatsapp: string
  preferred_date: string | null
  preferred_time: string | null
  notes: string | null
  created_at: string
  activities: { name: string } | null
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })
}

function whatsappHref(rawPhone: string, text?: string) {
  const digits = rawPhone.replace(/\D/g, '')
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${query}`
}

function confirmationMessage(booking: Booking) {
  const activity = booking.activities?.name
  const date     = fmtDate(booking.preferred_date)
  const time     = booking.preferred_time

  let when = ''
  if (date && time)      when = ` para ${date} às ${time}`
  else if (date)         when = ` para ${date}`
  else if (time)         when = ` para às ${time}`

  return activity
    ? `Olá ${booking.student_name}! Sua aula de ${activity} foi confirmada${when}. Até lá! 🤙`
    : `Olá ${booking.student_name}! Sua aula foi confirmada${when}. Até lá! 🤙`
}

export default function BookingsClient({
  bookings: initialBookings,
  activities,
  schoolSlug,
}: {
  bookings: Booking[]
  activities: Activity[]
  schoolSlug: string | null
}) {
  const router = useRouter()
  const [bookings, setBookings] = useState(initialBookings)
  const [loading, setLoading]   = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  function onBookingCreated() {
    setShowAddModal(false)
    router.refresh()
  }

  async function updateStatus(booking: Booking, status: 'confirmed' | 'declined') {
    setLoading(booking.id)

    // Open the tab synchronously, still inside the click's user-activation window,
    // so the browser doesn't treat it as an unrequested popup once we point it at
    // the WhatsApp link after the PATCH resolves (awaiting first would lose that
    // window and get the tab silently blocked in most browsers).
    const waTab = status === 'confirmed' ? window.open('', '_blank') : null

    const res = await fetch('/api/owner/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: booking.id, status }),
    })
    setLoading(null)

    if (!res.ok) {
      waTab?.close()
      return
    }

    setBookings(prev => prev.filter(b => b.id !== booking.id))

    if (waTab) {
      waTab.location.href = whatsappHref(booking.whatsapp, confirmationMessage(booking))
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
            Reservas
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Pedidos de aula recebidos pelo formulário público
          </p>
        </div>
        {schoolSlug && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '9px 16px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              flexShrink: 0,
            }}
          >
            + Nova reserva
          </button>
        )}
      </div>

      {bookings.length === 0 ? (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
        }}>
          Nenhum pedido de aula pendente.
        </div>
      ) : (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          {bookings.map((b, idx) => (
            <div key={b.id} style={{
              padding: '18px 20px',
              borderBottom: idx < bookings.length - 1 ? '0.5px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)', marginBottom: '4px' }}>
                    {b.student_name}
                  </div>
                  <a
                    href={whatsappHref(b.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', color: 'var(--glacial)', textDecoration: 'none', fontWeight: '500' }}
                  >
                    💬 {b.whatsapp}
                  </a>
                  <div style={{ fontSize: '13px', color: 'var(--mist)', marginTop: '6px' }}>
                    {b.activities?.name ?? 'Atividade não especificada'}
                    {(b.preferred_date || b.preferred_time) && ' · '}
                    {fmtDate(b.preferred_date)}
                    {b.preferred_date && b.preferred_time && ' às '}
                    {b.preferred_time}
                  </div>
                  {b.notes && (
                    <div style={{
                      fontSize: '13px', color: 'var(--slate)', marginTop: '8px',
                      padding: '8px 12px', background: 'var(--powder)', borderRadius: 'var(--radius-md)',
                    }}>
                      {b.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => updateStatus(b, 'confirmed')}
                    disabled={loading === b.id}
                    style={{
                      padding: '8px 14px', borderRadius: '99px',
                      background: 'var(--glacial)', color: '#fff', border: 'none',
                      fontSize: '12px', fontWeight: '500',
                      cursor: loading === b.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-sans)', opacity: loading === b.id ? 0.6 : 1,
                    }}
                  >
                    ✓ Confirmar
                  </button>
                  <button
                    onClick={() => updateStatus(b, 'declined')}
                    disabled={loading === b.id}
                    style={{
                      padding: '8px 14px', borderRadius: '99px',
                      background: '#fff', color: 'var(--signal)',
                      border: '0.5px solid var(--border-strong)',
                      fontSize: '12px', fontWeight: '500',
                      cursor: loading === b.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-sans)', opacity: loading === b.id ? 0.6 : 1,
                    }}
                  >
                    ✗ Recusar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && schoolSlug && (
        <AddBookingModal
          schoolSlug={schoolSlug}
          activities={activities}
          onClose={() => setShowAddModal(false)}
          onCreated={onBookingCreated}
        />
      )}
    </div>
  )
}
