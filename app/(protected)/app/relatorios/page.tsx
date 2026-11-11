'use client';
import {useEffect,useState} from 'react';
import {ClipboardCopy,FileDown,RefreshCw,Share2,Mail,MailCheck,MailX} from 'lucide-react';
import {api,formatMoney,dateLabel,categoryLabel} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading,Empty} from '@/components/UI';

type Report={period:{from:string;to:string};generatedAt:string;incomeCents:number;expenseCents:number;profitCents:number;
 previousProfitCents:number;profitChangeCents:number;entriesCount:number;integratedCount:number;
 categories:{type:string;category:string;totalCents:number;count:number}[];
 byDay:{day:string;incomeCents:number;expenseCents:number}[];message:string};
type ReportEmailSettings={email:string;enabled:boolean;pendingVerification:boolean;configured:boolean};
type ReportDelivery={period:{from:string;to:string};status:'pending'|'sending'|'sent'|'failed';sentAt:string|null;attempts:number};
const label=(r:Report)=>`${dateLabel(r.period.from)} a ${dateLabel(r.period.to)}`;
const reportText=(r:Report)=>[
 `MotoPRO — Fechamento semanal (${label(r)})`,
 `Ganhos: ${formatMoney(r.incomeCents)}`,
 `Despesas: ${formatMoney(r.expenseCents)}`,
 `Lucro estimado: ${formatMoney(r.profitCents)}`,
 `Lançamentos: ${r.entriesCount} (${r.integratedCount} integrados)`,
 `Diferença de lucro vs. semana anterior: ${formatMoney(r.profitChangeCents)}`,
 'Valores baseados nos registros do aplicativo.'
].join('\n');

