'use client';
import {useEffect,useState,useCallback} from 'react';
import {Users,Wallet,ShieldCheck,Gift,Settings2,History,RefreshCcw,Search,Ban,CheckCircle2,Plus,CalendarClock,Save,Activity,Eye,ClipboardList,BarChart3,FileDown,Printer} from 'lucide-react';
import {PageHeader,Panel,Loading,Notice,Empty} from '@/components/UI';
import {api,formatMoney} from '@/lib/api';
import {BillingStatusBadge} from '@/components/BillingStatusBadge';

type Tab='overview'|'users'|'subscriptions'|'payments'|'referrals'|'campaigns'|'settings'|'audit'|'system'|'analytics';
type Overview={active24h:number;new7d:number;entries7d:number;trialDays:number;premiumRequired:boolean;users:number;blockedUsers:number;activeSubscribers:number;expiringSubscribers:number;expiredSubscribers:number;activeCourtesy:number;receivedCents:number;approvedPayments:number;weeklyPriceCents:number;billingEnabled:boolean;monthlyCampaign:{status:string;message:string}};
type User={id:string;name:string;email:string;phone:string|null;blocked:boolean;blockReason:string;role:string;createdAt:string;lastLoginAt:string|null;lastActivityAt:string|null;trialEndsAt:string|null;subscription?:{status:string;method:string;activeUntil?:string}|null;courtesyUntil?:string|null};
type Subscription={id:string;userId:string;name:string;email:string;method:string;status:string;activeUntil:string|null;cancelAtPeriodEnd:boolean;priceCents:number};
type Payment={id:string;userId:string;name:string;method:string;status:string;amountCents:number;providerPaymentId:string;createdAt:string;paidAt:string|null};
type Referral={id:string;referrerId:string;referrerName:string;referrerPhone:string|null;referredName:string;amountCents:number;status:'available'|'paid'|'reversed';createdAt:string;paidAt:string|null;payoutNote:string};
type ReferralPage=Paged<Referral>&{availableCents:number;paidCents:number;reversedCents:number};
type Campaign={_id:string;id:string;title:string;description:string;reward:string;objectiveCriteria:string;status:'draft'|'published'|'closed';approvedTermsReference?:string;resultSummary?:string;createdAt:string};
type Settings={weeklyPriceCents:number;trialDays:number;premiumRequired:boolean;newRegistrationsOpen:boolean;announcement:string;maintenanceNotice:string;premiumBenefits:string[]};
type Audit={_id:string;action:string;createdAt:string;metadata?:Record<string,unknown>};
type Paged<T>={page:number;limit:number;total:number;items:T[]};
type Courtesy={id:string;userId:string;name:string;email:string;phone:string|null;reason:string;grantedAt:string;activeUntil:string;status:'active'|'expired'};
type Insights={user:{id:string;name:string;email:string;phone:string|null;createdAt:string;lastLoginAt:string|null;lastActivityAt:string|null;blocked:boolean};
 entryCount:number;breakdown:{type:string;category:string;count:number;totalCents:number}[];
 recent:{id:string;type:string;category:string;amountCents:number;occurredOn:string;description:string;source:string}[];
 motorcycle:{model:string;year?:number;odometerKm?:number;kmPerLiter?:number}|null;maintenanceCount:number;pendingMaintenance:number;
 goal:{weeklyTargetCents:number;monthlyTargetCents:number}|null;
 integration:{provider:string;remoteName:string;lastSyncAt:string|null}|null;
 subscription:{status:string;method:string;activeUntil:string|null}|null;courtesy:{activeUntil:string;lastGrantedAt:string;reason:string}|null};
type AdminAnalytics={periodDays:number;generatedAt:string;users:number;activeDrivers:number;newDrivers:number;previousCohort:number;retainedDrivers:number;retentionPercent:number|null;payingSubscribers:number;activeCourtesy:number;cancelAtPeriodEnd:number;activeSubscriptionRatio:number;approvedPayments:number;approvedRevenueCents:number;monthlyProjectionCents:number;privateDeliveries:number;privateCustomers:number;earnings:{type:string;source:string;provider:string;platform:string;count:number;amountCents:number}[];ai:{calls:number;estimatedUsd:number|null};notes:string[]};
type SystemInfo={automation?:{last30d:number;confirmedReceipts:number;activeMaintenancePlans:number;last7d:{feature:string;outcome:string;count:number;inputTokens:number;outputTokens:number;estimatedUsd:number|null}[]};weeklyEmailConfigured:boolean;weeklyEmailSubscribers:number;weeklyEmailSent7d:number;weeklyEmailFailed7d:number;checkedAt:string;apiOnline:boolean;databaseConnected:boolean;uptimeSeconds:number;registeredTotal:number;registered7d:number;active24h:number;active7d:number;entries7d:number;entriesTotal:number;approvedPayments7d:number;approvedCents7d:number;note:string;recentUsers:{id:string;name:string;createdAt:string;lastActivityAt:string|null}[]};
const tabs:{id:Tab;label:string;Icon:typeof Users}[]=[
 {id:'overview',label:'Visão geral',Icon:Wallet},{id:'users',label:'Motoboys',Icon:Users},
 {id:'subscriptions',label:'Assinaturas',Icon:ShieldCheck},{id:'payments',label:'Financeiro',Icon:Wallet},
 {id:'referrals',label:'Indicações',Icon:Gift},
 {id:'campaigns',label:'Campanhas',Icon:Gift},{id:'settings',label:'Configurações',Icon:Settings2},
 {id:'audit',label:'Auditoria',Icon:History},{id:'system',label:'Sistema',Icon:Activity},
 {id:'analytics',label:'Indicadores',Icon:BarChart3}
];
const whatsappHref=(phone:string|null)=>{const d=(phone||'').replace(/\D/g,'');return /^55[1-9]{2}9\d{8}$/.test(d)?`https://wa.me/${d}`:null;};
const date=(v?:string|null)=>v?new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—';
const stateLabel=(status:string)=>({active:'Ativa',pending:'Pendente',expired:'Vencida',expiring:'Vence em breve',canceled:'Cancelada',approved:'Aprovado',refunded:'Estornado',rejected:'Recusado',draft:'Rascunho',published:'Publicada',closed:'Encerrada'} as Record<string,string>)[status]||status;

