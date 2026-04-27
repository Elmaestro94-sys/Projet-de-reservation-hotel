import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Facebook, Instagram, Twitter, Phone, Mail, MapPin, Send, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES = ['Dakar', 'Saly', 'Saint-Louis', 'Somone', 'Cap Skirring', 'Ziguinchor'];

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Merci ! Vous recevrez nos meilleures offres.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-dark-900 text-gray-400">
      {/* Newsletter bar */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-display font-bold text-xl mb-1">
                Offres exclusives &amp; bons plans
              </h3>
              <p className="text-gray-500 text-sm">
                Recevez nos meilleures adresses et promotions en avant-première.
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="flex-shrink-0 bg-primary-600 hover:bg-primary-500 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">S'abonner</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">
                Séjour <span className="text-primary-500">Sénégal</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              La plateforme premium de réservation d'hébergements au Sénégal.
              Villas, appartements, maisons de caractère — vivez l'Afrique authentique.
            </p>

            {/* Social */}
            <div className="flex gap-2.5">
              {[
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Twitter, label: 'Twitter' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 bg-white/5 hover:bg-primary-600 border border-white/10 hover:border-primary-500 rounded-xl flex items-center justify-center transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Payment badges */}
            <div>
              <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider font-medium">Paiements acceptés</p>
              <div className="flex items-center gap-2 flex-wrap">
                {['Visa', 'MasterCard', 'Orange Money', 'Wave', 'PayTech'].map(pm => (
                  <span
                    key={pm}
                    className="text-[10px] font-bold text-gray-500 border border-white/10 bg-white/5 px-2 py-1 rounded-md"
                  >
                    {pm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Destinations</h4>
            <ul className="space-y-2.5 text-sm">
              {CITIES.map(city => (
                <li key={city}>
                  <Link
                    to={`/recherche?city=${city}`}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    <ArrowRight className="w-3 h-3 text-primary-600 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all duration-200" />
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Services</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Devenir propriétaire', to: '/register' },
                { label: 'Trouver un logement', to: '/recherche' },
                { label: 'Mon espace', to: '/dashboard' },
                { label: 'Aide & Support', to: '#' },
                { label: 'Guide du voyageur', to: '#' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    <ArrowRight className="w-3 h-3 text-primary-600 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all duration-200" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Contact</h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <span>Plateau, Dakar<br />Sénégal</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <a href="tel:+221338006000" className="hover:text-white transition-colors">
                  +221 33 800 60 00
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <a href="mailto:hello@sejoursenegal.sn" className="hover:text-white transition-colors">
                  hello@sejoursenegal.sn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>© 2025 Séjour Sénégal. Tous droits réservés.</p>
          <div className="flex items-center gap-5">
            {['Confidentialité', 'CGU', 'Cookies', 'Mentions légales'].map(link => (
              <a key={link} href="#" className="hover:text-gray-400 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
