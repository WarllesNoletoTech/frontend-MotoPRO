'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {LayoutDashboard,ReceiptText,Mic2,Bike,Target,Plug,ShieldCheck,LogOut,Settings,Gift,ChevronRight,LoaderCircle,Menu,X,Wallet,CalendarClock,LockKeyhole,QrCode,FileBarChart2} from 'lucide-react';
import {api} from '@/lib/api';
import {readBillingStatus} from '@/lib/billingContract';
import CompletePhone from '@/components/CompletePhone';
import CompleteName from '@/components/CompleteName';
import {pixOrderRequestOptions} from '@/lib/mpDevice';
const navigation=[
 {href:'/app',label:'Visão geral',Icon:LayoutDashboard},
 {href:'/app/lancamentos',label:'Lançamentos',Icon:ReceiptText},
 {href:'/app/assistente',label:'Assistente',Icon:Mic2},
 {href:'/app/moto',label:'Minha moto',Icon:Bike},
 {href:'/app/metas',label:'Metas',Icon:Target},
 {href:'/app/integracoes',label:'Integrações',Icon:Plug},
 {href:'/app/assinatura',label:'Assinatura',Icon:ShieldCheck},
 {href:'/app/premiacoes',label:'Benefícios',Icon:Gift},
 {href:'/app/indicacoes',label:'Indique e ganhe',Icon:Wallet},
 {href:'/app/configuracoes',label:'Configurações',Icon:Settings}
];
type User={id:string;name:string;firstName:string;lastName:string;requiresNameCompletion:boolean;email:string;phone:string|null;trialEndsAt:string;role:string};
export default function ProtectedShell({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [checking,setChecking]=useState(true);
 const [menuOpen,setMenuOpen]=useState(false);
 const [notices,setNotices]=useState<{announcement:string;maintenanceNotice:string}|null>(null);
 const [premiumAlert,setPremiumAlert]=useState<{status:string;title:string;message:string;activeUntil:string|null}|null>(null);
 const [premiumAccess,setPremiumAccess]=useState<{premiumRequired:boolean;allowed:boolean;priceCents:number}|null>(null);
 const [accessError,setAccessError]=useState('');
 const [verifiedPath,setVerifiedPath]=useState('');
 const [generatingPix,setGeneratingPix]=useState(false);
 const [pixError,setPixError]=useState('');
 const pathname=usePathname();const router=useRouter();
 useEffect(()=>{let active=true;api<{user:User}>('/auth/me').then(r=>{if(active)setUser(r.user);}).catch(()=>{if(active)router.replace('/entrar');}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[router]);
 useEffect(()=>{setMenuOpen(false);},[pathname]);
 useEffect(()=>{const reload=()=>{api<{user:User}>('/auth/me').then(r=>setUser(r.user)).catch(()=>{});};window.addEventListener('motopro:profile-updated',reload);return()=>window.removeEventListener('motopro:profile-updated',reload);},[]);
 useEffect(()=>{api<{announcement:string;maintenanceNotice:string}>('/public/settings').then(setNotices).catch(()=>{});},[]);
 useEffect(()=>{
  if(!user || (user.role!=='admin'&&(!user.phone||user.requiresNameCompletion))){setPremiumAccess(null);setVerifiedPath('');return;}
  if(user.role==='admin'){setPremiumAlert(null);setPremiumAccess({premiumRequired:true,allowed:true,priceCents:999});setAccessError('');setVerifiedPath(pathname);return;}
  setPremiumAccess(null);setAccessError('');setVerifiedPath('');
  let valid=true;
  const check=async()=>{
   try{
    const r=readBillingStatus(await api<unknown>('/billing/me'));
    if(valid){setPremiumAlert(['expiring','expired','none'].includes(r.notice.status)?r.notice:null);setPremiumAccess({...r.access,priceCents:r.plan.priceCents});setAccessError('');setVerifiedPath(pathname);}
   }catch(e){if(valid){setPremiumAlert(null);setPremiumAccess(null);setAccessError(e instanceof Error?e.message:'Não foi possível consultar sua assinatura.');setVerifiedPath(pathname);}}
  };
  void check();
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void check();},25*1000);
  const visible=()=>{if(document.visibilityState==='visible')void check();};
  document.addEventListener('visibilitychange',visible);
  return()=>{valid=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[user,pathname]);
 useEffect(()=>{
  if(checking||!user)return;
  if(user.role==='admin'&&pathname==='/app')router.replace('/app/admin');
  if(user.role!=='admin'&&pathname.startsWith('/app/admin'))router.replace('/app');
 },[checking,user,pathname,router]);
 const accountPages=pathname==='/app/assinatura'||pathname==='/app/configuracoes'||pathname==='/app/indicacoes';
 const currentCheck=verifiedPath===pathname;
 const premiumBlocked=user?.role!=='admin'&&!accountPages&&currentCheck&&!!premiumAccess&&!premiumAccess.allowed;
 const verifyingAccess=user?.role!=='admin'&&!accountPages&&(!currentCheck||(!premiumAccess&&!accessError));
 const generatePix=async()=>{
  if(generatingPix)return;
  setPixError('');setGeneratingPix(true);
  try{
   // O backend reaproveita um Pix ainda válido e não duplica a cobrança.
   // A tela da assinatura mostrará o QR Code retornado pelo banco.
   await api('/billing/pix',await pixOrderRequestOptions());
   router.push('/app/assinatura');
  }catch(e){setPixError(e instanceof Error?e.message:'Não foi possível gerar o Pix. Tente novamente.');}
  finally{setGeneratingPix(false);}
 };
 const gateExpired=premiumAlert?.status==='expired';
 const gateTitle=gateExpired?'Sua assinatura Premium venceu':'Você ainda não ativou o MotoPRO Premium';
 const gateDescription=gateExpired
  ?'Seu período pago terminou. Renove pelo Pix para voltar a utilizar todos os recursos, sem perder seus dados.'
  :'Para começar a utilizar todos os recursos do MotoPRO, ative sua assinatura semanal pelo Pix. Seus dados ficam preservados.';
 const logout=async()=>{await api('/auth/logout',{method:'POST'}).catch(()=>{});router.replace('/entrar');};
 if(checking)return <div className="loading-page"><LoaderCircle className="spin"/> Carregando seu MotoPRO...</div>;
 if(!user)return null;
 if(user.requiresNameCompletion)return <CompleteName user={user} onComplete={setUser} onLogout={logout}/>;
 if(user.role==='driver'&&!user.phone)return <CompletePhone name={user.name} onComplete={updated=>setUser(prev=>prev?{...prev,...updated}:null)} onLogout={logout}/>;
 if((user.role==='admin'&&pathname==='/app')||(user.role!=='admin'&&pathname.startsWith('/app/admin')))return <div className="loading-page"><LoaderCircle className="spin"/> Redirecionando...</div>;
 return <div className="app-shell">
  {menuOpen&&<button className="drawer-backdrop" aria-label="Fechar menu" onClick={()=>setMenuOpen(false)}/>}
  <aside className={`sidebar ${menuOpen?'open':''}`}>
   <Link href="/app" className="brand"><span className="brand-mark"><Bike size={26}/></span><span><strong>Moto<span className="brand-highlight">PRO</span></strong><small>O controle é seu.</small></span></Link>
   <div className="sidebar-section-label">MENU PRINCIPAL</div>
   <nav className="nav-items">{navigation.map(({href,label,Icon})=><Link key={href} href={href} className={`nav-link ${pathname===href?'active':''}`}><Icon size={19}/><span>{label}</span>{pathname===href&&<ChevronRight size={15} className="nav-chevron"/>}</Link>)}</nav>
   {user.role==='admin'&&<Link href="/app/admin" className={`nav-link ${pathname==='/app/admin'?'active':''}`}><Wallet size={19}/> Administração</Link>}
   <div className="sidebar-bottom"><div className="profile-dot">{user.name.charAt(0).toUpperCase()}</div><div className="profile-meta"><strong>{user.name}</strong><small>{user.email}</small></div><button aria-label="Sair da conta" className="icon-btn" onClick={logout}><LogOut size={18}/></button></div>
  </aside>
  <div className="app-main">
   <header className="topbar"><button aria-label="Abrir menu" className="mobile-menu-btn icon-btn" onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?<X/>:<Menu/>}</button><div className="topbar-eyebrow">SEU CORRE, SEU RESULTADO</div><div className="topbar-right"><span className="online-dot"/> Minha conta <span className="mini-avatar">{user.name.charAt(0).toUpperCase()}</span></div></header>
   <main className="page-wrap">{premiumAlert&&<Link href="/app/assinatura" className={`renewal-shell-banner ${premiumAlert.status}`}><CalendarClock size={20}/><span><strong>{premiumAlert.title}</strong><small>{premiumAlert.message} Toque para renovar pelo Pix.</small></span><ChevronRight size={18}/></Link>}{notices?.maintenanceNotice&&<div className="notice info" style={{marginBottom:14}}>{notices.maintenanceNotice}</div>}{notices?.announcement&&<div className="notice success" style={{marginBottom:14}}>{notices.announcement}</div>}{accessError&&currentCheck&&!accountPages&&user.role!=='admin'?<section className="premium-gate" role="alert"><div className="premium-gate-symbol"><LockKeyhole/></div><h1>Não foi possível consultar sua assinatura</h1><p>A verificação da assinatura não foi concluída. Isso não significa que seu Premium venceu. Você pode consultar o pagamento ou tentar novamente.</p>{accessError.includes('API do Heroku')&&<div className="premium-gate-error" role="alert">{accessError}</div>}<Link className="btn wide" href="/app/assinatura"><QrCode size={18}/> Ver assinatura e gerar Pix</Link><button className="premium-gate-retry" onClick={()=>window.location.reload()}>Tentar verificar novamente</button></section>:verifyingAccess?<div className="loading-page"><LoaderCircle className="spin"/> Verificando assinatura...</div>:premiumBlocked?<section className="premium-gate" role="status" aria-live="polite"><div className="premium-gate-symbol"><LockKeyhole size={36}/></div><h1>{gateTitle}</h1><p>{gateDescription}</p><div className="premium-gate-price">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((premiumAccess?.priceCents??999)/100)} <span>/ 7 dias via Pix</span></div><button className="btn wide" onClick={()=>void generatePix()} disabled={generatingPix}><QrCode size={18}/> {generatingPix?'Gerando seu Pix...':gateExpired?'Gerar Pix para renovar':'Gerar Pix para ativar'}</button>{pixError&&<div className="premium-gate-error" role="alert">{pixError}</div>}<Link className="premium-gate-secondary" href="/app/assinatura">Ver assinatura, QR Code e pagamentos</Link><Link className="premium-gate-secondary" href="/app/configuracoes">Minha conta e meus dados</Link></section>:children}</main>
  </div>
  <nav className="mobile-bottom-nav">{navigation.slice(0,5).map(({href,label,Icon})=><Link key={href} href={href} className={pathname===href?'selected':''}><Icon size={20}/><span>{label==='Visão geral'?'Início':label==='Lançamentos'?'Ganhos':label}</span></Link>)}</nav>
 </div>;
}
