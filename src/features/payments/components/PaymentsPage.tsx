import { useState, type ReactElement } from 'react';
import { type Member, Avatar, DEMO_DATE } from '@/features/members';
import type { DayPass } from '@/features/dayPasses';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Pagination } from '@/components/ui/pagination';
import { OptionCards, type Option } from '@/components/ui/option-cards';
import { paymentMethodOptions } from '@/config/paymentMethods';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

interface PaymentsPageProps {
  members: Member[];
  dayPasses?: DayPass[];
  /** KPIs are hidden for reception. */
  showSummary?: boolean;
}

type Period = 'today' | 'month';

const periodOptions: Option<string>[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'month', label: 'Este mes' },
];

const PAGE_SIZES = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

const paymentDate = (payment: Member): string => payment.recordedAt ?? payment.start;

/** One line of the payments table: a membership payment or a day pass. */
interface PaymentRow {
  id: string;
  receiptNumber?: string;
  name: string;
  plan: string;
  date: string;
  method: string;
  amount: number;
  document: string;
  isDayPass: boolean;
}

function monthBounds(date: string): { first: string; last: string } {
  const [year, month] = date.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { first: `${date.slice(0, 7)}-01`, last: `${date.slice(0, 7)}-${String(lastDay).padStart(2, '0')}` };
}

interface Kpi {
  label: string;
  value: string;
  icon: IconName;
}

export function PaymentsPage({ members, dayPasses = [], showSummary = true }: PaymentsPageProps): ReactElement {
  const [method, setMethod] = useState('all');
  // The screen always opens on today's payments.
  const [from, setFrom] = useState(DEMO_DATE);
  const [to, setTo] = useState(DEMO_DATE);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const month = monthBounds(DEMO_DATE);
  const presetRanges: Record<Period, { from: string; to: string }> = {
    today: { from: DEMO_DATE, to: DEMO_DATE },
    month: { from: month.first, to: month.last },
  };
  // A preset is highlighted only while the dates match it exactly; custom dates highlight none.
  const activePeriod = (Object.keys(presetRanges) as Period[]).find((id) => presetRanges[id].from === from && presetRanges[id].to === to) ?? '';
  const resetToToday = (): void => {
    setFrom(DEMO_DATE);
    setTo(DEMO_DATE);
    setPage(1);
  };

  /** Keeps the range coherent: moving one end past the other drags it along. */
  function changeFrom(value: string): void {
    setPage(1);
    setFrom(value);
    if (to && value > to) setTo(value);
  }
  function changeTo(value: string): void {
    setPage(1);
    setTo(value);
    if (from && value < from) setFrom(value);
  }

  const rows: PaymentRow[] = [
    ...members.map((payment): PaymentRow => ({ id: payment.id, receiptNumber: payment.receiptNumber, name: payment.name, plan: payment.plan, date: paymentDate(payment), method: payment.method, amount: payment.paid, document: payment.dni, isDayPass: false })),
    ...dayPasses.map((pass): PaymentRow => ({ id: pass.id, receiptNumber: pass.receiptNumber, name: pass.name ?? 'Visitante', plan: 'Pase del día', date: pass.date, method: pass.method, amount: pass.amount, document: pass.document ?? '', isDayPass: true })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filtered = rows.filter(
    (row) => (method === 'all' || row.method === method) && (!from || row.date >= from) && (!to || row.date <= to),
  );

  const total = filtered.reduce((sum, row) => sum + row.amount, 0);
  const byMethod = filtered.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.method]: (acc[row.method] ?? 0) + 1 }), {});
  const [topMethod] = Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0] ?? [];

  const kpis: Kpi[] = [
    { label: 'Total cobrado', value: formatCurrency(total), icon: 'payments' },
    { label: 'Pagos', value: String(filtered.length), icon: 'check' },
    { label: 'Ticket promedio', value: filtered.length ? formatCurrency(total / filtered.length) : '—', icon: 'trend' },
    { label: 'Pases del día', value: String(filtered.filter((row) => row.isDayPass).length), icon: 'access' },
    { label: 'Medio más usado', value: topMethod ?? '—', icon: 'plans' },
  ];

  const methodTotals = paymentMethodOptions.map((option) => ({
    ...option,
    amount: filtered.filter((row) => row.method === option.value).reduce((sum, row) => sum + row.amount, 0),
  }));

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function download(): void {
    const rows = [
      ['N.º', 'Miembro', 'Documento', 'Período', 'Monto', 'Medio', 'Fecha'],
      ...filtered.map((row) => [row.receiptNumber ?? '', row.name, row.document, row.plan, String(row.amount), row.method, row.date]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pagos.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {showSummary && (
        <div className="metrics payment-metrics">
          {kpis.map((kpi) => (
            <article className="card metric tone-money" key={kpi.label}>
              <span className="metric-icon">
                <Icon name={kpi.icon} size={20} />
              </span>
              <span className="metric-text">
                <span className="metric-label">{kpi.label}</span>
                <strong className="metric-value">{kpi.value}</strong>
              </span>
            </article>
          ))}
        </div>
      )}
      {showSummary && (
        <div className="method-totals" aria-label="Total por medio de pago">
          {methodTotals.map((method) => (
            <span className="method-total" key={method.value}>
              {method.icon && <Icon name={method.icon} size={16} />}
              {method.label}
              <strong>{formatCurrency(method.amount)}</strong>
            </span>
          ))}
        </div>
      )}
      <section className="card">
        <div className="card-heading">
          <h2>Registro de pagos</h2>
          <Button variant="secondary" title="Descargar los pagos filtrados en CSV" onClick={download}>
            <Icon name="download" size={16} /> Descargar
          </Button>
        </div>
        <div className="payments-filters">
          <div className="filter-row">
            <div className="date-range">
              <Field label="Desde" as="div">
                <DatePicker label="Desde" today={DEMO_DATE} value={from} onChange={changeFrom} />
              </Field>
              <Field label="Hasta" as="div">
                <DatePicker label="Hasta" today={DEMO_DATE} value={to} onChange={changeTo} />
              </Field>
              {activePeriod !== 'today' && <IconButton icon="close" label="Volver a hoy" onClick={resetToToday} />}
            </div>
            <OptionCards
              label="Período"
              variant="chip"
              options={periodOptions}
              value={activePeriod}
              onChange={(period) => {
                const range = presetRanges[period as Period];
                setFrom(range.from);
                setTo(range.to);
                setPage(1);
              }}
            />
          </div>
          <OptionCards label="Filtrar por medio de pago" variant="chip" options={[{ value: 'all', label: 'Todos' }, ...paymentMethodOptions]} value={method} onChange={(value) => { setMethod(value); setPage(1); }} />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>N.º</th>
                <th>Miembro</th>
                <th>Plan</th>
                <th>Fecha</th>
                <th>Medio</th>
                <th className="right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.receiptNumber ?? '—'}</td>
                  <td>
                    <div className="person">
                      <Avatar name={row.name} />
                      <strong>{row.name}</strong>
                    </div>
                  </td>
                  <td>{row.plan}</td>
                  <td>{formatDate(row.date)}</td>
                  <td>
                    <span className="subtle-pill">{row.method}</span>
                  </td>
                  <td className="right">
                    <strong>{formatCurrency(row.amount)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty">No hay pagos con este filtro en la sede seleccionada.</div>}
        </div>
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={filtered.length}
          pageSizes={PAGE_SIZES}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>
    </>
  );
}
