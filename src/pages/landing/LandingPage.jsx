/**
 * LandingPage — Vitalis
 * Design system: ai-automation-17.aura.build
 * Fonte: Inter · Fundo: #F3F3F1 · Container: max-w-[1400px] rounded-[2.5rem]
 */
import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import './landing.css'

/* ── Scroll reveal hook ───────────────────────────────────────────── */
function useScrollReveal(ref) {
  useEffect(() => {
    const el = ref?.current
    if (!el) return
    const items = el.querySelectorAll('.sr')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.1 }
    )
    items.forEach((i) => obs.observe(i))
    return () => obs.disconnect()
  }, [ref])
}

/* ── Logo: 3 barras animadas ────────────────────────────────────────── */
function Logo({ white = false }) {
  const c = white ? 'bg-white' : 'bg-[#0d9488]'
  return (
    <RouterLink to="/" className="flex items-center gap-1 group cursor-pointer" aria-label="Vitalis">
      <div className={`h-6 w-2 ${c} rounded-full transition-all duration-300 group-hover:h-8`} />
      <div className={`h-6 w-2 ${c} rounded-full transition-all duration-300 group-hover:h-4`} />
      <div className={`h-6 w-2 ${c} rounded-full transition-all duration-300 group-hover:h-6`} />
    </RouterLink>
  )
}