export default function AdminPage(){
 const [tab,setTab]=useState<Tab>('overview');
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[success,setSuccess]=useState('');
 const [overview,setOverview]=useState<Overview|null>(null);
 const [users,setUsers]=useState<Paged<User>|null>(null),[userSearch,setUserSearch]=useState(''),[userFilter,setUserFilter]=useState('all'),[userPage,setUserPage]=useState(1);
 const [subscriptions,setSubscriptions]=useState<Paged<Subscription>|null>(null),[subStatus,setSubStatus]=useState('all'),[subPage,setSubPage]=useState(1);
 const [courtesies,setCourtesies]=useState<Paged<Courtesy>|null>(null),[courtesyStatus,setCourtesyStatus]=useState('all'),[courtesyPage,setCourtesyPage]=useState(1);
 const [insights,setInsights]=useState<Insights|null>(null),[insightsBusy,setInsightsBusy]=useState(false);
 const [system,setSystem]=useState<SystemInfo|null>(null);
 const [analytics,setAnalytics]=useState<AdminAnalytics|null>(null),[analyticsDays,setAnalyticsDays]=useState(30);
 const [payments,setPayments]=useState<(Paged<Payment>&{approvedCents:number;approvedCount:number})|null>(null);
 const [payStatus,setPayStatus]=useState('all'),[payMethod,setPayMethod]=useState('all'),[payFrom,setPayFrom]=useState(''),[payTo,setPayTo]=useState(''),[payPage,setPayPage]=useState(1);
 const [campaigns,setCampaigns]=useState<Campaign[]>([]),[audit,setAudit]=useState<Audit[]>([]);
 const [referrals,setReferrals]=useState<ReferralPage|null>(null),[referralStatus,setReferralStatus]=useState('all'),[referralPage,setReferralPage]=useState(1);
 const [payoutReferral,setPayoutReferral]=useState<Referral|null>(null),[payoutNote,setPayoutNote]=useState('');
 const [settings,setSettings]=useState<Settings|null>(null),[benefitText,setBenefitText]=useState(''),[priceInput,setPriceInput]=useState('9,99');
 const [actionUser,setActionUser]=useState<User|null>(null),[actionKind,setActionKind]=useState<'block'|'unblock'|'courtesy'>('block'),[reason,setReason]=useState(''),[courtesyDays,setCourtesyDays]=useState(7);
 const [campaignForm,setCampaignForm]=useState({title:'',description:'',reward:'',objectiveCriteria:'',approvedTermsReference:'',resultSummary:''});
 const [editingCampaign,setEditingCampaign]=useState<string|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   if(tab==='overview')setOverview(await api<Overview>('/admin/billing/overview'));
   if(tab==='users')setUsers(await api<Paged<User>>(`/admin/billing/users?page=${userPage}&limit=15&filter=${userFilter}&search=${encodeURIComponent(userSearch)}`));
   if(tab==='subscriptions'){
     const [paid,gifts]=await Promise.all([
       api<Paged<Subscription>>(`/admin/billing/subscriptions?page=${subPage}&limit=15&status=${subStatus}`),
       api<Paged<Courtesy>>(`/admin/billing/courtesies?page=${courtesyPage}&limit=15&status=${courtesyStatus}`)
     ]);
     setSubscriptions(paid);setCourtesies(gifts);
    }
   if(tab==='payments')setPayments(await api<Paged<Payment>&{approvedCents:number;approvedCount:number}>(`/admin/billing/payments?page=${payPage}&limit=15&status=${payStatus}&method=${payMethod}${payFrom?'&from='+payFrom:''}${payTo?'&to='+payTo:''}`));
   if(tab==='referrals')setReferrals(await api<ReferralPage>(`/admin/billing/referrals?page=${referralPage}&limit=15&status=${referralStatus}`));
   if(tab==='campaigns')setCampaigns((await api<{items:Campaign[]}>('/admin/billing/campaigns')).items);
   if(tab==='settings'){const result=await api<{settings:Settings}>('/admin/billing/settings');setSettings(result.settings);setBenefitText(result.settings.premiumBenefits.join('\n'));setPriceInput((result.settings.weeklyPriceCents/100).toFixed(2).replace('.',','));}
   if(tab==='audit')setAudit((await api<{items:Audit[]}>('/admin/billing/audit')).items);
    if(tab==='system')setSystem(await api<SystemInfo>('/admin/billing/system'));
    if(tab==='analytics')setAnalytics(await api<AdminAnalytics>(`/admin/billing/analytics?days=${analyticsDays}`));
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar os dados');}
  finally{setLoading(false);}
 },[tab,userPage,userFilter,userSearch,subPage,subStatus,payPage,payStatus,payMethod,payFrom,payTo,referralPage,referralStatus,courtesyPage,courtesyStatus,analyticsDays]);
 useEffect(()=>{void load();},[load]);
 const run=async(fn:()=>Promise<unknown>,message:string)=>{
  setSaving(true);setError('');setSuccess('');
  try{await fn();setSuccess(message);await load();}
  catch(e){setError(e instanceof Error?e.message:'A operação falhou');}
  finally{setSaving(false);}
 };
 const openInsights=async(user:User)=>{
  setError('');setInsightsBusy(true);
  try{setInsights(await api<Insights>(`/admin/billing/users/${user.id}/insights`));}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar os registros');}
  finally{setInsightsBusy(false);}
 };
 const confirmUser=()=>{
  if(!actionUser)return;
  if(reason.trim().length<5){setError('Informe um motivo de pelo menos cinco caracteres');return;}
  const user=actionUser;
  const fn=actionKind==='courtesy'
   ?()=>api(`/admin/billing/users/${user.id}/courtesy`,{method:'POST',body:JSON.stringify({days:courtesyDays,reason})})
   :()=>api(`/admin/billing/users/${user.id}/access`,{method:'PATCH',body:JSON.stringify({blocked:actionKind==='block',reason})});
  void run(fn,actionKind==='courtesy'?'Cortesia concedida':actionKind==='block'?'Conta bloqueada':'Conta desbloqueada');
  setActionUser(null);setReason('');
 };
 const confirmPayout=async()=>{
  if(!payoutReferral||saving)return;
  const note=payoutNote.trim();
  if(note.length<4){setError('Informe uma observação do repasse de pelo menos quatro caracteres');return;}
  const referralId=payoutReferral.id;
  setSaving(true);setError('');setSuccess('');
  try{
   await api(`/admin/billing/referrals/${encodeURIComponent(referralId)}/mark-paid`,{
    method:'POST',body:JSON.stringify({note})
   });
   setPayoutReferral(null);setPayoutNote('');
   setSuccess('Repasse da indicação registrado como pago');
   await load();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar o repasse');}
  finally{setSaving(false);}
 };
 const saveCampaign=()=>void run(async()=>{
  const path=editingCampaign?`/admin/billing/campaigns/${editingCampaign}`:'/admin/billing/campaigns';
  await api(path,{method:editingCampaign?'PATCH':'POST',body:JSON.stringify(campaignForm)});
  setEditingCampaign(null);setCampaignForm({title:'',description:'',reward:'',objectiveCriteria:'',approvedTermsReference:'',resultSummary:''});
 },'Rascunho de campanha salvo');
 const updateCampaign=(id:string,status:'published'|'closed'|'draft')=>{
  if(status==='published'&&!window.confirm('Você confirma que o regulamento e os critérios objetivos foram aprovados? O sistema não executa sorteios.'))return;
  void run(()=>api(`/admin/billing/campaigns/${id}`,{method:'PATCH',body:JSON.stringify({status})}),'Situação da campanha atualizada');
 };
 return <>
  <PageHeader eyebrow="ADMINISTRAÇÃO • ACESSO EXCLUSIVO" title="Painel MotoPRO" description="Gestão de usuários, atividade, registros, assinaturas, cortesias, financeiro e saúde da API. Consultas individuais são auditadas." actions={<button className="btn secondary" onClick={()=>void load()} disabled={loading}><RefreshCcw size={16}/> Atualizar</button>}/>
  <div className="admin-tabs" role="tablist" aria-label="Módulos administrativos">{tabs.map(({id,label,Icon})=><button role="tab" aria-selected={tab===id} key={id} className={tab===id?'active':''} onClick={()=>{setTab(id);setError('');setSuccess('');}}><Icon size={17}/>{label}</button>)}</div>
  {error&&<Notice kind="error">{error}</Notice>}
  {success&&<Notice kind="success">{success}</Notice>}
  {loading?<Loading/>:<>
   {tab==='overview'&&overview&&<>
    <div className="admin-stat-grid">{[
      {label:'Motoboys cadastrados',value:String(overview.users),Icon:Users},
      {label:'Ativos nas últimas 24 horas',value:String(overview.active24h),Icon:Activity},
      {label:'Novos nos últimos 7 dias',value:String(overview.new7d),Icon:Plus},
      {label:'Lançamentos nos últimos 7 dias',value:String(overview.entries7d),Icon:ClipboardList},
      {label:'Assinaturas pagas ativas',value:String(overview.activeSubscribers),Icon:ShieldCheck},
      {label:'Vencem em 48h',value:String(overview.expiringSubscribers),Icon:CalendarClock},
      {label:'Assinaturas vencidas',value:String(overview.expiredSubscribers),Icon:History},
      {label:'Receita aprovada registrada',value:formatMoney(overview.receivedCents),Icon:Wallet},
      {label:'Contas bloqueadas',value:String(overview.blockedUsers),Icon:Ban}
    ].map(({label,value,Icon})=><div key={label} className="admin-stat"><Icon size={18}/><small>{label}</small><strong>{value}</strong></div>)}</div>
    <div className="two-col"><Panel title="Assinaturas e cortesias" subtitle="Indicadores operacionais"><p><b>{overview.activeCourtesy}</b> contas com cortesia vigente</p><p><b>{overview.approvedPayments}</b> pagamentos Pix aprovados registrados</p><p>Plano para novas adesões: <b>{formatMoney(overview.weeklyPriceCents)} / 7 dias</b></p><p>Pagamento Pix: <b>{overview.billingEnabled?'Habilitado':'Indisponível'}</b></p><p>Acesso Premium obrigatório: <b>Sim — sempre</b></p><p>Teste gratuito definido pelo admin: <b>{overview.trialDays} {overview.trialDays===1?'dia':'dias'}</b></p></Panel><Panel title="Campanhas de premiação" subtitle="Preparação responsável"><p>{overview.monthlyCampaign.message}</p><p className="admin-small">Não há seleção aleatória nem cobrança vinculada à participação em sorteios.</p></Panel></div>
    <p className="admin-small">Os valores consideram pagamentos aprovados no banco. Registros históricos de cartão permanecem disponíveis para auditoria.</p>
   </>}
   {tab==='users'&&<>
    <Panel title="Gerenciar motoboys" subtitle="Pesquisar, bloquear/desbloquear e conceder cortesias com auditoria">
      <div className="admin-toolbar"><div className="admin-search"><Search size={16}/><input aria-label="Buscar entregador" className="input" value={userSearch} onChange={e=>{setUserSearch(e.target.value);setUserPage(1);}} placeholder="Buscar por nome ou e-mail"/></div><select aria-label="Filtrar contas" className="select" value={userFilter} onChange={e=>{setUserFilter(e.target.value);setUserPage(1);}}><option value="all">Todas as contas</option><option value="active">Liberadas</option><option value="blocked">Bloqueadas</option></select></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Motoboy</th><th>Cadastro / último acesso</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{users?.items.map(u=><tr key={u.id}><td><strong>{u.name}</strong><small>{u.email}</small><small>{whatsappHref(u.phone)?<a className="admin-whatsapp" href={whatsappHref(u.phone)!} target="_blank" rel="noopener noreferrer" title="Conversar no WhatsApp">{u.phone} · WhatsApp ↗</a>:(u.phone||'Celular pendente')}</small></td><td>{date(u.createdAt)}<small>Último login: {date(u.lastLoginAt)}</small><small>Última atividade: {date(u.lastActivityAt)}</small></td><td><span className={`admin-status ${u.blocked?'bad':'good'}`}>{u.blocked?'Bloqueado':'Liberado'}</span>{u.courtesyUntil&&new Date(u.courtesyUntil)>new Date()&&<small>Cortesia até {date(u.courtesyUntil)}</small>}</td><td><div className="admin-actions"><button className="btn outline" onClick={()=>void openInsights(u)} disabled={insightsBusy}><Eye size={15}/> Detalhes</button><button className="btn secondary" onClick={()=>{setActionKind('courtesy');setActionUser(u);setReason('Cortesia de suporte');}}>Cortesia</button><button className={`btn ${u.blocked?'secondary':'danger'}`} onClick={()=>{setActionKind(u.blocked?'unblock':'block');setActionUser(u);setReason('');}}>{u.blocked?'Desbloquear':'Bloquear'}</button></div></td></tr>)}</tbody></table></div>
      {users?.items.length===0&&<Empty message="Nenhum motoboy encontrado"/>}
      <Pager page={userPage} total={users?.total??0} pageSize={15} onChange={setUserPage}/>
    </Panel>
   </>}
   {tab==='subscriptions'&&<><Panel title="Assinaturas pagas" subtitle="Vencimento, método e estado confirmado no banco">
     <div className="admin-toolbar"><select className="select" aria-label="Filtrar assinaturas" value={subStatus} onChange={e=>{setSubStatus(e.target.value);setSubPage(1);}}><option value="all">Todos os status</option><option value="active">Ativas</option><option value="expiring">Vencem em 48h</option><option value="pending">Pendentes</option><option value="expired">Vencidas</option><option value="canceled">Canceladas</option></select></div>
     <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Assinante</th><th>Pagamento</th><th>Status</th><th>Valor contratado</th><th>Acesso até</th></tr></thead><tbody>{subscriptions?.items.map(s=><tr key={s.id}><td><strong>{s.name}</strong><small>{s.email}</small></td><td>{s.method==='credit'?'Crédito':'Pix'}</td><td><BillingStatusBadge status={s.status}/>{s.cancelAtPeriodEnd&&<small>Renovação cancelada</small>}</td><td>{formatMoney(s.priceCents)}</td><td>{date(s.activeUntil)}</td></tr>)}</tbody></table></div>
     {!subscriptions?.items.length&&<Empty message="Nenhuma assinatura encontrada"/>}
     <Pager page={subPage} total={subscriptions?.total??0} pageSize={15} onChange={setSubPage}/>
     <p className="admin-small">Somente cobranças reais são contabilizadas como receita.</p>
    </Panel>
    <Panel title="Cortesias nas assinaturas" subtitle="Acessos concedidos administrativamente, sem cobranças fictícias">
     <div className="admin-toolbar"><select className="select" aria-label="Filtrar cortesias" value={courtesyStatus} onChange={e=>{setCourtesyStatus(e.target.value);setCourtesyPage(1);}}><option value="all">Todas</option><option value="active">Vigentes</option><option value="expired">Encerradas</option></select></div>
     <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Motoboy</th><th>Concessão</th><th>Expira em</th><th>Estado</th><th>Motivo</th></tr></thead><tbody>{courtesies?.items.map(c=><tr key={c.id}><td><strong>{c.name}</strong><small>{c.email}</small></td><td>{date(c.grantedAt)}</td><td>{date(c.activeUntil)}</td><td><span className={`admin-status ${c.status==='active'?'good':'bad'}`}>{c.status==='active'?'Vigente':'Encerrada'}</span></td><td>{c.reason}</td></tr>)}</tbody></table></div>
     {!courtesies?.items.length&&<Empty message="Nenhuma cortesia encontrada"/>}
     <Pager page={courtesyPage} total={courtesies?.total??0} pageSize={15} onChange={setCourtesyPage}/>
     <p className="admin-small">Para conceder ou prorrogar, abra a aba Motoboys.</p>
    </Panel></>}
   {tab==='payments'&&<Panel title="Financeiro administrativo" subtitle="Somente pagamentos registrados e conciliados no MotoPRO">
     <div className="admin-toolbar"><select className="select" aria-label="Meio" value={payMethod} onChange={e=>{setPayMethod(e.target.value);setPayPage(1);}}><option value="all">Todos os meios (inclui histórico)</option><option value="pix">Pix</option><option value="credit">Crédito</option></select><select className="select" value={payStatus} aria-label="Status" onChange={e=>{setPayStatus(e.target.value);setPayPage(1);}}><option value="all">Todos os status</option><option value="approved">Aprovados</option><option value="pending">Pendentes</option><option value="rejected">Recusados</option><option value="refunded">Estornados</option><option value="canceled">Cancelados</option></select><label className="admin-date-label">De<input type="date" className="input" value={payFrom} onChange={e=>{setPayFrom(e.target.value);setPayPage(1);}}/></label><label className="admin-date-label">Até<input type="date" className="input" value={payTo} onChange={e=>{setPayTo(e.target.value);setPayPage(1);}}/></label></div>
     <div className="admin-result"><strong>{formatMoney(payments?.approvedCents??0)}</strong><span>{payments?.approvedCount??0} pagamentos aprovados no período/filtros</span></div>
     <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Motoboy</th><th>Data</th><th>Meio</th><th>Status</th><th>Valor</th><th>Referência MP</th></tr></thead><tbody>{payments?.items.map(p=><tr key={p.id}><td>{p.name}</td><td>{date(p.createdAt)}</td><td>{p.method==='credit'?'Crédito':'Pix'}</td><td><BillingStatusBadge status={p.status}/></td><td>{formatMoney(p.amountCents)}</td><td><code>{p.providerPaymentId||'—'}</code></td></tr>)}</tbody></table></div>
     {!payments?.items.length&&<Empty message="Nenhum pagamento encontrado"/>}
     <Pager page={payPage} total={payments?.total??0} pageSize={15} onChange={setPayPage}/>
     <p className="admin-small">Confira a conciliação dos pagamentos no Mercado Pago antes de fechar o financeiro.</p>
   </Panel>}
   {tab==='referrals'&&<Panel title="Bônus por indicação" subtitle="R$ 5 por novo usuário após o primeiro pagamento confirmado">
    <div className="admin-stat-grid">
     <div className="admin-stat"><Wallet size={18}/><small>Disponível para repassar</small><strong>{formatMoney(referrals?.availableCents??0)}</strong></div>
     <div className="admin-stat"><CheckCircle2 size={18}/><small>Já repassado</small><strong>{formatMoney(referrals?.paidCents??0)}</strong></div>
     <div className="admin-stat"><History size={18}/><small>Revertido por estorno</small><strong>{formatMoney(referrals?.reversedCents??0)}</strong></div>
    </div>
    <div className="admin-toolbar"><select className="select" value={referralStatus} onChange={e=>{setReferralStatus(e.target.value);setReferralPage(1);}} aria-label="Filtrar indicações"><option value="all">Todas</option><option value="available">Disponíveis para pagar</option><option value="paid">Pagas</option><option value="reversed">Estornadas</option></select></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Quem indicou</th><th>Novo cadastrado</th><th>Data da premiação</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>{referrals?.items.map(r=><tr key={r.id}><td><strong>{r.referrerName}</strong><small>{whatsappHref(r.referrerPhone)?<a className="admin-whatsapp" href={whatsappHref(r.referrerPhone)!} target="_blank" rel="noopener noreferrer">{r.referrerPhone} · WhatsApp ↗</a>:(r.referrerPhone||'Sem celular')}</small></td><td>{r.referredName}</td><td>{date(r.createdAt)}</td><td>{formatMoney(r.amountCents)}</td><td><span className={`admin-status ${r.status==='paid'?'good':r.status==='reversed'?'bad':'warning'}`}>{r.status==='paid'?'Pago':r.status==='reversed'?'Estornado':'A pagar'}</span>{r.paidAt&&<small>Em {date(r.paidAt)}</small>}{r.payoutNote&&<small>{r.payoutNote}</small>}</td><td>{r.status==='available'?<button className="btn secondary" onClick={()=>{setPayoutReferral(r);setPayoutNote('');}}>Marcar como pago</button>:'—'}</td></tr>)}</tbody></table></div>
    {!referrals?.items.length&&<Empty message="Nenhum bônus com esse status"/>}
    <Pager page={referralPage} total={referrals?.total??0} pageSize={15} onChange={setReferralPage}/>
    <p className="admin-small">Marcar como pago apenas registra um repasse que você já realizou manualmente, por exemplo via Pix. Essa ação NÃO envia dinheiro. Confirme os dados do beneficiário antes de pagar.</p>
   </Panel>}
   {tab==='campaigns'&&<>
    <div className="two-col admin-campaign-grid"><Panel title={editingCampaign?'Editar campanha':'Nova campanha de premiação'} subtitle="Somente benefícios não aleatórios, sujeitos a regulamento aprovado">
     <form className="admin-form" onSubmit={e=>{e.preventDefault();saveCampaign();}}>
      <label>Título<input className="input" required minLength={4} maxLength={100} value={campaignForm.title} onChange={e=>setCampaignForm(v=>({...v,title:e.target.value}))}/></label>
      <label>Prêmio ou benefício<input className="input" required minLength={3} maxLength={250} value={campaignForm.reward} onChange={e=>setCampaignForm(v=>({...v,reward:e.target.value}))}/></label>
      <label>Descrição<textarea className="textarea" rows={3} required minLength={10} maxLength={1200} value={campaignForm.description} onChange={e=>setCampaignForm(v=>({...v,description:e.target.value}))}/></label>
      <label>Critérios objetivos, sem sorteio<textarea className="textarea" rows={3} required minLength={10} maxLength={650} value={campaignForm.objectiveCriteria} onChange={e=>setCampaignForm(v=>({...v,objectiveCriteria:e.target.value}))}/></label>
      <label>Referência da aprovação do regulamento<input className="input" maxLength={250} value={campaignForm.approvedTermsReference} onChange={e=>setCampaignForm(v=>({...v,approvedTermsReference:e.target.value}))} placeholder="Preencher após análise e aprovação"/></label>
      <label>Resultado (quando houver)<textarea className="textarea" rows={2} maxLength={500} value={campaignForm.resultSummary} onChange={e=>setCampaignForm(v=>({...v,resultSummary:e.target.value}))}/></label>
      <div className="admin-actions"><button className="btn" disabled={saving}><Save size={16}/> Salvar rascunho</button>{editingCampaign&&<button className="btn secondary" type="button" onClick={()=>{setEditingCampaign(null);setCampaignForm({title:'',description:'',reward:'',objectiveCriteria:'',approvedTermsReference:'',resultSummary:''});}}>Cancelar edição</button>}</div>
     </form></Panel>
     <Panel title="Campanhas cadastradas" subtitle="Publicação com aprovação, sem execução de sorteios">
      {campaigns.length===0?<Empty message="Nenhuma campanha cadastrada"/>:campaigns.map(c=><div className="admin-campaign" key={c.id||c._id}><strong>{c.title}</strong><small>{c.reward} • {stateLabel(c.status)}</small><p>{c.description}</p><div className="admin-actions"><button className="btn secondary" onClick={()=>{setEditingCampaign(c.id||c._id);setCampaignForm({title:c.title,description:c.description,reward:c.reward,objectiveCriteria:c.objectiveCriteria,approvedTermsReference:c.approvedTermsReference||'',resultSummary:c.resultSummary||''});}}>Editar</button>{c.status==='draft'&&<button className="btn secondary" onClick={()=>updateCampaign(c.id||c._id,'published')}>Publicar</button>}{c.status==='published'&&<button className="btn secondary" onClick={()=>updateCampaign(c.id||c._id,'closed')}>Encerrar</button>}</div></div>)}
      <p className="admin-small">Este módulo não sorteia pessoas nem seleciona vencedores. Premiações aleatórias exigem avaliação e autorização específicas.</p>
     </Panel></div>
   </>}
   {tab==='settings'&&settings&&<Panel title="Configurações comerciais" subtitle="As mudanças são registradas em auditoria; não modificam pagamentos passados">
    <form className="admin-form" onSubmit={e=>{e.preventDefault();const price=Math.round(Number(priceInput.replace(',','.'))*100);if(!Number.isInteger(price)||price<199||price>99900){setError('Preço inválido. Informe um valor entre R$ 1,99 e R$ 999,00');return;}void run(()=>api('/admin/billing/settings',{method:'PATCH',body:JSON.stringify({...settings,premiumRequired:true,weeklyPriceCents:price,premiumBenefits:benefitText.split('\n').map(v=>v.trim()).filter(Boolean)})}),'Configurações salvas');}}>
     <div className="admin-form-cols"><label>Plano semanal, em R$<input className="input" required inputMode="decimal" value={priceInput} onChange={e=>setPriceInput(e.target.value)} placeholder="9,99"/></label><label>Dias gratuitos a contar da criação da conta<input className="input" required type="number" min="0" max="30" value={settings.trialDays} onChange={e=>setSettings(s=>s?({...s,trialDays:Number(e.target.value)}):s)}/></label></div>
     <Notice kind="success">Premium obrigatório para todos os motoboys. {settings.trialDays===0?'Com 0 dias, o acesso fica bloqueado até a aprovação do Pix ou cortesia individual.':`Com ${settings.trialDays} dia(s), apenas contas dentro desse prazo contado desde a criação têm acesso gratuito.`}</Notice>
     <p className="admin-small">Salvar altera imediatamente os dias gratuitos usados na verificação, inclusive em contas já criadas. O período é contado desde o primeiro cadastro; não reinicia no login. Assinaturas Pix pagas e cortesias individuais continuam válidas. Não existe opção para liberar recursos sem direito Premium.</p>
     <label className="admin-toggle"><input type="checkbox" checked={settings.newRegistrationsOpen} onChange={e=>setSettings(s=>s?({...s,newRegistrationsOpen:e.target.checked}):s)}/> Permitir novos cadastros</label>
     <label>Mensagem geral<textarea className="textarea" rows={2} maxLength={500} value={settings.announcement} onChange={e=>setSettings(s=>s?({...s,announcement:e.target.value}):s)}/></label>
     <label>Aviso de manutenção (informativo)<textarea className="textarea" rows={2} maxLength={500} value={settings.maintenanceNotice} onChange={e=>setSettings(s=>s?({...s,maintenanceNotice:e.target.value}):s)}/></label>
     <label>Benefícios Premium (um por linha)<textarea className="textarea" rows={4} value={benefitText} onChange={e=>setBenefitText(e.target.value)}/></label>
     <Notice>Alterar o preço afeta apenas os novos Pix. Contratos históricos de cartão não são alterados.</Notice>
     <button className="btn" disabled={saving}><Save size={16}/> Salvar configurações</button>
    </form>
   </Panel>}
   {tab==='system'&&system&&<>
    <div className="admin-stat-grid">{[
     {label:'API',value:system.apiOnline?'Online':'Indisponível',Icon:Activity},
     {label:'Banco de dados',value:system.databaseConnected?'Conectado':'Sem conexão',Icon:ShieldCheck},
     {label:'Ativos em 24h',value:String(system.active24h),Icon:Users},
     {label:'Ativos em 7 dias',value:String(system.active7d),Icon:Activity},
     {label:'Cadastros em 7 dias',value:String(system.registered7d),Icon:Plus},
     {label:'Lançamentos em 7 dias',value:String(system.entries7d),Icon:ClipboardList},
     {label:'Receita aprovada em 7 dias',value:formatMoney(system.approvedCents7d),Icon:Wallet},
     {label:'Pagamentos aprovados em 7 dias',value:String(system.approvedPayments7d),Icon:CheckCircle2},
     {label:'E-mails semanais ativados',value:String(system.weeklyEmailSubscribers),Icon:Activity},
     {label:'Relatórios enviados em 7 dias',value:String(system.weeklyEmailSent7d),Icon:CheckCircle2},
     {label:'Falhas de envio em 7 dias',value:String(system.weeklyEmailFailed7d),Icon:History},
     {label:'Chamadas de IA em 30 dias',value:String(system.automation?.last30d??0),Icon:Activity},
     {label:'Comprovantes confirmados',value:String(system.automation?.confirmedReceipts??0),Icon:ClipboardList},
     {label:'Planos de manutenção ativos',value:String(system.automation?.activeMaintenancePlans??0),Icon:Activity}
    ].map(({label,value,Icon})=><div className="admin-stat" key={label}><Icon size={18}/><small>{label}</small><strong>{value}</strong></div>)}</div>
    {system.automation&&<Panel title="Consumo de inteligência artificial · últimos 7 dias" subtitle="Chamadas agregadas; nenhuma imagem ou transcrição é armazenada nas métricas">
     <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Recurso</th><th>Resultado</th><th>Chamadas</th><th>Tokens</th><th>Custo estimado (USD)</th></tr></thead><tbody>{system.automation.last7d.map((v,i)=><tr key={i}><td>{v.feature==='transcription'?'Transcrição':v.feature==='receipt'?'Comprovantes':'Interpretação'}</td><td>{v.outcome==='success'?'OK':v.outcome==='failed'?'Falhou':'Modo básico'}</td><td>{v.count}</td><td>{(v.inputTokens+v.outputTokens).toLocaleString('pt-BR')}</td><td>{v.estimatedUsd===null?'Não configurado':`US$ ${v.estimatedUsd.toFixed(5)}`}</td></tr>)}</tbody></table></div>
     {!system.automation.last7d.length&&<p className="field-hint">Sem uso registrado nos últimos 7 dias.</p>}
     <p className="admin-small">Valores em dólar são estimados somente quando OPENAI_INPUT_USD_PER_1M e OPENAI_OUTPUT_USD_PER_1M estiverem configuradas. Transcrições de áudio podem ser cobradas por outro critério; confira a fatura oficial da OpenAI.</p>
    </Panel>}
    <div className="two-col">
     <Panel title="Operação" subtitle={`Conferido em ${date(system.checkedAt)}`}>
      <p>Motoboys cadastrados: <strong>{system.registeredTotal}</strong></p>
      <p>Provedor de e-mail: <strong>{system.weeklyEmailConfigured?'Configurado':'Não configurado'}</strong> · Agendador: verificar Heroku Scheduler</p>
      <p>Lançamentos registrados: <strong>{system.entriesTotal}</strong></p>
      <p>Uptime deste processo da API: <strong>{Math.floor(system.uptimeSeconds/3600)}h {Math.floor((system.uptimeSeconds%3600)/60)}min</strong></p>
      <p className="admin-small">{system.note}</p>
     </Panel>
     <Panel title="Cadastros recentes">
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>Cadastro</th><th>Última atividade</th></tr></thead><tbody>{system.recentUsers.map(u=><tr key={u.id}><td>{u.name}</td><td>{date(u.createdAt)}</td><td>{date(u.lastActivityAt)}</td></tr>)}</tbody></table></div>
     </Panel>
    </div>
   </>}

   {tab==='analytics'&&analytics&&<>
    <Panel title="Análise de negócio" subtitle="Indicadores agregados de assinaturas, atividade e adoção. Não substitui a contabilidade.">
     <div className="phase3-header-actions" style={{marginBottom:14}}>
      <label className="phase3-inline-filter">Período <select className="select" value={analyticsDays} onChange={e=>setAnalyticsDays(Number(e.target.value))}><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option></select></label>
      <button className="btn secondary" onClick={()=>{
       const csv=(v:string)=>`"${(/^[=+@-]/.test(v)?"'"+v:v).replace(/"/g,'""')}"`;
       const rows=[['Indicador','Valor'],['Total de motoboys',String(analytics.users)],['Ativos no período',String(analytics.activeDrivers)],['Novos cadastros',String(analytics.newDrivers)],['Assinaturas pagas ativas',String(analytics.payingSubscribers)],['Cortesias ativas',String(analytics.activeCourtesy)],['Receita aprovada no período (R$)',(analytics.approvedRevenueCents/100).toFixed(2).replace('.',',')],['Projeção mensal teórica (R$)',(analytics.monthlyProjectionCents/100).toFixed(2).replace('.',',')],['Entregas particulares cadastradas',String(analytics.privateDeliveries)],['Uso de IA',String(analytics.ai.calls)],['Retenção da coorte (%)',analytics.retentionPercent===null?'Sem coorte':String(analytics.retentionPercent)]].map(line=>line.map(csv).join(';'));
       const blob=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`motopro-admin-indicadores-${analyticsDays}d.csv`;link.click();URL.revokeObjectURL(url);
      }}><FileDown size={16}/> Exportar CSV</button>
      <button className="btn secondary" onClick={()=>window.print()}><Printer size={16}/> Salvar PDF</button>
     </div>
     <div className="admin-stat-grid">{[
      {label:'Motoboys cadastrados',value:String(analytics.users),Icon:Users},
      {label:'Ativos em '+analyticsDays+' dias',value:String(analytics.activeDrivers),Icon:Activity},
      {label:'Novos cadastros',value:String(analytics.newDrivers),Icon:Plus},
      {label:'Assinaturas pagas ativas',value:String(analytics.payingSubscribers),Icon:ShieldCheck},
      {label:'Cortesias ativas',value:String(analytics.activeCourtesy),Icon:Gift},
      {label:'Assinaturas com cancelamento programado',value:String(analytics.cancelAtPeriodEnd),Icon:CalendarClock},
      {label:'Pagamentos aprovados',value:String(analytics.approvedPayments),Icon:CheckCircle2},
      {label:'Receita aprovada',value:formatMoney(analytics.approvedRevenueCents),Icon:Wallet},
      {label:'Projeção mensal teórica',value:formatMoney(analytics.monthlyProjectionCents),Icon:Wallet},
      {label:'Assinantes / cadastrados',value:analytics.activeSubscriptionRatio+'%',Icon:Users},
      {label:'Retenção de coorte',value:analytics.retentionPercent===null?'N/D':analytics.retentionPercent+'%',Icon:Activity},
      {label:'Entregas particulares no período',value:String(analytics.privateDeliveries),Icon:ClipboardList},
      {label:'Clientes particulares cadastrados',value:String(analytics.privateCustomers),Icon:Users},
      {label:'Utilizações de IA',value:String(analytics.ai.calls),Icon:Activity}
     ].map(({label,value,Icon})=><div className="admin-stat" key={label}><Icon size={18}/><small>{label}</small><strong>{value}</strong></div>)}</div>
    </Panel>
    <Panel title="Uso agregado dos lançamentos" subtitle="Dados do período por origem cadastrada; sem identificação de motoboys">
     <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tipo</th><th>Origem</th><th>Quantidade</th><th>Valor</th></tr></thead><tbody>{analytics.earnings.map((r,i)=><tr key={i}><td>{r.type==='income'?'Receita':'Despesa'}</td><td>{r.provider||r.platform||r.source||'Não informada'}</td><td>{r.count}</td><td>{formatMoney(r.amountCents)}</td></tr>)}</tbody></table></div>
     {!analytics.earnings.length&&<Empty message="Sem lançamentos nesse período."/>}
    </Panel>
    <Panel title="Como interpretar estes números" subtitle={`Gerado em ${date(analytics.generatedAt)}`}><div className="stack">{analytics.notes.map((n,i)=><p key={i} className="admin-small">{n}</p>)}<p className="admin-small">Estimativa de custo IA: {analytics.ai.estimatedUsd===null?'não configurada':'US$ '+analytics.ai.estimatedUsd.toFixed(5)}.</p></div></Panel>
   </>}
   {tab==='audit'&&<Panel title="Histórico de ações administrativas" subtitle="Mudanças de bloqueio, cortesias, campanhas e configurações">
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Quando</th><th>Ação</th><th>Informações</th></tr></thead><tbody>{audit.map(x=><tr key={x._id}><td>{date(x.createdAt)}</td><td><code>{x.action}</code></td><td><small>{Object.entries(x.metadata||{}).map(([k,v])=>`${k}: ${String(v)}`).join(' · ').slice(0,180)||'—'}</small></td></tr>)}</tbody></table></div>
    {!audit.length&&<Empty message="Nenhuma ação administrativa registrada"/>}
   </Panel>}
  </>}
  {insights&&<div className="admin-modal-overlay" role="presentation"><div className="admin-modal" role="dialog" aria-modal="true" aria-label="Detalhes do motoboy" style={{width:'min(96vw,760px)',maxWidth:760,maxHeight:'88vh',overflowY:'auto'}}>
    <div className="row-between"><h2>Dados cadastrados por {insights.user.name}</h2><button className="btn secondary" onClick={()=>setInsights(null)}>Fechar</button></div>
    <p className="admin-small">Consulta individual restrita ao administrador e registrada na auditoria.</p>
    <div className="admin-stat-grid"><div className="admin-stat"><small>Lançamentos</small><strong>{insights.entryCount}</strong></div><div className="admin-stat"><small>Manutenções</small><strong>{insights.maintenanceCount}</strong></div><div className="admin-stat"><small>Manutenções pendentes</small><strong>{insights.pendingMaintenance}</strong></div></div>
    <p><strong>Último login:</strong> {date(insights.user.lastLoginAt)} · <strong>Última atividade:</strong> {date(insights.user.lastActivityAt)}</p>
    <p><strong>Moto:</strong> {insights.motorcycle?`${insights.motorcycle.model} · ${insights.motorcycle.year||'ano não informado'} · ${insights.motorcycle.odometerKm??0} km`:'Não cadastrada'}</p>
    <p><strong>Rappidex:</strong> {insights.integration?`${insights.integration.remoteName} · sincronização ${date(insights.integration.lastSyncAt)}`:'Não integrado'}</p>
    <p><strong>Meta semanal:</strong> {insights.goal?.weeklyTargetCents?formatMoney(insights.goal.weeklyTargetCents):'Não cadastrada'} · <strong>Meta mensal:</strong> {insights.goal?.monthlyTargetCents?formatMoney(insights.goal.monthlyTargetCents):'Não cadastrada'}</p>
    <p><strong>Assinatura:</strong> {insights.subscription?stateLabel(insights.subscription.status):'Sem assinatura'} · <strong>Cortesia:</strong> {insights.courtesy?`até ${date(insights.courtesy.activeUntil)}`:'Não cadastrada'}</p>
    <h3>Resumo dos lançamentos</h3>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tipo</th><th>Categoria</th><th>Quantidade</th><th>Valor registrado</th></tr></thead><tbody>{insights.breakdown.map((c,i)=><tr key={i}><td>{c.type==='income'?'Receita':'Despesa'}</td><td>{c.category}</td><td>{c.count}</td><td>{formatMoney(c.totalCents)}</td></tr>)}</tbody></table></div>
    <h3>Últimos registros</h3>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Origem</th></tr></thead><tbody>{insights.recent.map(x=><tr key={x.id}><td>{x.occurredOn}</td><td>{x.category}</td><td>{x.description||'—'}</td><td>{x.type==='income'?'+':'−'} {formatMoney(x.amountCents)}</td><td>{x.source}</td></tr>)}</tbody></table></div>
    <div className="admin-actions"><button className="btn" onClick={()=>setInsights(null)}>Concluir consulta</button></div>
   </div></div>}
   {payoutReferral&&<div className="admin-modal-overlay" role="presentation"><div className="admin-modal" role="dialog" aria-modal="true" aria-label="Registrar repasse de indicação"><h2>Confirmar repasse</h2><p><strong>{payoutReferral.referrerName}</strong> · {formatMoney(payoutReferral.amountCents)}</p><p>Confirme somente depois de realizar o Pix ou outro repasse fora do MotoPRO.</p><label>Comprovante ou observação do pagamento<input className="input" maxLength={240} minLength={4} placeholder="Ex.: Pix enviado em 10/11/2026" value={payoutNote} onChange={e=>setPayoutNote(e.target.value)}/></label><div className="admin-actions"><button className="btn secondary" onClick={()=>setPayoutReferral(null)}>Cancelar</button><button className="btn" disabled={saving||payoutNote.trim().length<4} onClick={confirmPayout}><CheckCircle2 size={16}/> Confirmar pagamento</button></div></div></div>}
  {actionUser&&<div className="admin-modal-overlay" role="presentation"><div className="admin-modal" role="dialog" aria-modal="true" aria-label="Confirmar ação"><h2>{actionKind==='courtesy'?'Conceder cortesia':actionKind==='block'?'Bloquear conta':'Desbloquear conta'}</h2><p><b>{actionUser.name}</b> · {actionUser.email}</p>{actionKind==='courtesy'&&<label>Dias (1 a 30)<input className="input" type="number" min="1" max="30" value={courtesyDays} onChange={e=>setCourtesyDays(Number(e.target.value))}/></label>}<label>Motivo obrigatório<textarea className="textarea" value={reason} onChange={e=>setReason(e.target.value)} maxLength={240} minLength={5}/></label><div className="admin-actions"><button className="btn secondary" onClick={()=>setActionUser(null)}>Cancelar</button><button className="btn" disabled={saving||reason.trim().length<5} onClick={confirmUser}><CheckCircle2 size={16}/> Confirmar</button></div></div></div>}
 </>;
}
function Pager({page,total,pageSize,onChange}:{page:number;total:number;pageSize:number;onChange:(v:number)=>void}){
 const max=Math.max(1,Math.ceil(total/pageSize));
 return <div className="admin-pager"><span>{total} registros · página {page} de {max}</span><div><button className="btn secondary" disabled={page<=1} onClick={()=>onChange(page-1)}>Anterior</button><button className="btn secondary" disabled={page>=max} onClick={()=>onChange(page+1)}>Próxima</button></div></div>;
}
