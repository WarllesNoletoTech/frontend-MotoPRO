'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {LayoutDashboard,ReceiptText,Mic2,Bike,Target,Plug,ShieldCheck,LogOut,Settings,Gift,ChevronRight,LoaderCircle,Menu,X,Wallet,CalendarClock,LockKeyhole} from 'lucide-react';
import {api} from '@/lib/api';
const navigation=[
 {href:'/app',label:'Visão geral',Icon:LayoutDashboard},
 {href:'/app/lancamentos',label:'Lançamentos',Icon:ReceiptText},
 {href:'/app/assistente',label:'Assistente',Icon:Mic2},
 {href:'/app/moto',label:'Minha moto',Icon:Bike},
 {href:'/app/metas',label:'Metas',Icon:Target},
 {href:'/app/integracoes',label:'Integrações',Icon:Plug},
 {href:'/app/assinatura',label:'Assinatura',Icon:ShieldCheck},
 {href:'/app/premiacoes',label:'Benefícios',Icon:Gift},
 {href:'/app/configuracoes',label:'Configurações',Icon:Settings}
];
type User={id:string;name:string;email:string;trialEndsAt:string;role:string};
export default function ProtectedShell({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [checking,setChecking]=useState(true);
 const [menuOpen,setMenuOpen]=useState(false);
 const [notices,setNotices]=useState<{announcement:string;maintenanceNotice:string}|null>(null);
 const [premiumAlert,setPremiumAlert]=useState<{status:string;title:string;message:string;activeUntil:string|null}|null>(null);
 const [premiumAccess,setPremiumAccess]=useState<{premiumRequired:boolean;allowed:boolean;priceCents:number}|null>(null);
 const [accessError,setAccessError]=useState(false);
 const pathname=usePathname();const router=useRouter();
 useEffect(()=>{let active=true;api<{user:User}>('/auth/me').then(r=>{if(active)setUser(r.user);}).catch(()=>{if(active)router.replace('/entrar');}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[router]);
 useEffect(()=>{setMenuOpen(false);},[pathname]);
 useEffect(()=>{api<{announcement:string;maintenanceNotice:string}>('/public/settings').then(setNotices).catch(()=>{});},[]);
 useEffect(()=>{
  if(!user){setPremiumAccess(null);return;}
  if(user.role==='admin'){setPremiumAlert(null);setPremiumAccess({premiumRequired:false,allowed:true,priceCents:999});setAccessError(false);return;}
  setPremiumAccess(null);setAccessError(false);
  let valid=true;
  const check=async()=>{
   try{
    const r=await api<{notice:{status:string;title:string;message:string;activeUntil:string|null};plan:{priceCents:number};access:{premiumRequired:boolean;allowed:boolean}}>('/billing/me');
    if(valid){setPremiumAlert(['expiring','expired','none'].includes(r.notice.status)?r.notice:null);setPremiumAccess({...r.access,priceCents:r.plan.priceCents});setAccessError(false);}
   }catch{if(valid){setPremiumAlert(null);setPremiumAccess(null);setAccessError(true);}}
  };
  void check();
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void check();},5*60*1000);
  const visible=()=>{if(document.visibilityState==='visible')void check();};
  document.addEventListener('visibilitychange',visible);
  return()=>{valid=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[user,pathname]);
 useEffect(()=>{
  if(checking||!user)return;
  if(user.role==='admin'&&pathname==='/app')router.replace('/app/admin');
  if(user.role!=='admin'&&pathname.startsWith('/app/admin'))router.replace('/app');
 },[checking,user,pathname,router]);
 const accountPages=pathname==='/app/assinatura'||pathname==='/app/configuracoes';
 const premiumBlocked=user?.role!=='admin'&&!accountPages&&premiumAccess?.premiumRequired&&!premiumAccess.allowed;
 const verifyingAccess=user?.role!=='admin'&&!accountPages&&!premiumAccess&&!accessError;
 const logout=async()=>{await api('/auth/logout',{method:'POST'}).catch(()=>{});router.replace('/entrar');};
 if(checking)return <div className="loading-page"><LoaderCircle className="spin"/> Carregando seu MotoPRO...</div>;
 if(!user)return null;
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
   <main className="page-wrap">{premiumAlert&&<Link href="/app/assinatura" className={`renewal-shell-banner ${premiumAlert.status}`}><CalendarClock size={20}/><span><strong>{premiumAlert.title}</strong><small>{premiumAlert.message} Toque para renovar pelo Pix.</small></span><ChevronRight size={18}/></Link>}{notices?.maintenanceNotice&&<div className="notice info" style={{marginBottom:14}}>{notices.maintenanceNotice}</div>}{notices?.announcement&&<div className="notice success" style={{marginBottom:14}}>{notices.announcement}</div>}{accessError&&!accountPages&&user.role!=='admin'?<section className="premium-gate" role="alert"><div className="premium-gate-symbol"><LockKeyhole/></div><h1>Não foi possível verificar sua assinatura</h1><p>Por segurança, os recursos Premium não foram carregados. Você pode tentar novamente ou acessar sua conta e pagamentos.</p><button className="btn wide" onClick={()=>window.location.reload()}>Tentar novamente</button><Link className="premium-gate-secondary" href="/app/assinatura">Ver assinatura</Link></section>:verifyingAccess?<div className="loading-page"><LoaderCircle className="spin"/> Verificando assinatura...</div>:premiumBlocked?<section className="premium-gate" role="status"><div className="premium-gate-symbol"><LockKeyhole size={36}/></div><h1>Ative seu MotoPRO Premium</h1><p>Todos os recursos do aplicativo exigem Premium ativo, período gratuito válido ou cortesia. Seus dados continuam guardados e você pode exportá-los em Configurações.</p><div className="premium-gate-price">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((premiumAccess?.priceCents??999)/100)} <span>/ 7 dias via Pix</span></div><Link className="btn wide" href="/app/assinatura"><ShieldCheck size={18}/> Ativar ou renovar Premium</Link><Link className="premium-gate-secondary" href="/app/configuracoes">Minha conta e meus dados</Link></section>:children}</main>
  </div>
  <nav className="mobile-bottom-nav">{navigation.slice(0,5).map(({href,label,Icon})=><Link key={href} href={href} className={pathname===href?'selected':''}><Icon size={20}/><span>{label==='Visão geral'?'Início':label==='Lançamentos'?'Ganhos':label}</span></Link>)}</nav>
 </div>;
}