/* ── Hero: agenda conceitual ─────────────────────────────────────── */
function AppMockup() {
  /* Eventos distribuídos visualmente pelo mês */
  const EVENTS = {
    2:  { color: '#3b82f6', label: 'CTI 3 HNSC',    time: '19–07h' },
    5:  { color: '#22c55e', label: 'Unimed PM',      time: '13–19h' },
    9:  { color: '#ec4899', label: 'CTI 02 HMG',     time: '19–07h' },
    12: { color: '#22c55e', label: 'Unimed PM',      time: '09–21h' },
    15: { color: '#3b82f6', label: 'CTI 3 HNSC',    time: '19–07h' },
    17: { color: '#22c55e', label: 'Unimed PM',      time: '13–19h' },
    18: { color: '#3b82f6', label: 'CTI 3 HNSC',    time: '19–07h' }, // today
    19: { color: '#22c55e', label: 'Unimed PM',      time: '09–21h' },
    20: { color: '#8b5cf6', label: 'Unimed Itaúna',  time: '19–07h' },
    25: { color: '#22c55e', label: 'Unimed PM',      time: '13–19h' },
    26: { color: '#ec4899', label: 'CTI 02 HMG',     time: '19–07h' },
    29: { color: '#3b82f6', label: 'CTI 3 HNSC',    time: '19–07h' },
  }
  const TODAY  = 18
  const OFFSET = 1   // junho 2026 começa na segunda
  const TOTAL  = 30
  const lastCol    = (TOTAL + OFFSET - 1) % 7
  const trailCount = lastCol < 6 ? 6 - lastCol : 0

  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col bg-white">

      {/* Chrome */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100"
        style={{ background: '#F7F7F5' }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
        <span className="ml-auto text-[0.52rem] font-semibold text-gray-300 uppercase tracking-widest">
          Vitalis
        </span>
      </div>

      {/* Cabeçalho do mês */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-sm font-bold tracking-tight text-gray-800">Junho 2026</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[0.5rem] font-bold uppercase tracking-wide text-white rounded-full px-2.5 py-0.5"
            style={{ background: '#0d9488' }}>Mês</span>
          <span className="text-[0.5rem] font-bold uppercase tracking-wide text-gray-400 rounded-full px-2.5 py-0.5 border border-gray-200">Ano</span>
          <span className="text-[0.5rem] font-bold text-white rounded-full px-2.5 py-0.5 ml-1"
            style={{ background: '#0A0A0A' }}>+ Plantão</span>
        </div>
      </div>

      {/* Cabeçalho dos dias */}
      <div className="flex-shrink-0 grid grid-cols-7 border-b border-gray-100">
        {['SEG','TER','QUA','QUI','SEX','SÁB','DOM'].map((d, i) => (
          <div key={i} className="text-center py-1.5 text-[0.46rem] font-semibold uppercase tracking-widest"
            style={{ color: i >= 5 ? '#e5e7eb' : '#c4c4c0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grade */}
      <div className="flex-1 overflow-hidden grid grid-cols-7" style={{ gridAutoRows: '1fr' }}>
        {/* offset */}
        {Array.from({ length: OFFSET }).map((_, i) => (
          <div key={`o${i}`} className="border-r border-b border-gray-50" />
        ))}

        {/* dias do mês */}
        {Array.from({ length: TOTAL }, (_, i) => i + 1).map((d) => {
          const ev      = EVENTS[d]
          const isToday = d === TODAY
          const col     = (d + OFFSET - 1) % 7
          const isWknd  = col >= 5
          return (
            <div key={d}
              className="border-r border-b border-gray-50 flex flex-col overflow-hidden"
              style={{
                padding: '4px 4px 3px',
                background: isToday
                  ? 'rgba(13,148,136,0.05)'
                  : isWknd ? 'rgba(0,0,0,0.015)' : 'white',
              }}>
              {/* Número */}
              <div className="flex justify-end mb-0.5 flex-shrink-0">
                {isToday ? (
                  <span
                    className="flex items-center justify-center rounded-full font-bold text-white"
                    style={{ width: 16, height: 16, fontSize: '0.48rem', background: '#0d9488', lineHeight: 1 }}>
                    {d}
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.48rem', fontWeight: 500,
                    color: isWknd ? '#e5e7eb' : '#c4c4c0',
                    lineHeight: 1,
                  }}>{d}</span>
                )}
              </div>

              {/* Evento */}
              {ev && (
                <div className="flex-1 min-h-0 rounded overflow-hidden"
                  style={{
                    borderLeft: `2px solid ${ev.color}`,
                    background: ev.color + '18',
                    padding: '2px 4px',
                  }}>
                  <p className="font-semibold truncate leading-tight"
                    style={{ fontSize: '0.46rem', color: ev.color }}>
                    {ev.label}
                  </p>
                  <p className="truncate leading-none mt-px"
                    style={{ fontSize: '0.4rem', color: '#b0b0ac' }}>
                    {ev.time}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        {/* dias do próximo mês */}
        {Array.from({ length: trailCount }).map((_, i) => (
          <div key={`t${i}`}
            className="border-r border-b border-gray-50"
            style={{ padding: '4px 4px 3px', background: 'rgba(0,0,0,0.015)' }}>
            <div className="flex justify-end">
              <span style={{ fontSize: '0.48rem', fontWeight: 400, color: '#ebebea', lineHeight: 1 }}>
                {i + 1}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Navbar ─────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <header className="flex lg:px-12 pt-7 pr-7 pb-7 pl-7 items-center justify-between">
      <Logo />

      <nav className="hidden lg:flex items-center gap-10">
        {[
          { label: 'Funcionalidades', href: '#funcionalidades' },
          { label: 'Preço',           href: '#preco' },
          { label: 'FAQ',             href: '#faq' },
        ].map(({ label, href }) => (
          <a key={href} href={href}
            className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors">
            {label}
          </a>
        ))}
        <RouterLink to="/login"
          className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors">
          Login
        </RouterLink>
      </nav>

      <div className="flex items-center gap-3">
        <RouterLink to="/login"
          className="hidden sm:flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-widest
            text-gray-500 hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-gray-200">
          Entrar
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </RouterLink>
        <RouterLink to="/cadastro"
          className="flex items-center gap-2 bg-[#1A1A1A] text-white text-[0.7rem] font-medium uppercase tracking-widest
            px-6 py-3 rounded-full hover:bg-black hover:scale-105 transition-all shadow-lg shadow-gray-300/50">
          Começar
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
          </svg>
        </RouterLink>
      </div>
    </header>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[72vh]">
      {/* Left column: typography */}
      <div className="relative flex flex-col justify-center px-8 pb-12 pt-4 lg:px-12 xl:px-20 z-10">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-6">
          Gestão de Plantões Médicos
        </p>

        <div className="relative mb-6">
          <h1 className="text-[4.5rem] lg:text-[6.5rem] xl:text-[8rem] font-semibold tracking-tighter leading-[0.85] text-[#0A0A0A]">
            SEUS<br />PLANTÕES
          </h1>
          {/* Rotated badge */}
          <div className="absolute -bottom-4 left-0 lg:left-2 inline-flex items-center gap-2 bg-black text-white
            px-4 py-2 rounded-full transform -rotate-2 hover:rotate-0 transition-transform cursor-default z-20 shadow-xl">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest">Agenda & Financeiro</span>
          </div>
        </div>

        <div className="mt-8 max-w-lg">
          <h2 className="text-xl font-medium tracking-tight text-gray-900 mb-4 leading-snug">
            Controle sua agenda, faturamento e{' '}
            <span className="text-blue-600">calendários</span>{' '}
            em um só lugar.
          </h2>
          <p className="text-base text-gray-500 leading-relaxed font-normal mb-8">
            Desenvolvido para médicos que trabalham em múltiplos hospitais e precisam de organização real — sem planilhas, sem confusão.
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <RouterLink to="/cadastro"
              className="flex items-center gap-2 bg-[#1A1A1A] text-white text-[0.7rem] font-medium uppercase tracking-widest
                px-6 py-3 rounded-full hover:bg-black hover:scale-105 transition-all shadow-lg shadow-gray-300/50">
              Começar grátis
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            </RouterLink>
            <RouterLink to="/login"
              className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-widest
                text-gray-500 hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-gray-200">
              Fazer login
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </RouterLink>
          </div>

          <p className="text-[0.65rem] text-gray-400 mt-4 uppercase tracking-wide font-medium">
            7 dias grátis · sem cartão · cancele quando quiser
          </p>
        </div>
      </div>

      {/* Right column: app mockup */}
      <div className="relative h-[60vh] lg:h-auto overflow-hidden lg:rounded-tl-[4rem] group bg-stone-200">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent mix-blend-overlay z-10 pointer-events-none" />
        {/* Floating pill */}
        <div className="absolute bottom-8 right-8 z-20">
          <div className="px-4 py-2 rounded-full border border-white/40 bg-white/20 backdrop-blur-xl
            text-white text-[0.6rem] font-semibold uppercase tracking-widest hover:bg-white/30 transition-colors cursor-default">
            7 dias grátis
          </div>
        </div>
        {/* Pulse icon */}
        <div className="absolute top-1/2 left-8 lg:left-12 -translate-y-1/2 z-20">
          <div className="flex items-center justify-center w-12 h-12 rounded-full border border-white/30 backdrop-blur-md text-white/80 animate-pulse">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </div>
        {/* Blurred rotated square */}
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border border-blue-400/50 rounded-lg rotate-12 backdrop-blur-[2px]" />
        {/* App */}
        <AppMockup />
      </div>
    </div>
  )
}

/* ── Dark manifesto ──────────────────────────────────────────────────── */
function ManifestoSection() {
  const ref = useRef(null)
  useScrollReveal(ref)

  return (
    <section className="p-4 lg:p-8" ref={ref}>
      <div className="relative w-full rounded-[2rem] bg-[#08090A] border border-white/5 overflow-hidden
        px-6 py-20 md:px-16 md:py-28 text-center group">
        {/* Blue ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96
          bg-blue-600/10 blur-[120px] rounded-full pointer-events-none opacity-60
          group-hover:opacity-80 transition-opacity duration-1000" />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-white
            leading-[1.15] mb-8 sr">
            Chega de{' '}
            <span className="text-blue-400">planilhas</span>{' '}
            e agendas físicas. Controle seus{' '}
            <span className="text-blue-400">plantões</span>{' '}
            com clareza e{' '}
            <span className="text-blue-400">inteligência</span>.
          </h3>

          <p className="text-lg md:text-2xl font-normal text-gray-400 leading-relaxed max-w-4xl mb-16 sr sr-d1">
            Agenda, faturamento, notas fiscais e sincronização com Google e Apple Calendar — tudo em um sistema{' '}
            <span className="text-gray-200">construído para médicos</span>{' '}
            que levam a carreira a sério.
          </p>

          {/* Stats row */}
          <div className="flex flex-col sm:flex-row items-center gap-12 lg:gap-24 sr sr-d2">
            {[
              { n: '7 dias',  label: 'período gratuito' },
              { n: 'R$99',    label: 'plano básico / mês' },
              { n: '∞',       label: 'plantões ilimitados' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-white font-medium text-sm tracking-wide">{s.n}</p>
                <p className="text-gray-500 text-[0.65rem] uppercase tracking-widest mt-1.5 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Feature mockups ─────────────────────────────────────────────────── */
/* ── CalendarPreview: grade mensal fiel ao screenshot ── */
function CalendarPreview() {
  const SHIFTS = {
    1:  [{ color: '#3b82f6', label: 'CTI 3 HNSC Noturno',  time: '19:00-07:00' }],
    4:  [{ color: '#22c55e', label: 'Unimed PM 13-19h',    time: '13:00-19:00' }],
    5:  [{ color: '#22c55e', label: 'Unimed PM 9-21h',     time: '09:00-21:00' }],
    6:  [{ color: '#8b5cf6', label: 'Unimed Itaúna',       time: '19:00-07:00' }],
    7:  [{ color: '#ec4899', label: 'CTI 02 HMG Noturno',  time: '19:00-07:00' },
         { color: '#ec4899', label: 'CTI 02 HMG Diurno',   time: '07:00-19:00' }],
    9:  [{ color: '#22c55e', label: 'Unimed PM Noturno',   time: '19:00-07:00' },
         { color: '#f59e0b', label: 'Consultório',         time: '08:00-18:00' }],
    10: [{ color: '#22c55e', label: 'Unimed PM Noturno',   time: '19:00-07:00' }],
    11: [{ color: '#f59e0b', label: 'HNSC Noturno',        time: '19:00-07:00' }],
    12: [{ color: '#22c55e', label: 'Unimed PM 13-19h',    time: '13:00-19:00' }],
    15: [{ color: '#3b82f6', label: 'CTI 3 HNSC Noturno',  time: '19:00-07:00' },
         { color: '#22c55e', label: 'Unimed PM 13-19h',    time: '13:00-19:00' }],
    17: [{ color: '#22c55e', label: 'Unimed PM Noturno',   time: '19:00-07:00' }],
    18: [{ color: '#3b82f6', label: 'CTI 3 HNSC Noturno',  time: '19:00-07:00' }],
    19: [{ color: '#22c55e', label: 'Unimed PM 9-21h',     time: '09:00-21:00' }],
    20: [{ color: '#8b5cf6', label: 'Unimed Itaúna',       time: '19:00-07:00' }],
    21: [{ color: '#ec4899', label: 'CTI 02 HMG Noturno',  time: '19:00-07:00' },
         { color: '#ec4899', label: 'CTI 02 HMG Diurno',   time: '07:00-19:00' }],
    23: [{ color: '#f59e0b', label: 'Consultório',         time: '08:00-18:00' }],
    25: [{ color: '#22c55e', label: 'Unimed PM 13-19h',    time: '13:00-19:00' }],
    26: [{ color: '#ec4899', label: 'CTI 02 HMG Noturno',  time: '19:00-07:00' }],
    27: [{ color: '#ec4899', label: 'CTI 02 HMG Diurno',   time: '07:00-19:00' }],
    29: [{ color: '#3b82f6', label: 'CTI 3 HNSC Noturno',  time: '19:00-07:00' }],
  }
  const TODAY  = 18
  const OFFSET = 1 // Junho 2026 começa na Segunda

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
        <span className="text-[0.55rem] font-bold text-gray-800">Junho 2026</span>
        <div className="flex items-center gap-1">
          <span className="text-[0.36rem] bg-[#0d9488] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Mês</span>
          <span className="text-[0.36rem] text-gray-400 px-1.5 py-0.5 rounded-full font-bold uppercase border border-gray-200">Ano</span>
          <span className="text-[0.34rem] bg-[#0A0A0A] text-white px-1.5 py-0.5 rounded-full font-bold ml-0.5">+ Plantão</span>
        </div>
      </div>
      {/* Summary */}
      <div className="px-3 py-0.5 text-[0.34rem] text-gray-400 flex-shrink-0">
        26 agendas em Junho · <span className="text-gray-700 font-semibold">R$ 36.232,50</span> previsto
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 px-1.5 pt-1 flex-shrink-0 border-b border-gray-50">
        {['SEG','TER','QUA','QUI','SEX','SÁB','DOM'].map((d, i) => (
          <div key={i} className="text-center text-[0.3rem] font-semibold text-gray-400 pb-0.5 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-1.5 pb-1 flex-1 overflow-hidden"
        style={{ gridAutoRows: '1fr', gap: '1px', minHeight: 0 }}>
        {Array.from({ length: OFFSET }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const shifts = SHIFTS[d] || []
          const isToday = d === TODAY
          return (
            <div key={d}
              className="flex flex-col pt-0.5 pl-0.5 pr-0.5 overflow-hidden"
              style={{
                backgroundColor: isToday ? 'rgba(13,148,136,0.08)' : 'transparent',
                borderRadius: 2,
              }}>
              <span className="text-[0.32rem] font-bold block leading-none mb-px flex-shrink-0"
                style={{ color: isToday ? '#0d9488' : '#888', fontWeight: isToday ? 800 : 600 }}>
                {d}
              </span>
              {shifts.slice(0, 2).map((s, si) => (
                <div key={si}
                  className="mb-px overflow-hidden flex-shrink-0"
                  style={{
                    backgroundColor: s.color + '18',
                    borderLeft: `1.5px solid ${s.color}`,
                    borderRadius: '0 2px 2px 0',
                  }}>
                  <div className="px-0.5 py-px">
                    <div className="text-[0.25rem] font-semibold truncate leading-tight" style={{ color: s.color }}>{s.label}</div>
                    <div className="text-[0.22rem] text-gray-400 truncate leading-none">{s.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        {/* Dias do próximo mês */}
        {[1,2,3,4,5].map((d) => (
          <div key={`nx${d}`} className="pt-0.5 pl-0.5">
            <span className="text-[0.32rem] font-medium text-gray-300">{d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── FinancialPreview: pipeline kanban (Fatura/NF/Recebido) ── */
function FinancialPreview() {
  function InvoiceCard({ hospital, month, value, nf, badge }) {
    const bCfg = {
      fatura:   { bg: '#DBEAFE', text: '#1D4ED8', label: 'FATURA GERADA' },
      nf:       { bg: '#EDE9FE', text: '#6D28D9', label: 'NF EMITIDA' },
      recebido: { bg: '#D1FAE5', text: '#047857', label: 'RECEBIDO' },
    }[badge] || {}

    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-1.5">
        <div className="h-0.5" style={{
          backgroundColor: badge === 'fatura' ? '#3b82f6' : badge === 'nf' ? '#8b5cf6' : '#10b981',
        }} />
        <div className="px-2 py-1.5">
          <div className="text-[0.48rem] font-semibold text-gray-800 truncate mb-0.5">{hospital}</div>
          <div className="text-[0.4rem] text-gray-400 mb-1">{month}</div>
          <div className="text-[0.62rem] font-bold text-gray-900">{value}</div>
          {nf && <div className="text-[0.35rem] text-gray-400 truncate mt-0.5">{nf}</div>}
        </div>
      </div>
    )
  }

  function PipelineCol({ title, total, color, badge, cards }) {
    return (
      <div className="flex flex-col">
        <div className="mb-1.5">
          <div className="text-[0.38rem] font-bold uppercase tracking-widest mb-0.5" style={{ color }}>{title}</div>
          <div className="text-[0.65rem] font-bold text-gray-800">{total}</div>
        </div>
        {cards.map((c, i) => <InvoiceCard key={i} {...c} badge={badge} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-3 h-full">
      <PipelineCol title="Fatura Gerada" total="R$18.301" color="#3B82F6" badge="fatura" cards={[
        { hospital: 'Hosp. Manoel Gonçalves', month: 'Mai 2026', value: 'R$1.815' },
      ]} />
      <PipelineCol title="NF Emitida" total="R$5.865" color="#8B5CF6" badge="nf" cards={[
        { hospital: 'Hosp. N. S. Conceição PM', month: 'Mai 2026', value: 'R$4.050', nf: 'NF 26116…' },
      ]} />
      <PipelineCol title="Valor Recebido" total="R$12.436" color="#10B981" badge="recebido" cards={[
        { hospital: 'Hosp. Manoel Gonçalves', month: 'Mai 2026', value: 'R$4.386' },
        { hospital: 'Unimed PM', month: 'Mai 2026', value: 'R$8.050' },
      ]} />
    </div>
  )
}

/* ── CalSyncPreview: tabela de relatório anual ── */
function CalSyncPreview() {
  const rows = [
    { mes: 'Março',    real: null, agend: null, valor: null,     rec: null,       arec: null  },
    { mes: 'Abril',    real: null, agend: null, valor: null,     rec: null,       arec: null  },
    { mes: 'Maio',     real: null, agend: 16,   valor:'R$34.772',rec:'R$12.436',  arec:'R$4.050' },
    { mes: 'Junho',    real: 14,  agend: 10,   valor:'R$36.232',rec: null,       arec: null  },
    { mes: 'Julho',    real: null, agend: 28,   valor:'R$43.960',rec: null,       arec: null  },
  ]

  return (
    <div className="p-3 flex flex-col gap-2 h-full">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-1.5 mb-1">
        {[
          { label: 'Realizados', value: '14', color: '#0d9488' },
          { label: 'Valor Plantões', value: 'R$114.964', color: '#3b82f6' },
          { label: 'Total Recebido', value: 'R$12.436', color: '#22c55e' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 px-2 py-1.5 shadow-sm">
            <div className="text-[0.38rem] uppercase tracking-widest font-semibold text-gray-400 mb-0.5">{s.label}</div>
            <div className="text-[0.58rem] font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* Mini table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-4 gap-0 border-b border-gray-100 px-2 py-1">
          {['Mês','Realizados','Valor','Recebido'].map((h, i) => (
            <div key={i} className="text-[0.38rem] font-bold uppercase tracking-wider text-gray-400">{h}</div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-4 gap-0 px-2 py-1 border-b border-gray-50 last:border-0">
            <div className="text-[0.45rem] font-medium text-gray-700">{r.mes}</div>
            <div className="text-[0.45rem] font-bold" style={{ color: r.real ? '#0d9488' : '#ddd' }}>
              {r.real ?? '—'}
            </div>
            <div className="text-[0.45rem] font-bold" style={{ color: r.valor ? '#374151' : '#ddd' }}>
              {r.valor ?? '—'}
            </div>
            <div className="text-[0.45rem] font-bold" style={{ color: r.rec ? '#22c55e' : '#ddd' }}>
              {r.rec ?? '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── CalendarIntegrationPreview: Google + Apple Calendar conectados ── */
function CalendarIntegrationPreview() {
  return (
    <div className="flex flex-col gap-3 p-4 h-full justify-center">
      {/* Título */}
      <div className="text-[0.45rem] font-bold uppercase tracking-widest text-gray-400 mb-1">
        Calendários conectados
      </div>

      {/* Google */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-0.5 bg-[#3b82f6]" />
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.52rem] font-bold text-gray-800">Google Calendar</div>
            <div className="text-[0.42rem] text-gray-400">technology@venturo.me</div>
          </div>
          <div className="flex items-center gap-1 text-[0.4rem] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            Ativo
          </div>
        </div>
        {/* Mini eventos */}
        <div className="px-3 pb-2 flex flex-col gap-1">
          {[
            { t: 'CTI 3 HNSC Noturno', hora: '19h – 07h', color: '#3b82f6' },
            { t: 'Unimed PM 13-19h',   hora: '13h – 19h', color: '#22c55e' },
            { t: 'Reunião CRM',        hora: '10h – 11h', color: '#f59e0b' },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: e.color + '14' }}>
              <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
              <div className="text-[0.4rem] font-medium text-gray-700 truncate flex-1">{e.t}</div>
              <div className="text-[0.38rem] text-gray-400 flex-shrink-0">{e.hora}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Apple */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-0.5 bg-gray-700" />
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.14 1.26-2.12 3.76.03 2.99 2.63 3.99 2.66 4 0 .02-.03.12-.09.26z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.52rem] font-bold text-gray-800">Apple Calendar</div>
            <div className="text-[0.42rem] text-gray-400">CalDAV — iCloud</div>
          </div>
          <div className="flex items-center gap-1 text-[0.4rem] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            Ativo
          </div>
        </div>
      </div>

      {/* Sync badge */}
      <div className="text-center text-[0.42rem] text-gray-400 font-medium uppercase tracking-widest">
        ↺ Sync automático a cada 15 min
      </div>
    </div>
  )
}

/* ── Features section ────────────────────────────────────────────────── */
const FEATURES = [
  {
    label:   'Agenda',
    title:   'Gestão completa dos seus plantões',
    desc:    'Visão mensal e anual de todos os plantões. Acompanhe status — pendentes, agendados e realizados — e saiba exatamente onde está sua carga horária de cada mês.',
    glow:    'absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-500 rounded-full blur-3xl opacity-20',
    border:  'border-blue-600 border-4',
    content: <CalendarPreview />,
    flip:    false,
  },
  {
    label:   'Financeiro',
    title:   'Faturas, NF e pipeline de recebíveis',
    desc:    'Gere faturas, registre NFs e acompanhe o status de cada pagamento por hospital — de "Fatura gerada" até "Valor recebido". Controle financeiro real, sem planilha.',
    glow:    'absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-500 rounded-full blur-3xl opacity-20',
    border:  'border-brand-600 border-4',
    content: <FinancialPreview />,
    flip:    true,
  },
  {
    label:   'Integrações',
    title:   'Google e Apple Calendar sincronizados',
    desc:    'Conecte sua conta Google ou Apple ID e seus plantões aparecem automaticamente em todos os dispositivos. Somente leitura — o Vitalis nunca altera seus eventos externos.',
    glow:    'absolute top-[20%] right-[20%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-3xl opacity-20',
    border:  'border-indigo-600 border-4',
    content: <CalendarIntegrationPreview />,
    flip:    false,
  },
  {
    label:   'Relatórios · Premium',
    title:   'Relatórios anuais e exportação',
    desc:    'Visão consolidada do ano: plantões realizados, valor total gerado e recebimentos mês a mês. Exporte para PDF ou Excel em segundos. Exclusivo do plano Premium.',
    glow:    'absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] bg-purple-500 rounded-full blur-3xl opacity-20',
    border:  'border-purple-600 border-4',
    content: <CalSyncPreview />,
    flip:    true,
    premium: true,
  },
]

function FeaturesSection() {
  const ref = useRef(null)
  useScrollReveal(ref)

  return (
    <section id="funcionalidades" className="lg:px-16 xl:px-24 pt-8 pr-8 pb-20 pl-8" ref={ref}>
      <div className="flex flex-col gap-2 mb-16 sr">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gray-400">
          Funcionalidades
        </span>
        <h2 className="text-3xl font-medium tracking-tight text-gray-900">
          O que o Vitalis faz por você
        </h2>
      </div>

      <div className="flex flex-col gap-24">
        {FEATURES.map((f, i) => (
          <div key={i}
            className={`group grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center sr ${
              f.flip ? 'lg:[&>*:first-child]:order-2' : ''
            }`}
          >
            {/* Mockup card */}
            <div className="aspect-square lg:aspect-[4/3] overflow-hidden flex bg-gray-100
              w-full rounded-[2.5rem] relative shadow-inner items-center justify-center">
              <div className={f.glow} />
              <div className={`overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500
                bg-[#F3F3F1] w-[90%] h-[85%] ${f.border} rounded-[2rem] relative shadow-xl flex flex-col`}>
                {/* Chrome bar */}
                <div className="flex gap-1.5 bg-[#EFEFED] h-8 border-b border-gray-200 px-4 items-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-[0.5rem] text-gray-400 font-semibold uppercase tracking-widest">
                    {f.label.toLowerCase()}
                  </span>
                </div>
                <div className="flex-1 bg-white overflow-hidden">{f.content}</div>
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center items-start lg:pr-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gray-400">
                  {f.premium ? 'Relatórios' : f.label}
                </span>
                {f.premium && (
                  <span className="text-[0.55rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full
                    bg-[#0d9488] text-white">
                    Premium
                  </span>
                )}
              </div>
              <h3 className="text-4xl lg:text-5xl font-medium tracking-tight text-gray-900 mb-6">
                {f.title}
              </h3>
              <p className="text-lg text-gray-500 leading-relaxed font-normal mb-8 max-w-lg">
                {f.desc}
              </p>
              <RouterLink to={f.premium ? '/assinar' : '/cadastro'}
                className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full
                  text-xs font-medium uppercase tracking-widest hover:bg-gray-800 hover:scale-105
                  transition-all shadow-xl shadow-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d={f.premium
                      ? 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
                      : 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
                    }
                  />
                </svg>
                {f.premium ? 'Ver plano Premium' : 'Experimentar grátis'}
              </RouterLink>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Pricing ─────────────────────────────────────────────────────────── */
const PRICING_PLANS = [
  {
    name:     'Básico',
    price:    99,
    color:    '#3B82F6',
    colorDim: 'rgba(59,130,246,0.15)',
    desc:     'Para organizar agenda e financeiro com praticidade',
    highlight: false,
    items: [
      { label: 'Agenda de plantões ilimitada',      included: true },
      { label: 'Múltiplas instituições e unidades', included: true },
      { label: 'Controle financeiro completo',      included: true },
      { label: 'Emissão e controle de NF',          included: true },
      { label: 'Sincronização Google Calendar',     included: true },
      { label: 'Sincronização Apple Calendar',      included: true },
      { label: 'Relatórios anuais e exportação',    included: false },
    ],
    cta:  'Assinar Básico',
    href: '/assinar',
  },
  {
    name:     'Premium',
    price:    129,
    color:    '#0d9488',
    colorDim: 'rgba(13,148,136,0.20)',
    desc:     'Tudo do Básico + relatórios anuais e exportação',
    highlight: true,
    items: [
      { label: 'Agenda de plantões ilimitada',      included: true },
      { label: 'Múltiplas instituições e unidades', included: true },
      { label: 'Controle financeiro completo',      included: true },
      { label: 'Emissão e controle de NF',          included: true },
      { label: 'Sincronização Google Calendar',     included: true },
      { label: 'Sincronização Apple Calendar',      included: true },
      { label: 'Relatórios anuais e exportação',    included: true },
    ],
    cta:  'Assinar Premium',
    href: '/assinar',
  },
]

function PricingSection() {
  const ref = useRef(null)
  useScrollReveal(ref)

  return (
    <section id="preco" className="p-4 lg:p-8" ref={ref}>
      <div className="relative rounded-[2rem] bg-[#08090A] border border-white/5 overflow-hidden
        px-6 py-20 md:px-16 md:py-24">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-teal-600/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16 sr">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gray-400">
              Preço
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white mt-3 mb-4">
              Dois planos. Escolha o seu.
            </h2>
            <p className="text-gray-400 text-lg">
              7 dias grátis em qualquer plano · sem cartão no cadastro · cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto sr sr-d1">
            {PRICING_PLANS.map((plan, idx) => (
              <div key={idx}
                className="relative bg-[#0F0F0D] rounded-[2rem] overflow-hidden flex flex-col"
                style={{
                  border: plan.highlight
                    ? `1.5px solid ${plan.color}55`
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: plan.highlight
                    ? `0 0 40px ${plan.color}22`
                    : 'none',
                }}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />
                )}

                {/* Price header */}
                <div className="p-7 border-b border-white/8 text-center">
                  {plan.highlight && (
                    <div className="inline-block text-[0.55rem] font-bold uppercase tracking-widest
                      px-3 py-1 rounded-full mb-3"
                      style={{ backgroundColor: plan.colorDim, color: plan.color }}>
                      Mais completo
                    </div>
                  )}
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] mb-3"
                    style={{ color: plan.color }}>
                    Plano {plan.name}
                  </p>
                  <div className="flex items-end justify-center gap-1 mb-2">
                    <span className="text-gray-400 text-base mb-1.5">R$</span>
                    <span className="font-semibold text-6xl tracking-tighter leading-none text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-400 text-base mb-1.5">/mês</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{plan.desc}</p>
                </div>

                {/* Features */}
                <div className="p-7 flex flex-col flex-1">
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        {item.included ? (
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor"
                            strokeWidth={2.5} viewBox="0 0 24 24"
                            style={{ color: plan.color }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-700" fill="none"
                            stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                        <span className={`text-sm ${item.included ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <RouterLink to={plan.href}
                    className="flex items-center justify-center gap-2 text-[0.7rem] font-medium
                      uppercase tracking-widest px-6 py-4 rounded-full transition-all w-full"
                    style={plan.highlight
                      ? { backgroundColor: plan.color, color: '#fff' }
                      : { backgroundColor: 'rgba(255,255,255,0.07)', color: '#d1d5db',
                          border: '1px solid rgba(255,255,255,0.12)' }
                    }
                  >
                    {plan.cta}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                    </svg>
                  </RouterLink>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600 text-xs mt-8 sr sr-d2">
            Todos os planos incluem 7 dias gratuitos · Sem cartão no cadastro · Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ─────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'Preciso de cartão de crédito para começar?',
    a: 'Não. Você cria sua conta e tem 7 dias completos de acesso gratuito — incluindo relatórios — sem precisar cadastrar cartão. Só pedimos o cartão quando você decide continuar após o período de teste.',
  },
  {
    q: 'Qual a diferença entre o Básico e o Premium?',
    a: 'O Básico (R$99/mês) dá acesso a toda a agenda, gestão financeira, emissão de NF e sincronização com Google e Apple Calendar. O Premium (R$129/mês) inclui tudo isso mais os relatórios anuais com exportação para PDF e Excel — ideal para quem precisa de uma visão consolidada do ano para imposto de renda ou tomada de decisão.',
  },
  {
    q: 'Quantos plantões posso cadastrar?',
    a: 'Ilimitados em qualquer plano. Não há restrição de quantidade de plantões, hospitais, UPAs ou qualquer tipo de instituição.',
  },
  {
    q: 'A sincronização com o Google Calendar é automática?',
    a: 'Sim. Após conectar sua conta Google nas configurações, os plantões aparecem automaticamente no seu Google Calendar. O Vitalis importa eventos de fora e mantém tudo sincronizado — mas nunca modifica seus eventos externos.',
  },
  {
    q: 'O que são os relatórios anuais?',
    a: 'A aba de Relatórios (exclusiva do Premium) gera uma visão anual com todos os plantões realizados, valor total gerado por mês, total recebido e comparativo entre períodos. Você pode exportar tudo para PDF (pronto para imprimir) ou Excel (para editar e analisar).',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multa ou fidelidade. Você cancela em dois cliques pelo portal de assinatura e mantém acesso até o fim do período já pago.',
  },
  {
    q: 'O app funciona no celular?',
    a: 'Sim. O Vitalis é totalmente responsivo e funciona em qualquer navegador — celular, tablet ou desktop. Não requer instalação.',
  },
]

function FAQSection() {
  const [open, setOpen] = useState(null)
  const ref = useRef(null)
  useScrollReveal(ref)

  return (
    <section id="faq" className="lg:px-16 xl:px-24 pt-8 pr-8 pb-20 pl-8" ref={ref}>
      <div className="flex flex-col gap-2 mb-16 sr">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gray-400">
          FAQ
        </span>
        <h2 className="text-3xl font-medium tracking-tight text-gray-900">
          Perguntas frequentes
        </h2>
      </div>

      <div className="max-w-3xl sr sr-d1">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="border-b border-gray-200">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-8 py-6 text-left group"
            >
              <h3 className="text-lg font-medium tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                {item.q}
              </h3>
              <span className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </button>
            <div className={`overflow-hidden transition-all duration-400 ease-in-out ${open === i ? 'max-h-48 pb-6' : 'max-h-0'}`}>
              <p className="text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-6
      lg:px-12 pt-8 pr-7 pb-8 pl-7">
      <Logo />

      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gray-400">
        © {new Date().getFullYear()} Vitalis — Controle de Plantões
      </p>

      <div className="flex items-center gap-6">
        {[
          { label: 'Funcionalidades', href: '#funcionalidades' },
          { label: 'Preço',           href: '#preco' },
        ].map(({ label, href }) => (
          <a key={href} href={href}
            className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors">
            {label}
          </a>
        ))}
        <RouterLink to="/login"
          className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors">
          Entrar
        </RouterLink>
        <RouterLink to="/cadastro"
          className="flex items-center gap-2 bg-[#1A1A1A] text-white text-[0.7rem] font-medium uppercase
            tracking-widest px-5 py-2.5 rounded-full hover:bg-black hover:scale-105 transition-all
            shadow-lg shadow-gray-300/50">
          Criar conta
        </RouterLink>
      </div>
    </footer>
  )
}

/* ── Main ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate           = useNavigate()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) navigate('/agenda', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="lp-root min-h-screen flex items-start justify-center lg:p-6
      bg-stone-300 pt-4 pr-4 pb-4 pl-4">
      <main className="w-full max-w-[1400px] bg-[#F3F3F1] rounded-[2.5rem] shadow-2xl
        relative flex flex-col overflow-hidden">
        <Navbar />
        <Hero />
        <ManifestoSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <Footer />
      </main>
    </div>
  )
}
