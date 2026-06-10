import { useAuth } from '../../context/AuthContext';
import Header from '../Header';
import AdminHeader from '../AdminHeader';
import Footer from '../Footer';

export function PageShell({
  children,
  className = '',
  hideHeader = false,
  hideFooter = false,
  maxWidth = 'max-w-7xl',
  containerClassName = '',
}) {
  const { isAdmin } = useAuth();

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`}>
      {!hideHeader && (isAdmin ? <AdminHeader /> : <Header />)}
      
      <main className={`flex-1 flex flex-col w-full mx-auto pb-12 ${maxWidth} ${containerClassName}`}>
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
