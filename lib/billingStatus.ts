/** Um único padrão visual para estados financeiros e assinaturas.
 * A cor principal do MotoPRO permanece laranja; verde é exclusivo de sucesso.
 */
export type BillingStatusTone = 'approved' | 'pending' | 'canceled' | 'neutral';

export const billingStatusTone = (status:string):BillingStatusTone => {
  switch(status.trim().toLowerCase()){
    case 'approved':
    case 'paid':
    case 'active':
    case 'authorized':
      return 'approved';
    case 'pending':
    case 'in_process':
    case 'in_mediation':
    case 'expiring':
    case 'waiting':
      return 'pending';
    case 'canceled':
    case 'cancelled':
    case 'rejected':
    case 'refunded':
    case 'charged_back':
    case 'expired':
      return 'canceled';
    default:
      return 'neutral';
  }
};

export const billingStatusLabel = (status:string):string => ({
  approved:'Aprovado',paid:'Aprovado',authorized:'Aprovado',
  active:'Ativa',pending:'Pendente',in_process:'Pendente',
  in_mediation:'Pendente',waiting:'Aguardando pagamento',
  expiring:'Vence em breve',expired:'Vencida',
  canceled:'Cancelado',cancelled:'Cancelado',
  rejected:'Recusado',refunded:'Estornado',charged_back:'Contestação',
} as Record<string,string>)[status.trim().toLowerCase()]||status;
