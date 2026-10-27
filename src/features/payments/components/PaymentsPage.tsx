import { useState, type ReactElement } from 'react';
import { Avatar } from '@/features/members';
import { usePayments, paymentQuery } from '@/features/payments/hooks/usePayments';
import { download } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Pagination } from '@/components/ui/pagination';
import { OptionCards, type Option } from '@/components/ui/option-cards';
import { paymentMethodLabels, paymentMethodOptions } from '@/config/paymentMethods';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { startOfMonth, todayInLima } from '@/utils/limaDate';
import type { PaymentMethod } from '@/types/api.types';

interface PaymentsPageProps {
  /** The branch whose payments are listed. */
  branchId: string;
  /** KPIs and the download are hidden for reception. */
  showSummary?: boolean;
}

type Period = 'today' | 'month';

const periodOptions: Option<string>[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'month', label: 'Este mes' },
];

const PAGE_SIZES = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

interface Kpi {
  label: string;
  value: string;
  icon: IconName;
}

export function PaymentsPage({ branchId, showSummary = true }: PaymentsPageProps): ReactElement {
  const today = todayInLima();
  const [method, setMethod] = useState('all');
  // The screen always opens on today's payments.
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [downloadError, setDownloadError] = useState('');
  const payments = usePayments({ branchId, from, to, method, page, pageSize });

  const presetRanges: Record<Period, { from: string; to: string }> = {
    today: { from: today, to: today },
    month: { from: startOfMonth(today), to: today },
  };
  // A preset is highlighted only while the dates match it exactly; custom dates highlight none.
  const activePeriod = (Object.keys(presetRanges) as Period[]).find((id) => presetRanges[id].from === from && presetRanges[id].to === to) ?? '';

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

  async function downloadCsv(): Promise<void> {
    setDownloadError('');
    try {
      await download('/payments/export', 'pagos.csv', paymentQuery({ branchId, from, to, method }));
    } catch (failure) {
      setDownloadError(describeError(failure));
    }
  }

  const rows = payments.data?.data ?? [];
  const totals = payments.data?.meta.totals;
  const kpis: Kpi[] = totals
    ? [
        { label: 'Total cobrado', value: formatCurrency(totals.amount), icon: 'payments' },
        { label: 'Pagos', value: String(totals.count), icon: 'check' },
        { label: 'Ticket promedio', value: totals.average ? formatCurrency(totals.average) : '—', icon: 'trend' },
        { label: 'Pases del día', value: String(totals.day_passes), icon: 'access' },
        { label: 'Medio más usado', value: totals.top_method ? paymentMethodLabels[totals.top_method as PaymentMethod] : '—', icon: 'plans' },
      ]
    : [];

  return (
    <>
      {showSummary && totals && (
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
      {showSummary && totals && (
        <div className="method-totals" aria-label="Total por medio de pago">
          {paymentMethodOptions.map((option) => (
            <span className="method-total" key={option.value}>
              {option.icon && <Icon name={option.icon} size={16} />}
              {option.label}
              <strong>{formatCurrency(totals.by_method[option.value])}</strong>
            </span>
          ))}
        </div>
      )}
      <section className="card">
        <div className="card-heading">
          <h2>Registro de pagos</h2>
          {showSummary && (
            <Button variant="secondary" title="Descargar los pagos filtrados en CSV" onClick={() => void downloadCsv()}>
              <Icon name="download" size={16} /> Descargar
            </Button>
          )}
        </div>
        {downloadError && (
          <p className="error" role="alert">
            {downloadError}
          </p>
        )}
        <div className="payments-filters">
          <div className="filter-row">
            <div className="date-range">
              <Field label="Desde" as="div">
                <DatePicker label="Desde" today={today} value={from} onChange={changeFrom} />
              </Field>
              <Field label="Hasta" as="div">
                <DatePicker label="Hasta" today={today} value={to} onChange={changeTo} />
              </Field>
              {activePeriod !== 'today' && (
                <IconButton
                  icon="close"
                  label="Volver a hoy"
                  onClick={() => {
                    setFrom(today);
                    setTo(today);
                    setPage(1);
                  }}
                />
              )}
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
          <OptionCards
            label="Filtrar por medio de pago"
            variant="chip"
            options={[{ value: 'all', label: 'Todos' }, ...paymentMethodOptions]}
            value={method}
            onChange={(value) => {
              setMethod(value);
              setPage(1);
            }}
          />
        </div>
        {payments.isError && (
          <p className="error" role="alert">
            {describeError(payments.error)}
          </p>
        )}
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
              {rows.map((row) => {
                const name = row.member?.full_name ?? row.visitor_name ?? 'Visitante';
                return (
                  <tr key={row.id}>
                    <td>{row.receipt.number}</td>
                    <td>
                      <div className="person">
                        <Avatar name={name} />
                        <strong>{name}</strong>
                      </div>
                    </td>
                    <td>{row.plan_label}</td>
                    <td>{formatDate(row.paid_on)}</td>
                    <td>
                      <span className="subtle-pill">{paymentMethodLabels[row.method]}</span>
                    </td>
                    <td className="right">
                      <strong>{formatCurrency(row.amount)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {payments.isPending && <div className="empty">Cargando…</div>}
          {!payments.isPending && rows.length === 0 && <div className="empty">No hay pagos con este filtro en la sede seleccionada.</div>}
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={payments.data?.meta.total ?? 0}
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
