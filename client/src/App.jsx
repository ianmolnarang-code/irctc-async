import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { BookingProvider } from './store/BookingContext.jsx';
import LogoIRCTC from './components/LogoIRCTC.jsx';
import Search from './pages/Search.jsx';
import Passengers from './pages/PreBook/Passengers.jsx';
import AadhaarOtp from './pages/PreBook/AadhaarOtp.jsx';
import UpiMandate from './pages/PreBook/UpiMandate.jsx';
import BookingReview from './pages/BookingReview.jsx';
import LiveStatus from './pages/LiveStatus.jsx';
import About from './pages/About.jsx';
import PnrEnquiry from './pages/PnrEnquiry.jsx';
import MyBookings from './pages/MyBookings.jsx';

// [label, path]. Only the first few route somewhere; the rest are decorative
// (matching the IRCTC menu breadth).
const MENU = [
  ['BOOK TICKET', '/'],
  ['PNR ENQUIRY', '/pnr'],
  ['MY BOOKINGS', '/bookings'],
  ['TRAINS', '/'],
  ['HOLIDAYS', '/'],
  ['MEALS', '/'],
  ['MORE', '/'],
];

function Header() {
  return (
    <>
      {/* Utility strip */}
      <div className="bg-brand-dark text-white text-[11px]">
        <div className="mx-auto flex max-w-[1000px] items-center justify-end gap-4 px-3 py-1">
          <span className="opacity-80">A-</span>
          <span className="opacity-80">A</span>
          <span className="opacity-80">A+</span>
          <span className="h-3 w-px bg-white/30" />
          <span className="opacity-90">English ▾</span>
          <span className="h-3 w-px bg-white/30" />
          <span className="opacity-90">Login</span>
          <span className="opacity-90">Register</span>
        </div>
      </div>

      {/* Logo header */}
      <div className="bg-white border-b border-line">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-3 px-3 py-2">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="relative grid h-11 w-11 place-items-center rounded-full bg-gradient-to-b from-brand to-accent text-white shadow-sm">
              <span className="text-[15px] font-bold tracking-tight">IR</span>
            </span>
            <span className="leading-tight">
              <span className="block text-[17px] font-bold text-brand-dark">Async Tatkal</span>
              <span className="block text-[10px] text-muted">Indian Railway Catering &amp; Tourism · <em>demo</em></span>
            </span>
          </Link>
          <LogoIRCTC />
        </div>
      </div>

      {/* Teal menu bar */}
      <nav className="bg-brand text-white shadow">
        <div className="mx-auto flex max-w-[1000px] items-center px-1 text-[12.5px] font-medium">
          {MENU.map(([label, to], i) => (
            <Link
              key={label}
              to={to}
              className={`px-3 py-2.5 tracking-wide transition-colors hover:bg-white/10
                ${i === 0 ? 'bg-white/15' : ''} ${i > 2 ? 'hidden md:block' : ''}`}
            >
              {label}
            </Link>
          ))}
          <Link to="/about" className="ml-auto px-3 py-2.5 tracking-wide hover:bg-white/10">ABOUT</Link>
        </div>
      </nav>
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <BookingProvider>
      <div className="flex min-h-full flex-col">
        <Header />
        <main key={pathname} className="mx-auto w-full max-w-[1000px] flex-1 animate-fade-in px-3 py-4">
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/prebook/passengers" element={<Passengers />} />
            <Route path="/prebook/aadhaar" element={<AadhaarOtp />} />
            <Route path="/prebook/upi" element={<UpiMandate />} />
            <Route path="/review" element={<BookingReview />} />
            <Route path="/live" element={<LiveStatus />} />
            <Route path="/pnr" element={<PnrEnquiry />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="mt-6 bg-brand-dark text-white/80 text-[11px]">
          <div className="mx-auto max-w-[1000px] px-3 py-4">
            Demo replica of the IRCTC booking portal for a hackathon. Not affiliated with or endorsed by
            IRCTC / Indian Railways. No real Aadhaar, UPI, OTP, or payment data is used.
          </div>
        </footer>
      </div>
    </BookingProvider>
  );
}
