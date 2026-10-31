import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useCatalog } from '@/features/gym';
import { CollectDialog } from '@/features/sales/components/CollectDialog';
import { usePendingBalances, useSalesReport } from '@/features/sales/hooks/useSales';
import type { PendingBalance } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { OptionCards, type Option } from '@/components/ui/option-cards';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { startOfMonth, todayInLima } from '@/utils/limaDate';
import '@/features/sales/sales.css';

interface SalesPageProps {
  /** The branch where the user works: where a pending sale is collected. */
  branchId: string;
  /** The report is for the admin; reception only sees who owes and collects. */
  showReport: boolean;
  onDone: (message: string) => void;
}

const groupOptions: Option<'day' | 'month'>[] = [
  { value: 'day', label: 'Por día' },
  { value: 'month', label: 'Por mes' },
];

/** `2026-10-30` -> `30/10/2026`; a month `2026-10` -> `10/2026`. */
function periodLabel(period: string): string {
  return period.length === 7 ? `${period.slice(5)}/${period.slice(0, 4)}` : formatDate(period);
}

interface Tile {
  label: string;
  value: string;
  icon: IconName;
}

/** Product sales: the report with its filters (admin) and who owes what, with "Cobrar". Separate from membership income. */
export function SalesPage({ branchId, showReport, onDone }: SalesPageProps): ReactElement {
  const today = todayInLima();
  const { branches, branchLabel } = useCatalog();
  const accessible = branches.filter((branch) => branch.accessible);
  const [from, setFrom] = useState(startOfMonth(today));
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [branchFilter, setBranchFilter] = useState('all');
  const [collecting, setCollecting] = useState<PendingBalance | null>(null);
  const report = useSalesReport({ from, to, groupBy, branchId: branchFilter === 'all' ? undefined : branchFilter }, showReport);
  const pendings = usePendingBalances();
  const totals = report.data?.totals;
  const owed = (pendings.data ?? []).reduce((sum, row) => sum + Math.round(Number(row.balance) * 100), 0) / 100;

  function changeFrom(value: string): void {
    setFrom(value);
    if (value > to) setTo(value);
  }
  function changeTo(value: string): void {
    setTo(value);
    if (value < from) setFrom(value);
  }

  const tiles: Tile[] = totals
    ? [
        { label: 'Total vendido', value: formatCurrency(totals.total_sold), icon: 'cash' },
        { label: 'Cobrado', value: formatCurrency(totals.collected_total), icon: 'check' },
        { label: 'Pendiente de cobro', value: formatCurrency(totals.pending_total), icon: 'clock' },
        { label: 'Unidades vendidas', value: String(totals.units), icon: 'cart' },
      ]
    : [];

  return (
    <div className="sales-page">
      {showReport && (
        <section className="card">
          <div className="card-heading">
            <h2>Ventas de productos</h2>
          </div>
          <div className="payments-filters">
            <div className="filter-row">
              <div className="date-range">
                <Field label="Desde" as="div">
                  <DatePicker label="Desde" today={today} value={from} onChange={changeFrom} />
                </Field>
                <Field label="Hasta" as="div">
                  <DatePicker label="Hasta" today={today} value={to} onChange={changeTo} />
                </Field>
              </div>
              <OptionCards label="Agrupar" variant="chip" options={groupOptions} value={groupBy} onChange={setGroupBy} />
            </div>
            {accessible.length > 1 && (
              <Field label="Sede" as="div">
                <OptionCards
                  label="Filtrar por sede"
                  variant="chip"
                  options={[{ value: 'all', label: 'Todas' }, ...accessible.map((branch) => ({ value: branch.id, label: branchLabel(branch.id) }))]}
                  value={branchFilter}
                  onChange={setBranchFilter}
                />
              </Field>
            )}
          </div>
          {report.isError && (
            <p className="error" role="alert">
              {describeError(report.error)}
            </p>
          )}
          {totals && (
            <div className="metrics payment-metrics" aria-label="Totales de ventas">
              {tiles.map((tile) => (
                <article className="card metric tone-money" key={tile.label}>
                  <span className="metric-icon">
                    <Icon name={tile.icon} size={20} />
                  </span>
                  <span className="metric-text">
                    <span className="metric-label">{tile.label}</span>
                    <strong className="metric-value">{tile.value}</strong>
                  </span>
                </article>
              ))}
            </div>
          )}
          {report.data && (
            <div className="sales-tables">
              <div className="table-scroll">
                <table aria-label="Ventas por producto">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="right">Unidades</th>
                      <th className="right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.by_product.length === 0 && (
                      <tr>
                        <td colSpan={3} className="muted">
                          No hay ventas en este periodo.
                        </td>
                      </tr>
                    )}
                    {report.data.by_product.map((row) => (
                      <tr key={row.product_id}>
                        <td>
                          <strong>{row.name}</strong>
                        </td>
                        <td className="right">{row.units}</td>
                        <td className="right">{formatCurrency(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-scroll">
                <table aria-label="Ventas por periodo">
                  <thead>
                    <tr>
                      <th>{groupBy === 'day' ? 'Día' : 'Mes'}</th>
                      <th className="right">Ventas</th>
                      <th className="right">Unidades</th>
                      <th className="right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.by_period.map((row) => (
                      <tr key={row.period}>
                        <td>{periodLabel(row.period)}</td>
                        <td className="right">{row.sales_count}</td>
                        <td className="right">{row.units}</td>
                        <td className="right">{formatCurrency(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
      <section className="card">
        <div className="card-heading">
          <h2>Pendiente de cobro</h2>
          {pendings.data && pendings.data.length > 0 && <span className="subtle-pill">Total {formatCurrency(owed)}</span>}
        </div>
        {pendings.isError && (
          <p className="error" role="alert">
            {describeError(pendings.error)}
          </p>
        )}
        {pendings.isSuccess && pendings.data.length === 0 && <p className="muted pending-empty">No hay ventas pendientes de cobro.</p>}
        {pendings.data && pendings.data.length > 0 && (
          <div className="table-scroll">
            <table aria-label="Pendientes por miembro">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Desde</th>
                  <th className="right">Ventas</th>
                  <th className="right">Pendiente</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {pendings.data.map((row) => (
                  <tr key={row.member.id}>
                    <td>
                      <strong>{row.member.full_name}</strong>
                      <small className="block-small">{row.member.document_number}</small>
                    </td>
                    <td>{formatDate(row.oldest_sold_on)}</td>
                    <td className="right">{row.pending_count}</td>
                    <td className="right">
                      <strong>{formatCurrency(row.balance)}</strong>
                    </td>
                    <td className="right">
                      <Button variant="secondary" onClick={() => setCollecting(row)}>
                        Cobrar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {collecting && <CollectDialog memberId={collecting.member.id} memberName={collecting.member.full_name} branchId={branchId} onClose={() => setCollecting(null)} onDone={onDone} />}
    </div>
  );
}
