'use client';
import {useEffect} from 'react';
import Link from 'next/link';
import {AlertCircle,RotateCcw,QrCode} from 'lucide-react';

/** Última linha de defesa para exceções inesperadas de renderização da área logada. */
export default function AppError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{console.error('Falha ao renderizar tela do MotoPRO:',error);},[error]);
 return <section className="premium-gate" role="alert">
  <div className="premium-gate-symbol"><AlertCircle size={34}/></div>
  <h1>Não foi possível abrir esta tela</h1>
  <p>Ocorreu um erro na interface. Seu pagamento e seus dados não foram alterados. Tente carregar a tela novamente ou consulte a assinatura.</p>
  <button className="btn wide" onClick={reset}><RotateCcw size={18}/> Tentar novamente</button>
  <Link className="premium-gate-secondary" href="/app/assinatura"><QrCode size={17}/> Consultar assinatura e Pix</Link>
 </section>;
}
