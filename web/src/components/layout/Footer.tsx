import { Link } from 'react-router-dom';
import { Home, Facebook, Instagram, Twitter, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Séjour Sénégal</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              La plateforme premium de réservation d'hébergements au Sénégal. Vivez votre séjour africain authentique.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Explorer */}
          <div>
            <h4 className="text-white font-semibold mb-4">Explorer</h4>
            <ul className="space-y-2 text-sm">
              {['Dakar', 'Saly', 'Saint-Louis', 'Somone', 'Cap Skirring', 'Ziguinchor'].map(city => (
                <li key={city}>
                  <Link to={`/recherche?city=${city}`} className="hover:text-white transition-colors">{city}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-white transition-colors">Devenir propriétaire</Link></li>
              <li><Link to="/recherche" className="hover:text-white transition-colors">Trouver un logement</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Guide voyage</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Options premium</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Aide & Support</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span>Dakar, Sénégal</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <a href="tel:+221338006000" className="hover:text-white transition-colors">+221 33 800 60 00</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <a href="mailto:hello@sejoursenegal.sn" className="hover:text-white transition-colors">hello@sejoursenegal.sn</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2025 Séjour Sénégal. Tous droits réservés.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-gray-300 transition-colors">CGU</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
