import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'admin' | 'client';
  status: 'pending' | 'active' | 'blocked';
  createdAt: string;
  lastLogin?: string;
  notes?: string;
}

export interface CatalogItem {
  id: string;
  type: 'profile' | 'full'; // 'profile' = 1 Dispositivo, 'full' = Cuenta Completa
  name: string;
  category: 'peliculas_series' | 'anime' | 'musica' | 'deportes';
  categoryLabel: string;
  price: number; // en MXN
  originalPrice?: number;
  devices: string;
  quality: string;
  badge?: string;
  tagline: string;
  description: string;
  features: string[];
  logoUrl: string;
  accentColor: string;
  inStock: boolean;
}

export interface ComboItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  badge: string;
  description: string;
  platforms: string[];
  savings: string;
  inStock: boolean;
}

export interface OrderItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  itemType: 'profile' | 'full' | 'combo';
  itemName: string;
  price: number;
  status: 'pendiente' | 'entregado' | 'cancelado';
  createdAt: string;
  notes?: string;
}

export interface ClientAccount {
  id: string;
  clientId: string; // references User.id
  clientUsername: string; // username del cliente
  clientName: string; // Nombre del cliente
  clientPhone: string; // WhatsApp de contacto
  accountName: string; // Nombre del servicio (ej. 'Netflix Premium (Perfil 1 Privado)')
  serviceType: 'profile' | 'full';
  accountEmail: string; // Correo asignado a la cuenta de streaming
  accountPassword?: string; // Clave de acceso o contraseña
  pin?: string; // PIN del perfil
  price: number; // Precio en $ MXN
  startDate: string; // Fecha de inicio YYYY-MM-DD
  renewalDate: string; // Fecha de renovación YYYY-MM-DD
  paymentStatus: 'al_dia' | 'por_vencer' | 'vencido' | 'pendiente';
  lastPaymentDate?: string;
  notes?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  sessions: { token: string; userId: string; expiresAt: number }[];
  resetRequests: { email: string; pin: string; expiresAt: number }[];
  profiles: CatalogItem[];
  fullAccounts: CatalogItem[];
  combos: ComboItem[];
  orders: OrderItem[];
  clientAccounts: ClientAccount[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'brisa_database.json');

// Initial official prices as requested by the user:
const INITIAL_PROFILES: CatalogItem[] = [
  {
    id: 'p-netflix',
    type: 'profile',
    name: 'Netflix Premium',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 88,
    originalPrice: 110,
    devices: '1 Dispositivo (Perfil con PIN)',
    quality: '4K Ultra HD',
    badge: 'Más Vendido',
    tagline: 'Perfil privado con PIN personal, 4K UHD y descargas offline',
    description: 'Acceso exclusivo a un perfil protegido con tu propio PIN en cuenta premium de Netflix. Calidad 4K sin anuncios y compatible con Smart TV, celular, tablet o PC.',
    features: ['Perfil privado protegido con PIN', 'Calidad 4K Ultra HD', 'Descargas offline', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80',
    accentColor: '#e50914',
    inStock: true,
  },
  {
    id: 'p-disney',
    type: 'profile',
    name: 'Disney+',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 40,
    originalPrice: 55,
    devices: '1 Dispositivo (Perfil)',
    quality: '4K UHD + ESPN',
    badge: 'Deportes ESPN',
    tagline: 'Todo Disney, Pixar, Marvel, Star Wars y deportes de ESPN en vivo',
    description: 'Disfruta de todo el universo de cine Disney y las transmisiones deportivas en vivo de ESPN (Fútbol internacional, F1, tenis) en tu pantalla favorita.',
    features: ['Incluye transmisiones en vivo de ESPN', 'Películas y series en 4K UHD', 'Perfil individual', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    accentColor: '#113ccf',
    inStock: true,
  },
  {
    id: 'p-hbo-max',
    type: 'profile',
    name: 'HBO Max (Max)',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 37,
    originalPrice: 50,
    devices: '1 Dispositivo (Perfil)',
    quality: '4K HDR',
    badge: 'Cine Warner',
    tagline: 'Series de culto HBO, películas Warner Bros y Champions League',
    description: 'Acceso a producciones como House of the Dragon, The Last of Us, estrenos taquilleros y transmisiones deportivas estelares.',
    features: ['Series exclusivas HBO Original', 'Cine Warner Bros sin esperas', 'Audio Dolby Atmos', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
    accentColor: '#002be7',
    inStock: true,
  },
  {
    id: 'p-vix',
    type: 'profile',
    name: 'ViX Premium',
    category: 'deportes',
    categoryLabel: 'Fútbol & Entretenimiento',
    price: 30,
    originalPrice: 45,
    devices: '1 Dispositivo (Perfil)',
    quality: 'Full HD 1080p',
    badge: 'Liga MX',
    tagline: 'Partidos de la Liga MX en vivo, telenovelas y series originales',
    description: 'Toda la pasión del fútbol mexicano en vivo, canales en directo y las producciones más destacadas de la televisión en español.',
    features: ['Partidos de la Liga MX en vivo', 'Telenovelas completas sin cortes', 'Canales de TV en vivo', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1508733467250-eab977e40644?auto=format&fit=crop&w=600&q=80',
    accentColor: '#ff5e00',
    inStock: true,
  },
  {
    id: 'p-crunchyroll',
    type: 'profile',
    name: 'Crunchyroll',
    category: 'anime',
    categoryLabel: 'Anime & Manga',
    price: 30,
    originalPrice: 45,
    devices: '1 Dispositivo (Perfil)',
    quality: 'Full HD 1080p',
    badge: 'Anime Ilimitado',
    tagline: 'Estrenos simultáneos con Japón, doblaje latino y sin publicidad',
    description: 'El mayor catálogo de anime del planeta. Mira tus series favoritas con doblaje o subtítulos solo una hora después de su emisión en Japón.',
    features: ['Simulcast oficial desde Japón', 'Catálogo libre de anuncios', 'Doblaje latino de alta calidad', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    accentColor: '#f47521',
    inStock: true,
  },
  {
    id: 'p-paramount',
    type: 'profile',
    name: 'Paramount+',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 30,
    originalPrice: 45,
    devices: '1 Dispositivo (Perfil)',
    quality: 'Full HD 1080p',
    badge: 'Premier League',
    tagline: 'Premier League en vivo, cine de Hollywood y series de Showtime',
    description: 'Franquicias como Yellowstone, fútbol de la Premier League en directo y miles de episodios de Nickelodeon para la familia.',
    features: ['Partidos de la Premier League', 'Producciones de Showtime', 'Series infantiles Nickelodeon', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    accentColor: '#0064ff',
    inStock: true,
  },
  {
    id: 'p-prime-video',
    type: 'profile',
    name: 'Amazon Prime Video',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 35,
    originalPrice: 50,
    devices: '1 Dispositivo (Perfil)',
    quality: '4K Ultra HD',
    badge: 'Series Prime',
    tagline: 'Series galardonadas, películas taquilleras y producciones exclusivas',
    description: 'Disfruta de The Boys, Los Anillos de Poder, Invincible y un catálogo inmenso de cine en resolución 4K HDR con soporte multilingüe.',
    features: ['Resolución 4K Ultra HD', 'Función X-Ray exclusiva', 'Perfil personal', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    accentColor: '#00a8e1',
    inStock: true,
  },
  {
    id: 'p-universal',
    type: 'profile',
    name: 'Universal+',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 30,
    originalPrice: 45,
    devices: '1 Dispositivo (Perfil)',
    quality: 'Full HD 1080p',
    badge: 'Canales Exclusivos',
    tagline: 'Canales premium de Universal, series policiacas y comedia',
    description: 'Acceso a Universal Premiere, Cinema, Crime, Comedy y Reality con producciones completas de NBCUniversal sin cortes.',
    features: ['Canales en vivo de Universal', 'Series completas de drama y crimen', 'Sin cortes comerciales', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    accentColor: '#002244',
    inStock: true,
  },
  {
    id: 'p-apple-tv',
    type: 'profile',
    name: 'Apple TV+',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 30,
    originalPrice: 50,
    devices: '1 Dispositivo (Perfil)',
    quality: '4K Dolby Vision',
    badge: 'Apple Originals',
    tagline: 'Historias aclamadas por la crítica en máxima tasa de bits',
    description: 'El hogar de Ted Lasso, Severance y Morning Show en la calidad audiovisual más nítida de la industria del streaming.',
    features: ['Calidad 4K Dolby Vision y Dolby Atmos', 'Contenido 100% original', 'Sin anuncios', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1585792180666-f7547c691f61?auto=format&fit=crop&w=600&q=80',
    accentColor: '#222222',
    inStock: true,
  },
  {
    id: 'p-spotify',
    type: 'profile',
    name: 'Spotify',
    category: 'musica',
    categoryLabel: 'Música & Podcasts',
    price: 55,
    originalPrice: 75,
    devices: '1 Dispositivo (Plan Premium)',
    quality: 'Audio 320 kbps',
    badge: 'Música Sin Límites',
    tagline: 'Música sin anuncios, saltos ilimitados y descargas sin conexión',
    description: 'Lleva tu música a todos lados sin interrupciones publicitarias. Escucha tus listas favoritas en el auto, gimnasio o viajes.',
    features: ['Cero anuncios publicitarios', 'Saltos ilimitados de canciones', 'Modo offline sin datos', 'Audio de alta fidelidad'],
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=600&q=80',
    accentColor: '#1db954',
    inStock: true,
  },
];

// Initial official prices for full accounts:
const INITIAL_FULL_ACCOUNTS: CatalogItem[] = [
  {
    id: 'f-disney',
    type: 'full',
    name: 'Disney+',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 95,
    originalPrice: 130,
    devices: 'Cuenta Completa (Todas las pantallas)',
    quality: '4K UHD + ESPN',
    badge: 'Cuenta Completa',
    tagline: 'Cuenta completa exclusiva para tu hogar con todos los perfiles',
    description: 'Cuenta original completa de Disney+ con control total. Puedes crear perfiles para toda tu familia y disfrutar de transmisiones de ESPN en múltiples pantallas.',
    features: ['Control total de todos los perfiles', 'Múltiples pantallas simultáneas', 'Contenido 4K UHD + ESPN', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    accentColor: '#113ccf',
    inStock: true,
  },
  {
    id: 'f-hbo-max',
    type: 'full',
    name: 'HBO Max (Max)',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 85,
    originalPrice: 120,
    devices: 'Cuenta Completa (Todas las pantallas)',
    quality: '4K HDR',
    badge: 'Cuenta Completa',
    tagline: 'Cuenta completa para tu hogar con películas y series sin límite',
    description: 'Disfruta de HBO Max en tu sala y recámaras al mismo tiempo. Crea tus propios perfiles y guarda tus series favoritas.',
    features: ['Cuenta completa para la familia', 'Pantallas simultáneas', 'Calidad 4K HDR', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
    accentColor: '#002be7',
    inStock: true,
  },
  {
    id: 'f-vix',
    type: 'full',
    name: 'ViX Premium',
    category: 'deportes',
    categoryLabel: 'Fútbol & Entretenimiento',
    price: 35,
    originalPrice: 60,
    devices: 'Cuenta Completa',
    quality: 'Full HD 1080p',
    badge: 'Cuenta Completa',
    tagline: 'Cuenta completa para ver la Liga MX y entretenimiento en familia',
    description: 'Acceso a cuenta completa de ViX Premium. Partidos en vivo, telenovelas y series originales sin cortes comerciales.',
    features: ['Cuenta completa con acceso total', 'Fútbol de Liga MX en vivo', 'Canales en directo', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1508733467250-eab977e40644?auto=format&fit=crop&w=600&q=80',
    accentColor: '#ff5e00',
    inStock: true,
  },
  {
    id: 'f-crunchyroll',
    type: 'full',
    name: 'Crunchyroll',
    category: 'anime',
    categoryLabel: 'Anime & Manga',
    price: 65,
    originalPrice: 95,
    devices: 'Cuenta Completa Mega Fan',
    quality: 'Full HD 1080p',
    badge: 'Cuenta Completa',
    tagline: 'Cuenta completa Mega Fan para ver anime sin límites en tu hogar',
    description: 'Múltiples pantallas simultáneas y descargas ilimitadas para disfrutar de los estrenos de Japón con tus amigos o familia.',
    features: ['Plan Mega Fan completo', 'Pantallas simultáneas', 'Descargas offline', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    accentColor: '#f47521',
    inStock: true,
  },
  {
    id: 'f-paramount',
    type: 'full',
    name: 'Paramount+',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 70,
    originalPrice: 100,
    devices: 'Cuenta Completa',
    quality: 'Full HD 1080p',
    badge: 'Cuenta Completa',
    tagline: 'Cuenta completa para ver cine, series de Showtime y Premier League',
    description: 'Toda la programación de Paramount+ en cuenta completa para disfrutar en cualquier Smart TV o dispositivo.',
    features: ['Cuenta completa exclusiva', 'Premier League y Showtime', 'Perfiles infantiles y familiares', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    accentColor: '#0064ff',
    inStock: true,
  },
  {
    id: 'f-prime-video',
    type: 'full',
    name: 'Amazon Prime Video',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 70,
    originalPrice: 100,
    devices: 'Cuenta Completa',
    quality: '4K Ultra HD',
    badge: 'Cuenta Completa',
    tagline: 'Cuenta completa de Prime Video para maratonear en múltiples pantallas',
    description: 'Disfruta de todo el catálogo de producciones originales de Amazon en cuenta completa para tu hogar.',
    features: ['Cuenta completa con perfiles propios', 'Calidad 4K Ultra HD', 'Descargas para ver offline', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    accentColor: '#00a8e1',
    inStock: true,
  },
  {
    id: 'f-apple-tv',
    type: 'full',
    name: 'Apple TV+',
    category: 'peliculas_series',
    categoryLabel: 'Películas & Series',
    price: 75,
    originalPrice: 110,
    devices: 'Cuenta Completa',
    quality: '4K Dolby Vision',
    badge: 'Cuenta Completa',
    tagline: 'Cuenta completa para disfrutar del cine y series de Apple Originals',
    description: 'Calidad cinematográfica en todos tus dispositivos con acceso completo a las producciones de Apple TV+.',
    features: ['Acceso completo multidispositivo', 'Tasa de bits máxima en 4K', 'Sin cortes ni publicidad', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1585792180666-f7547c691f61?auto=format&fit=crop&w=600&q=80',
    accentColor: '#222222',
    inStock: true,
  },
  {
    id: 'f-spotify',
    type: 'full',
    name: 'Spotify',
    category: 'musica',
    categoryLabel: 'Música & Podcasts',
    price: 55,
    originalPrice: 85,
    devices: 'Cuenta Completa / Plan',
    quality: 'Audio 320 kbps',
    badge: 'Cuenta Completa',
    tagline: 'Tu propia cuenta premium de Spotify sin publicidad y con descargas',
    description: 'Música ilimitada en tu propia cuenta sin interrupciones. Reproduce en tus bocinas, automóvil, smartwatch y celular.',
    features: ['Sin publicidad entre canciones', 'Saltos ilimitados', 'Máxima calidad de audio', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=600&q=80',
    accentColor: '#1db954',
    inStock: true,
  },
  {
    id: 'f-fox-one',
    type: 'full',
    name: 'Fox One',
    category: 'deportes',
    categoryLabel: 'Fútbol & Deportes',
    price: 80,
    originalPrice: 110,
    devices: 'Cuenta Completa',
    quality: 'Full HD 1080p',
    badge: 'Deportes Exclusivos',
    tagline: 'Transmisiones deportivas de alto nivel, motor y campeonatos',
    description: 'Acceso a eventos deportivos exclusivos, automovilismo y análisis deportivo con señal en alta definición.',
    features: ['Eventos deportivos estelares', 'Transmisiones en vivo', 'Señal estable de alta definición', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
    accentColor: '#d62828',
    inStock: true,
  },
];

// Combos y promociones: La administradora los configurará desde su panel sin inventar.
const INITIAL_COMBOS: ComboItem[] = [];

// Cuentas asignadas a clientes con nombres, correos de cuenta, PINs y fechas de renovación:
const INITIAL_CLIENT_ACCOUNTS: ClientAccount[] = [
  {
    id: 'acc-101',
    clientId: 'usr-demo-client',
    clientUsername: 'mariana.lopez',
    clientName: 'Mariana López',
    clientPhone: '+529831234567',
    accountName: 'Netflix Premium (Perfil 1 Privado 4K)',
    serviceType: 'profile',
    accountEmail: 'brisa.netflix01@gmail.com',
    accountPassword: 'BrisaStream2026*',
    pin: '7412',
    price: 88,
    startDate: '2026-10-28',
    renewalDate: '2026-11-28',
    paymentStatus: 'al_dia',
    lastPaymentDate: '2026-10-28',
    notes: 'Perfil 1 exclusivo con PIN 7412. Garantía 25 días activa.',
    createdAt: '2026-10-28T12:00:00.000Z',
  },
  {
    id: 'acc-102',
    clientId: 'usr-demo-client',
    clientUsername: 'mariana.lopez',
    clientName: 'Mariana López',
    clientPhone: '+529831234567',
    accountName: 'Disney+ & ESPN (Perfil 1 Dispositivo)',
    serviceType: 'profile',
    accountEmail: 'brisa.disney03@gmail.com',
    accountPassword: 'DisneyPassBrisa99',
    pin: '3309',
    price: 40,
    startDate: '2026-11-01',
    renewalDate: '2026-12-01',
    paymentStatus: 'al_dia',
    lastPaymentDate: '2026-11-01',
    notes: 'Acceso con deportes ESPN en vivo.',
    createdAt: '2026-11-01T14:30:00.000Z',
  },
  {
    id: 'acc-103',
    clientId: 'usr-pending-sample',
    clientUsername: 'carlos.streamer',
    clientName: 'Carlos Méndez',
    clientPhone: '+529837654321',
    accountName: 'HBO Max (Max) - Cuenta Completa Hogar',
    serviceType: 'full',
    accountEmail: 'brisa.max.hogar02@gmail.com',
    accountPassword: 'MaxFamiliaBrisa26!',
    price: 85,
    startDate: '2026-10-26',
    renewalDate: '2026-11-26',
    paymentStatus: 'por_vencer',
    lastPaymentDate: '2026-10-26',
    notes: 'Cuenta completa familiar. Próxima fecha de renovación en pocos días.',
    createdAt: '2026-10-26T16:00:00.000Z',
  },
  {
    id: 'acc-104',
    clientId: 'usr-demo-client',
    clientUsername: 'mariana.lopez',
    clientName: 'Mariana López',
    clientPhone: '+529831234567',
    accountName: 'Spotify Premium - Cuenta Completa',
    serviceType: 'full',
    accountEmail: 'brisa.spotify05@gmail.com',
    accountPassword: 'MusicaBrisa2026#',
    price: 55,
    startDate: '2026-11-02',
    renewalDate: '2026-12-02',
    paymentStatus: 'al_dia',
    lastPaymentDate: '2026-11-02',
    notes: 'Audio de alta fidelidad sin interrupciones.',
    createdAt: '2026-11-02T10:00:00.000Z',
  },
];

export class Database {
  private static instance: Database;
  private db: DatabaseSchema;

  private constructor() {
    this.ensureDataDir();
    this.db = this.load();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          sessions: parsed.sessions || [],
          resetRequests: parsed.resetRequests || [],
          profiles: parsed.profiles || INITIAL_PROFILES,
          fullAccounts: parsed.fullAccounts || INITIAL_FULL_ACCOUNTS,
          combos: parsed.combos || INITIAL_COMBOS,
          orders: parsed.orders || [],
          clientAccounts: Array.isArray(parsed.clientAccounts) && parsed.clientAccounts.length > 0
            ? parsed.clientAccounts
            : INITIAL_CLIENT_ACCOUNTS,
        };
      } catch (err) {
        console.error('Error reading database file, initializing defaults:', err);
      }
    }

    const defaultAdminHash = bcrypt.hashSync('AdminBrisa2026!', 10);
    const defaultClientHash = bcrypt.hashSync('Cliente123!', 10);

    const initialDb: DatabaseSchema = {
      users: [
        {
          id: 'usr-admin-1',
          username: 'admin',
          email: 'admin@brisapremium.com',
          phone: '+529831826892',
          passwordHash: defaultAdminHash,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          notes: 'Administradora principal de Brisa Premium',
        },
        {
          id: 'usr-demo-client',
          username: 'mariana.lopez',
          email: 'mariana@ejemplo.com',
          phone: '+529831234567',
          passwordHash: defaultClientHash,
          role: 'client',
          status: 'active',
          createdAt: new Date().toISOString(),
          notes: 'Cliente autorizado de prueba',
        },
        {
          id: 'usr-pending-sample',
          username: 'carlos.streamer',
          email: 'carlos@ejemplo.com',
          phone: '+529837654321',
          passwordHash: defaultClientHash,
          role: 'client',
          status: 'pending',
          createdAt: new Date().toISOString(),
          notes: 'Registro reciente pendiente de autorización',
        },
      ],
      sessions: [],
      resetRequests: [],
      profiles: INITIAL_PROFILES,
      fullAccounts: INITIAL_FULL_ACCOUNTS,
      combos: INITIAL_COMBOS,
      orders: [
        {
          id: 'ord-101',
          customerName: 'Mariana López',
          customerPhone: '+529831234567',
          customerEmail: 'mariana@ejemplo.com',
          itemType: 'profile',
          itemName: 'Netflix Premium (Perfil)',
          price: 88,
          status: 'entregado',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          notes: 'Perfil PIN 4821 entregado por WhatsApp',
        },
      ],
      clientAccounts: INITIAL_CLIENT_ACCOUNTS,
    };

    this.save(initialDb);
    return initialDb;
  }

  private save(data?: DatabaseSchema) {
    const toSave = data || this.db;
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  // --- AUTHENTICATION & USERS ---
  public authenticateUser(identifier: string, plainPassword: string): { user?: User; token?: string; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const user = this.db.users.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!user) {
      return { error: 'Usuario o correo electrónico no encontrado.' };
    }

    const matches = bcrypt.compareSync(plainPassword, user.passwordHash);
    if (!matches) {
      return { error: 'Contraseña incorrecta. Por favor verifica tus datos.' };
    }

    if (user.status === 'pending') {
      return {
        error:
          'Tu cuenta está en proceso de revisión y pendiente de autorización por la administración de Brisa Premium. Te notificaremos a tu WhatsApp (+52 9831826892) cuando esté activa.',
      };
    }

    if (user.status === 'blocked') {
      return {
        error: 'Tu cuenta se encuentra suspendida o bloqueada. Comunícate a nuestro WhatsApp oficial: +52 9831826892.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 días
    this.db.sessions.push({ token, userId: user.id, expiresAt });
    user.lastLogin = new Date().toISOString();
    this.save();

    return { user, token };
  }

  public registerClient(data: {
    username: string;
    email: string;
    phone: string;
    password: string;
  }): { success: boolean; message: string; user?: User } {
    const cleanUsername = data.username.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    if (!cleanUsername || !cleanEmail || !data.password) {
      return { success: false, message: 'Todos los campos son obligatorios.' };
    }

    const exists = this.db.users.some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      return { success: false, message: 'El nombre de usuario o correo ya se encuentra registrado.' };
    }

    const passwordHash = bcrypt.hashSync(data.password, 10);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone || '+52 9831826892',
      passwordHash,
      role: 'client',
      status: 'pending', // Sujeto a autorización del admin
      createdAt: new Date().toISOString(),
      notes: 'Registrado desde la página web, esperando aprobación',
    };

    this.db.users.push(newUser);
    this.save();

    return {
      success: true,
      message:
        '¡Tu cuenta ha sido creada con éxito! Se encuentra en estado PENDIENTE DE AUTORIZACIÓN. La administradora de Brisa Premium revisará y activará tu acceso a la brevedad.',
      user: newUser,
    };
  }

  public getUserByToken(token: string): User | null {
    if (!token) return null;
    const session = this.db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
    if (!session) return null;
    return this.db.users.find((u) => u.id === session.userId) || null;
  }

  public getAllUsers(): User[] {
    return this.db.users.map((u) => ({
      ...u,
      passwordHash: '***PROTEGIDA***', // No exponer hashes
    }));
  }

  public updateUserStatus(userId: string, newStatus: 'pending' | 'active' | 'blocked'): boolean {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) return false;
    user.status = newStatus;
    this.save();
    return true;
  }

  public updateUser(userId: string, updates: Partial<User>): boolean {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) return false;
    if (updates.username) user.username = updates.username;
    if (updates.email) user.email = updates.email;
    if (updates.phone) user.phone = updates.phone;
    if (updates.notes !== undefined) user.notes = updates.notes;
    if (updates.status) user.status = updates.status;
    if (updates.passwordHash && updates.passwordHash.length > 5) {
      user.passwordHash = bcrypt.hashSync(updates.passwordHash, 10);
    }
    this.save();
    return true;
  }

  public deleteUser(userId: string): boolean {
    const idx = this.db.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    if (this.db.users[idx].role === 'admin') return false; // Proteger admin
    this.db.users.splice(idx, 1);
    this.db.sessions = this.db.sessions.filter((s) => s.userId !== userId);
    this.save();
    return true;
  }

  public requestPasswordReset(emailOrPhone: string): { success: boolean; message: string; pin?: string } {
    const target = emailOrPhone.trim().toLowerCase();
    const user = this.db.users.find(
      (u) => u.email.toLowerCase() === target || u.phone.includes(target) || u.username.toLowerCase() === target
    );

    if (!user) {
      return {
        success: false,
        message: 'No se encontró ninguna cuenta asociada a este usuario/correo.',
      };
    }

    // Generar PIN de 6 dígitos
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos
    this.db.resetRequests = this.db.resetRequests.filter((r) => r.email !== user.email);
    this.db.resetRequests.push({ email: user.email, pin, expiresAt });
    this.save();

    return {
      success: true,
      message: `Se ha generado tu solicitud de restablecimiento con el código PIN: ${pin}. Comunícate por WhatsApp al +52 9831826892 o ingrésalo aquí con tu nueva contraseña.`,
      pin,
    };
  }

  public resetPassword(email: string, pin: string, newPassword: string): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const req = this.db.resetRequests.find(
      (r) => r.email.toLowerCase() === cleanEmail && r.pin === pin && r.expiresAt > Date.now()
    );

    if (!req) {
      return { success: false, message: 'El PIN de recuperación es inválido o ha expirado.' };
    }

    const user = this.db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) return { success: false, message: 'Usuario no encontrado.' };

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    this.db.resetRequests = this.db.resetRequests.filter((r) => r.email !== cleanEmail);
    this.save();

    return { success: true, message: '¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.' };
  }

  // --- CATALOG MANAGEMENT (PROFILES & FULL ACCOUNTS) ---
  public getCatalog(): { profiles: CatalogItem[]; fullAccounts: CatalogItem[]; combos: ComboItem[] } {
    return {
      profiles: this.db.profiles,
      fullAccounts: this.db.fullAccounts,
      combos: this.db.combos,
    };
  }

  public updateCatalogItem(type: 'profile' | 'full', id: string, updates: Partial<CatalogItem>): boolean {
    const list = type === 'profile' ? this.db.profiles : this.db.fullAccounts;
    const item = list.find((i) => i.id === id);
    if (!item) return false;

    Object.assign(item, updates);
    this.save();
    return true;
  }

  public addCatalogItem(type: 'profile' | 'full', item: CatalogItem): boolean {
    const list = type === 'profile' ? this.db.profiles : this.db.fullAccounts;
    list.push(item);
    this.save();
    return true;
  }

  public deleteCatalogItem(type: 'profile' | 'full', id: string): boolean {
    const list = type === 'profile' ? this.db.profiles : this.db.fullAccounts;
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.save();
    return true;
  }

  // --- COMBOS MANAGEMENT ---
  public saveCombo(combo: ComboItem): void {
    const idx = this.db.combos.findIndex((c) => c.id === combo.id);
    if (idx >= 0) {
      this.db.combos[idx] = combo;
    } else {
      this.db.combos.push(combo);
    }
    this.save();
  }

  public deleteCombo(comboId: string): boolean {
    const idx = this.db.combos.findIndex((c) => c.id === comboId);
    if (idx === -1) return false;
    this.db.combos.splice(idx, 1);
    this.save();
    return true;
  }

  // --- ORDERS ---
  public createOrder(order: Omit<OrderItem, 'id' | 'createdAt'>): OrderItem {
    const newOrder: OrderItem = {
      ...order,
      id: `ord-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.db.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public getOrders(): OrderItem[] {
    return this.db.orders;
  }

  public updateOrderStatus(orderId: string, status: 'pendiente' | 'entregado' | 'cancelado'): boolean {
    const ord = this.db.orders.find((o) => o.id === orderId);
    if (!ord) return false;
    ord.status = status;
    this.save();
    return true;
  }

  // --- CLIENT ACCOUNTS & PAYMENT MANAGEMENT ---
  public getClientAccounts(clientIdOrUsername?: string): ClientAccount[] {
    if (!this.db.clientAccounts) this.db.clientAccounts = [...INITIAL_CLIENT_ACCOUNTS];
    if (!clientIdOrUsername) {
      return this.db.clientAccounts;
    }
    const cleanId = clientIdOrUsername.trim().toLowerCase();
    return this.db.clientAccounts.filter(
      (a) =>
        (a.clientId && a.clientId.toLowerCase() === cleanId) ||
        (a.clientUsername && a.clientUsername.toLowerCase() === cleanId)
    );
  }

  public addClientAccount(account: Omit<ClientAccount, 'id' | 'createdAt'>): ClientAccount {
    if (!this.db.clientAccounts) this.db.clientAccounts = [];
    const newAccount: ClientAccount = {
      ...account,
      id: `acc-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    this.db.clientAccounts.unshift(newAccount);
    this.save();
    return newAccount;
  }

  public updateClientAccount(id: string, updates: Partial<ClientAccount>): boolean {
    if (!this.db.clientAccounts) this.db.clientAccounts = [];
    const item = this.db.clientAccounts.find((a) => a.id === id);
    if (!item) return false;
    Object.assign(item, updates);
    this.save();
    return true;
  }

  public deleteClientAccount(id: string): boolean {
    if (!this.db.clientAccounts) return false;
    const idx = this.db.clientAccounts.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.db.clientAccounts.splice(idx, 1);
    this.save();
    return true;
  }

  public renewClientAccount(id: string, days: number = 30): { success: boolean; account?: ClientAccount } {
    if (!this.db.clientAccounts) return { success: false };
    const item = this.db.clientAccounts.find((a) => a.id === id);
    if (!item) return { success: false };

    const now = new Date();
    let baseDate = new Date(item.renewalDate);
    if (isNaN(baseDate.getTime()) || baseDate < now) {
      baseDate = now;
    }
    baseDate.setDate(baseDate.getDate() + days);
    const newRenewalDate = baseDate.toISOString().slice(0, 10);

    item.renewalDate = newRenewalDate;
    item.paymentStatus = 'al_dia';
    item.lastPaymentDate = now.toISOString().slice(0, 10);
    this.save();
    return { success: true, account: item };
  }

  // --- LUNARIA AI PROMPT GROUNDING ---
  public getCatalogPromptForAI(): string {
    const profilesText = this.db.profiles
      .filter((p) => p.inStock)
      .map((p) => `• [PERFIL 1 DISPOSITIVO] ${p.name}: $${p.price} MXN al mes (Calidad: ${p.quality}).`)
      .join('\n');

    const fullAccountsText = this.db.fullAccounts
      .filter((f) => f.inStock)
      .map((f) => `• [CUENTA COMPLETA] ${f.name}: $${f.price} MXN al mes (Multidispositivo hogar).`)
      .join('\n');

    const combosList = this.db.combos.filter((c) => c.inStock);
    const combosText = combosList.length > 0
      ? combosList.map((c) => `• [COMBO EN PROMOCIÓN] ${c.name}: $${c.price} MXN al mes (Antes: $${c.originalPrice} MXN). Incluye: ${c.platforms.join(' + ')}.`).join('\n')
      : 'Actualmente la administración está actualizando los combos y promociones oficiales. Informa al cliente que los combos y descuentos especiales vigentes se consultan directamente por WhatsApp.';

    return `
INFORMACIÓN OFICIAL Y POLÍTICAS REALES DE SERVICIO:
Negocio: BRISA PREMIUM - Servicios y suscripciones de streaming y entretenimiento.
WhatsApp oficial de ventas y soporte: +52 983 182 6892 (+52 9831826892)
Enlace de contacto directo: https://wa.me/529831826892
Tiempo de entrega inicial: La entrega de la cuenta o perfil puede durar de 5 minutos a 1 hora tras confirmar el comprobante de pago por WhatsApp.
Garantía oficial: Garantía de 25 días en todas las cuentas y perfiles.

RESPUESTAS A PREGUNTAS REALES Y FRECUENTES DE LOS CLIENTES:
1. ¿LA CUENTA PUEDE FALLAR?
   -> Sí, como en cualquier servicio digital de streaming, la cuenta o perfil sí puede llegar a fallar debido a actualizaciones de las plataformas, caídas de sesión o bloqueos técnicos.
   -> POR ESO SE OTORGA LA GARANTÍA DE 25 DÍAS: Si tu cuenta llega a fallar dentro de los 25 días de garantía, cuentas con respaldo total.
   -> REPOSICIÓN DE CORREO: En caso de fallo confirmado, se brinda una reposición de correo/cuenta en un lapso de 1 a 3 días hábiles.
   -> ¿CÓMO SE REPORTA? Solo debes escribir a nuestro WhatsApp oficial (+52 9831826892) indicando tu servicio y se atiende la reposición.

2. ¿QUÉ REGLAS DEBO CUMPLIR EN UN PERFIL (1 DISPOSITIVO)?
   -> En modalidad de Perfil no debes modificar la contraseña ni el correo de la cuenta matriz; únicamente debes ingresar a tu perfil con tu PIN personal. Cambiar datos ajenos anula la garantía.
   -> Es exclusivo para 1 pantalla a la vez. Para ver en múltiples pantallas al mismo tiempo, adquiere una Cuenta Completa.

3. ¿CÓMO SE PAGA?
   -> Por transferencia SPEI sin comisión, depósitos en tiendas OXXO o tarjetas a través de WhatsApp.

4. ¿POR QUÉ NETFLIX NO ESTÁ EN CUENTA COMPLETA?
   -> Respuesta obligatoria: Porque en BRISA PREMIUM se maneja en modalidad privada de un perfil (perfil privado con PIN exclusivo para 1 dispositivo por $88 MXN al mes). No se maneja cuenta completa de Netflix porque se comercializa únicamente como perfil privado.
   -> (Universal+ tampoco está en cuenta completa porque su precio aún no está confirmado).

CATÁLOGO EXACTO DE PERFILES (1 DISPOSITIVO):
${profilesText}

CATÁLOGO EXACTO DE CUENTAS COMPLETAS (MULTIDISPOSITIVO HOGAR):
${fullAccountsText}

PROMOCIONES Y COMBOS ACTIVOS:
${combosText}

REGLAS DE ORO PARA LUNARIA AI:
1. Eres Lunaria AI, la asesora virtual oficial y transparente de BRISA PREMIUM.
2. Saludo inicial estándar: «¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?»
3. TRANSPARENCIA ANTE DUDAS DE FALLAS: Si el cliente pregunta si la cuenta puede fallar o cómo funciona la garantía, sé honesta y clara: explícale que sí puede fallar por actualizaciones de las plataformas y que precisamente por eso cuenta con 25 días de garantía, donde en caso de fallo se le da una reposición de correo en un lapso de 1 a 3 días comunicándose a WhatsApp (+52 9831826892).
4. ¿POR QUÉ NETFLIX NO ESTÁ EN CUENTA COMPLETA? Si te preguntan por qué Netflix no está en cuenta completa, responde exactamente: «Porque en Brisa Premium se maneja privada de un perfil (perfil individual protegido con PIN propio a $88 MXN al mes)».
5. DIFERENCIACIÓN OBLIGATORIA: Cuando te pregunten precios o características, aclara siempre si es en "Perfil (1 dispositivo)" o "Cuenta Completa".
6. TIEMPO DE ENTREGA: De 5 minutos a 1 hora tras verificar el comprobante en WhatsApp.
7. COMBOS Y PROMOCIONES: Si hay combos arriba, menciónalos con sus precios exactos. Si no hay registrados, no inventes nada y pide al cliente consultar ofertas vigentes por WhatsApp (+52 9831826892).
8. NUNCA inventes precios, plataformas ni garantías distintas a los 25 días.
`;
  }
}
