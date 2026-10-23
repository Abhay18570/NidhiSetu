import UtilityBar from './UtilityBar';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#0D1B2A] antialiased">
      <UtilityBar />
      <Navbar />
      <main id="main-content" tabIndex="-1" className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
