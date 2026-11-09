'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {LayoutDashboard,ReceiptText,Mic2,Bike,Target,Plug,ShieldCheck,LogOut,Settings,ChevronRight,LoaderCircle,Menu,X,Wallet} from 'lucide-react';
import {api} from '@/lib/api';
const navigation=[
 {href:'/app',label:'Visão geral',Icon:LayoutDashboard},
 {href:'/app/lancamentos',label:'Lançamentos',Icon:ReceiptText},
 {href:'/app/assistente',label:'Assistente',Icon:Mic2},
 {href:'/app/moto',label:'Minha moto',Icon:Bike},
 {href:'/app/metas',label:'Metas',Icon:Target},
 {href:'/app/integracoes',label:'Integrações',Icon:Plug},
 {href:'/app/assinatura',label:'Assinatura',Icon:ShieldCheck},
 {href:'/app/configuracoes',label:'Configurações',Icon:Settings}
];
type User={id:string;name:string;email:string;trialEndsAt:string;role:string};
export default function ProtectedShell({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [checking,setChecking]=useState(true);
 const [menuOpen,setMenuOpen]=useState(false);
 const pathname=usePathname();const router=useRouter();
 useEffect(()=>{let active=true;api<{user:User}>('/auth/me').then(r=>{if(active)setUser(r.user);}).catch(()=>{if(active)router.replace('/entrar');}).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[router]);
 useEffect(()=>{setMenuOpen(false);},[pathname]);
 useEffect(()=>{
  if(checking||!user)return;
  if(user.role==='admin'&&pathname==='/app')router.replace('/app/admin');
  if(user.role!=='admin'&&pathname.startsWith('/app/admin'))router.replace('/app');
 },[checking,user,pathname,router]);
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
   <main className="page-wrap">{children}</main>
  </div>
  <nav className="mobile-bottom-nav">{navigation.slice(0,5).map(({href,label,Icon})=><Link key={href} href={href} className={pathname===href?'selected':''}><Icon size={20}/><span>{label==='Visão geral'?'Início':label==='Lançamentos'?'Ganhos':label}</span></Link>)}</nav>
 </div>;
}
