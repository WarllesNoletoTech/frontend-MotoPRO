import type {Metadata,Viewport} from 'next';
import ServiceWorker from '@/components/ServiceWorker';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import './globals.css';
export const metadata:Metadata={title:'MotoPRO — O controle é seu.',description:'Organize seus ganhos, despesas, metas e a manutenção da moto.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'MotoPRO',statusBarStyle:'black-translucent'},icons:{icon:'/icon.svg',apple:'/icon-192.png'}};
export const viewport:Viewport={themeColor:'#090b0f',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="pt-BR"><body><ServiceWorker/><PwaInstallPrompt/>{children}</body></html>;
}
