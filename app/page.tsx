import Link from 'next/link';
import MotoMark from '@/components/MotoMark';
import {ArrowUpRight,ArrowRight,ChartNoAxesCombined,Mic2,Wallet,TimerReset,Target,ShieldCheck,CheckCircle2,Sparkles,Route,MoveUpRight,Zap} from 'lucide-react';
const benefits=[
 {Icon:Wallet,title:'Ganhos sob controle',text:'Registre os recebimentos, as despesas e enxergue seu lucro estimado.'},
 {Icon:Mic2,title:'Registre só falando',text:'Diga o valor do abastecimento ou das entregas e confirme o lançamento.'},
 {Icon:TimerReset,title:'Moto sempre em dia',text:'Lembretes de manutenção e acompanhamento da quilometragem.'},
 {Icon:Target,title:'Metas que fazem sentido',text:'Defina sua meta semanal e saiba quanto falta para chegar lá.'},
 {Icon:ChartNoAxesCombined,title:'Dados que ajudam',text:'Visualize a evolução dos ganhos por dia e organize seu financeiro.'},
 {Icon:ShieldCheck,title:'Você no controle',text:'Uma plataforma independente, feita para entregadores de qualquer app.'}
];
export default function Landing(){
 return <div className="landing">
  <div className="landing-glow landing-glow-one"/><div className="landing-glow landing-glow-two"/>
  <header className="landing-nav">
   <Link href="/" className="brand"><span className="brand-mark"><MotoMark size={31}/></span><span><strong>Moto<span className="brand-highlight">PRO</span></strong><small>O controle é seu.</small></span></Link>
   <nav className="landing-nav-actions" aria-label="Acesso ao MotoPRO"><span className="landing-nav-note">FEITO PARA ENTREGADORES</span><Link className="btn landing-header-signup" href="/cadastro">Cadastre-se <ArrowRight size={16} aria-hidden="true"/></Link><Link className="btn landing-header-login" href="/entrar">Entrar <ArrowUpRight size={16} aria-hidden="true"/></Link></nav>
  </header>
  <main>
   <section className="landing-hero">
    <div className="landing-hero-copy"><div className="landing-label"><span className="pulse-dot"/> INTELIGÊNCIA PARA QUEM FAZ O CORRE</div>
     <h1>Mais controle.<br/><span>Mais resultado.</span><br/>Mais liberdade.</h1>
     <p>O painel financeiro do entregador que quer ir além. Acompanhe ganhos, combustível, manutenção e metas — com lançamentos por texto ou voz.</p>
     <div className="landing-actions"><Link href="/cadastro" className="btn hero-primary">Começar gratuitamente <ArrowRight size={18}/></Link><Link href="/entrar" className="btn outline">Já tenho conta</Link></div>
     <div className="landing-features"><span><CheckCircle2 size={16}/> Sem vincular outra plataforma</span><span><Mic2 size={16}/> Comandos por voz</span><span><ShieldCheck size={16}/> Seus dados protegidos</span></div>
    </div>
    <div className="landing-demo-area" aria-label="Prévia ilustrativa do painel financeiro"><div className="landing-moto-watermark"><MotoMark size={290}/></div>
      <div className="demo-accent demo-accent-top"><Zap size={15}/> GESTÃO INTELIGENTE</div>
      <div className="landing-showcase">
       <div className="showcase-head"><span className="showcase-brand"><span className="showcase-brand-icon"><MotoMark size={24}/></span> MotoPRO <span className="showcase-head-pill">VISÃO GERAL</span></span><span className="showcase-avatar">M</span></div>
       <div className="showcase-caption">LUCRO ESTIMADO DA SEMANA</div>
       <div className="showcase-money">R$ 642,50 <span className="showcase-trend"><MoveUpRight size={13}/> Seu progresso</span></div>
       <div className="showcase-divider"/>
       <div className="showcase-mini-stats"><div><span>Ganhos</span><strong>R$ 820,00</strong></div><div><span>Despesas</span><strong>R$ 177,50</strong></div></div>
       <div className="showcase-chart">{[42,58,54,76,64,94,83].map((n,i)=><div key={i} style={{height:`${n}%`}}/>)}</div>
       <div className="showcase-foot">TER · QUA · QUI · SEX · SÁB · DOM · SEG</div>
      </div>
      <div className="demo-accent demo-accent-bottom"><Sparkles size={17}/><span><strong>Registro por voz</strong><small>"Abasteci 35 reais hoje"</small></span></div>
      <div className="demo-disclaimer">Valores fictícios para demonstração</div>
    </div>
   </section>
   <section className="landing-benefits" id="beneficios"><div className="benefits-intro"><span className="section-kicker">FEITO PARA A SUA ROTINA</span><h2>Tudo que importa, <span>em um lugar.</span></h2><p>Ferramentas simples para você ter mais clareza sobre seu trabalho e seu dinheiro.</p></div><div className="feature-grid">{benefits.map(({Icon,title,text},i)=><article className="feature-card" key={title}><div className="feature-icon"><Icon size={23}/></div><span className="feature-number">0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
   <section className="landing-final"><div className="final-copy"><span className="section-kicker">SEU CORRE, SEU NEGÓCIO</span><h2>Comece hoje a cuidar do que você conquista todos os dias.</h2><p>Uma conta, um painel e mais clareza para cada decisão.</p></div><Link href="/cadastro" className="btn hero-primary">Criar minha conta <ArrowRight size={18}/></Link></section>
  </main>
  <footer className="landing-footer"><span>MotoPRO · O controle é seu.</span><span>Produto independente para entregadores.</span></footer>
 </div>;
}
