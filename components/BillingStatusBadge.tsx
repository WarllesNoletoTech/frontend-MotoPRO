import {billingStatusLabel,billingStatusTone} from '@/lib/billingStatus';

/** Exibe o status real vindo da API. Não altera a situação do pagamento. */
export function BillingStatusBadge({status}:{status:string}){
  const tone=billingStatusTone(status);
  return <span className={`billing-status billing-status--${tone}`} data-billing-status={status}>
    <span className="billing-status-dot" aria-hidden="true"/>{billingStatusLabel(status)}
  </span>;
}
