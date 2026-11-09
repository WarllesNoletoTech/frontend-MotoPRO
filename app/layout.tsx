import type {Metadata,Viewport} from 'next';
import ServiceWorker from '@/components/ServiceWorker';
import './globals.css';
export const metadata:Metadata={title:'MotoPRO — O controle é seu.',description:'Organize seus ganhos, despesas, metas e a manutenção da moto.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={themeColor:'#090d0e',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="pt-BR"><body><ServiceWorker/>{children}</body></html>;
}