export default function ReportsPage(){
 const [weeksAgo,setWeeksAgo]=useState(1),[report,setReport]=useState<Report|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [mailSettings,setMailSettings]=useState<ReportEmailSettings|null>(null);
 const [deliveries,setDeliveries]=useState<ReportDelivery[]>([]);
 const [mailBusy,setMailBusy]=useState(false);
 const refreshMail=()=>Promise.all([
  api<ReportEmailSettings>('/account/report-email').then(setMailSettings),
  api<{items:ReportDelivery[]}>('/reports/deliveries').then(r=>setDeliveries(r.items))
 ]);
 useEffect(()=>{
  let active=true;
  const token=new URLSearchParams(window.location.search).get('confirmarRelatorio');
  const load=async()=>{
   if(token){
    try{
     await api('/account/report-email/confirm',{method:'POST',body:JSON.stringify({token})});
     if(active)setMessage('E-mail confirmado! Você receberá automaticamente o fechamento semanal.');
    }catch(e){if(active)setError(e instanceof Error?e.message:'Não foi possível confirmar o e-mail.');}
    finally{window.history.replaceState(null,'',window.location.pathname);}
   }
   await refreshMail().catch(e=>{if(active)setError(e instanceof Error?e.message:'Não foi possível consultar o envio automático.');});
  };
  void load();return()=>{active=false;};
 },[]);
 const updateMail=async(action:'request'|'disable')=>{
  setMailBusy(true);setError('');setMessage('');
  try{
   if(action==='request'){
    await api('/account/report-email/request',{method:'POST'});
    setMessage('Enviamos um link de confirmação para seu e-mail. Confira a caixa de entrada e o spam.');
   }else{
    await api('/account/report-email',{method:'DELETE'});
    setMessage('O envio automático dos relatórios foi desativado.');
   }
   await refreshMail();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível atualizar a preferência.');}
  finally{setMailBusy(false);}
 };
 useEffect(()=>{
  let active=true;setLoading(true);setError('');
  api<Report>(`/reports/weekly?weeksAgo=${weeksAgo}`).then(r=>{if(active)setReport(r);})
   .catch(e=>{if(active){setError(e instanceof Error?e.message:'Falha ao carregar relatório');setReport(null);}})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[weeksAgo]);
 const copy=async()=>{if(!report)return;try{await navigator.clipboard.writeText(reportText(report));setMessage('Resumo copiado.');}catch{setError('Não foi possível copiar. Use o compartilhamento.');}};
 const exportCsv=()=>{
  if(!report)return;
  const quote=(s:string)=>`"${s.replace(/"/g,'""')}"`;
  const rows=[['Categoria','Tipo','Quantidade','Valor (R$)'].join(';'),
   ...report.categories.map(c=>[categoryLabel(c.category),c.type==='income'?'Receita':'Despesa',String(c.count),(c.totalCents/100).toFixed(2).replace('.',',')].map(quote).join(';'))];
  const blob=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`motopro-fechamento-${report.period.from}.csv`;link.click();URL.revokeObjectURL(url);
 };
 return <>
  <PageHeader eyebrow="SEU FECHAMENTO FINANCEIRO" title="Relatório semanal" description="Relatórios calculados automaticamente a partir dos lançamentos, de terça a segunda-feira."/>
  <Panel title="Selecionar período" subtitle="Por padrão, mostramos a última semana concluída">
   <div className="admin-toolbar">
    <label>Semana
     <select className="select" value={weeksAgo} onChange={e=>{setWeeksAgo(Number(e.target.value));setMessage('');}}>
      <option value={0}>Semana atual (parcial)</option>
      {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i===0?'Última semana concluída':`${i+1} semanas atrás`}</option>)}
     </select>
    </label>
    <button className="btn secondary" onClick={()=>setWeeksAgo(v=>v===0?1:0)}><RefreshCw size={16}/> Alternar atual/anterior</button>
   </div>
  </Panel>
  <Panel title="Receber fechamento semanal por e-mail" subtitle="Opcional · privacidade e confirmação do endereço">
   {!mailSettings?<Loading/>:<div className="stack">
    <p>O relatório da última semana encerrada (terça a segunda) pode ser enviado automaticamente para <strong>{mailSettings.email}</strong>. Ative somente se você usa esse e-mail.</p>
    {mailSettings.enabled?<>
      <Notice kind="success"><MailCheck size={17}/> E-mail confirmado. O envio semanal está ativado.</Notice>
      <button className="btn secondary" disabled={mailBusy} onClick={()=>void updateMail('disable')}><MailX size={17}/> {mailBusy?'Salvando...':'Desativar envio automático'}</button>
    </>:<>
      {mailSettings.pendingVerification&&<Notice>Confirmação pendente. Abra o link que enviamos para seu e-mail. Ele vale por 24 horas.</Notice>}
      {!mailSettings.configured&&<Notice kind="error">Envio automático indisponível: falta configurar o provedor de e-mails no servidor. Os relatórios manuais continuam funcionando.</Notice>}
      <button className="btn secondary" disabled={mailBusy||!mailSettings.configured} onClick={()=>void updateMail('request')}><Mail size={17}/> {mailBusy?'Enviando...':mailSettings.pendingVerification?'Reenviar confirmação':'Ativar envio por e-mail'}</button>
    </>}
    <p className="tiny-note">Somente você controla essa preferência. Os números financeiros não são enviados sem confirmar o endereço. O agendamento é operado pelo servidor.</p>
    {!!deliveries.length&&<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Semana</th><th>Envio</th><th>Data</th></tr></thead><tbody>{deliveries.map((item,i)=><tr key={i}><td>{dateLabel(item.period.from)} a {dateLabel(item.period.to)}</td><td>{item.status==='sent'?'Enviado':item.status==='failed'?'Falhou':item.status==='sending'?'Processando':'Pendente'}</td><td>{item.sentAt?new Date(item.sentAt).toLocaleString('pt-BR'):'—'}</td></tr>)}</tbody></table></div>}
   </div>}
  </Panel>
  {error&&<Notice kind="error">{error}</Notice>}
  {message&&<Notice kind="success">{message}</Notice>}
  {loading?<Loading/>:report&&<>
   <div className="admin-stat-grid">
    <div className="admin-stat"><small>Ganhos · {label(report)}</small><strong>{formatMoney(report.incomeCents)}</strong></div>
    <div className="admin-stat"><small>Despesas</small><strong>{formatMoney(report.expenseCents)}</strong></div>
    <div className="admin-stat"><small>Lucro estimado</small><strong>{formatMoney(report.profitCents)}</strong></div>
    <div className="admin-stat"><small>Variação vs. semana anterior</small><strong>{formatMoney(report.profitChangeCents)}</strong></div>
    <div className="admin-stat"><small>Lançamentos</small><strong>{report.entriesCount}</strong></div>
    <div className="admin-stat"><small>Importados automaticamente</small><strong>{report.integratedCount}</strong></div>
   </div>
   <Panel title="Detalhamento por categoria" subtitle="Valores agrupados conforme os lançamentos">
    {!report.categories.length?<Empty message="Sem lançamentos nesse período"/>:
     <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Categoria</th><th>Tipo</th><th>Quantidade</th><th>Total</th></tr></thead><tbody>
      {report.categories.map((c,i)=><tr key={i}><td>{categoryLabel(c.category)}</td><td>{c.type==='income'?'Receita':'Despesa'}</td><td>{c.count}</td><td>{formatMoney(c.totalCents)}</td></tr>)}
     </tbody></table></div>}
    <div className="admin-actions">
     <button className="btn secondary" onClick={()=>void copy()}><ClipboardCopy size={16}/> Copiar resumo</button>
     <button className="btn secondary" onClick={exportCsv}><FileDown size={16}/> Exportar CSV</button>
     <a className="btn secondary" href={`https://wa.me/?text=${encodeURIComponent(reportText(report))}`} target="_blank" rel="noopener noreferrer"><Share2 size={16}/> Compartilhar WhatsApp</a>
    </div>
   </Panel>
   <p className="tiny-note">{report.message} O envio periódico por e-mail requer ativação e confirmação da sua conta, além do agendador configurado no Heroku.</p>
  </>}
 </>;
}
