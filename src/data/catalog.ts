export interface CatalogPlan {
  id: string;
  type: 'profile' | 'full'; // 'profile' = 1 Dispositivo, 'full' = Cuenta Completa
  typeLabel: string; // 'Perfil (1 Dispositivo)' o 'Cuenta Completa'
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

export interface CatalogCombo {
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

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const BRAND_INFO = {
  name: 'BRISA PREMIUM',
  tagline: 'Suscripciones Digitales & Streaming',
  slogan: 'Tu entretenimiento favorito al mejor precio, con entrega confiable y garantía oficial de 25 días.',
  phone: '+52 9831826892',
  phoneDisplay: '+52 983 182 6892',
  whatsappUrl: 'https://wa.me/529831826892',
  email: 'soporte@brisapremium.com',
  schedule: 'Lunes a Domingo: 9:00 AM - 10:00 PM (Hora Central México)',
  activationPolicy: 'La entrega de cuenta puede durar de 5 minutos a una hora una vez confirmado tu comprobante de pago por WhatsApp.',
  paymentMethods: 'Transferencia bancaria SPEI, depósitos en OXXO, tarjetas de débito/crédito y Mercado Pago.',
  guarantee: 'Garantía de 25 días en todas tus cuentas y perfiles. Si tienes cualquier inconveniente de acceso durante tu periodo, te resolvemos o reponemos de inmediato.',
};

export function getWhatsAppOrderLink(
  planName: string,
  price: number,
  typeText: string = 'Perfil (1 Dispositivo)'
): string {
  const text = encodeURIComponent(
    `¡Hola Brisa Premium! ✨ Me interesa contratar "${planName}" en modalidad [${typeText}] por $${price} MXN. ¿Me podrían indicar los métodos de pago y tiempos de entrega (5 min a 1 hora)?`
  );
  return `${BRAND_INFO.whatsappUrl}?text=${text}`;
}

export function getWhatsAppComboLink(comboName: string, price: number): string {
  const text = encodeURIComponent(
    `¡Hola Brisa Premium! ✨ Quiero consultar y contratar la promoción "${comboName}" por $${price} MXN. ¿Está disponible para entrega?`
  );
  return `${BRAND_INFO.whatsappUrl}?text=${text}`;
}

export function getWhatsAppGeneralLink(customMessage?: string): string {
  const text = encodeURIComponent(
    customMessage || `¡Hola Brisa Premium! ✨ Vengo de su página web y deseo consultar disponibilidad de cuentas y suscripciones de streaming.`
  );
  return `${BRAND_INFO.whatsappUrl}?text=${text}`;
}

// 2. CATÁLOGO DE PERFILES – 1 DISPOSITIVO (Precios oficiales exactos)
export const PROFILES_CATALOG: CatalogPlan[] = [
  {
    id: 'p-netflix',
    type: 'profile',
    typeLabel: 'Perfil (1 Dispositivo)',
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
    typeLabel: 'Perfil (1 Dispositivo)',
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
    typeLabel: 'Perfil (1 Dispositivo)',
    name: 'HBO Max',
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
    typeLabel: 'Perfil (1 Dispositivo)',
    name: 'ViX',
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
    typeLabel: 'Perfil (1 Dispositivo)',
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
    typeLabel: 'Perfil (1 Dispositivo)',
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
    typeLabel: 'Perfil (1 Dispositivo)',
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
    typeLabel: 'Perfil (1 Dispositivo)',
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
    typeLabel: 'Perfil (1 Dispositivo)',
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
    typeLabel: 'Perfil (1 Dispositivo)',
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
    features: ['Cero anuncios publicitarios', 'Saltos ilimitados de canciones', 'Modo offline sin datos', 'Garantía 25 días'],
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=600&q=80',
    accentColor: '#1db954',
    inStock: true,
  },
];

// 3. CATÁLOGO DE CUENTAS COMPLETAS (Precios oficiales exactos)
// Nota: Netflix y Universal+ NO aparecen en cuentas completas (precio pendiente)
export const FULL_ACCOUNTS_CATALOG: CatalogPlan[] = [
  {
    id: 'f-disney',
    type: 'full',
    typeLabel: 'Cuenta Completa',
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
    typeLabel: 'Cuenta Completa',
    name: 'HBO Max',
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
    typeLabel: 'Cuenta Completa',
    name: 'ViX',
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
    typeLabel: 'Cuenta Completa',
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
    typeLabel: 'Cuenta Completa',
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
    typeLabel: 'Cuenta Completa',
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
    typeLabel: 'Cuenta Completa',
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
    typeLabel: 'Cuenta Completa',
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
    typeLabel: 'Cuenta Completa',
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

// Combos y promociones: Sin inventar. La administradora los configurará desde su panel.
export const INITIAL_COMBOS: CatalogCombo[] = [];

export const FAQS: FAQItem[] = [
  {
    category: 'Garantía & Fallas',
    question: '¿La cuenta o perfil puede llegar a fallar y qué garantía tengo?',
    answer: 'Sí, como en cualquier servicio digital de streaming, las cuentas o perfiles sí pueden llegar a presentar fallas o cierres de sesión por actualizaciones de las plataformas. Por esa misma razón en BRISA PREMIUM te damos GARANTÍA DE 25 DÍAS. En caso de fallo confirmado, te brindamos una reposición de correo en un plazo de 1 a 3 días hábiles escribiendo a nuestro WhatsApp (+52 9831826892).',
  },
  {
    category: 'Netflix',
    question: '¿Por qué Netflix no se ofrece como Cuenta Completa en Brisa Premium?',
    answer: 'Porque en BRISA PREMIUM se maneja en modalidad privada de un perfil (perfil individual con PIN propio por $88 MXN al mes). Esta modalidad te permite disfrutar de calidad 4K Ultra HD y descargas offline a un precio accesible y seguro sin pagar el costo total de una cuenta completa.',
  },
  {
    category: 'Entrega',
    question: '¿En cuánto tiempo se entrega mi cuenta o perfil después de pagar?',
    answer: 'La entrega de cuenta puede durar de 5 minutos a una hora una vez confirmado tu comprobante de pago por nuestro WhatsApp (+52 9831826892) dentro de nuestro horario de atención.',
  },
  {
    category: 'Garantía',
    question: '¿Qué garantía tengo con mis suscripciones en Brisa Premium?',
    answer: 'Todas nuestras cuentas y perfiles cuentan con 25 DÍAS DE SOPORTE Y GARANTÍA. Si llegas a tener cualquier detalle de acceso durante tus 25 días de garantía, te resolvemos o reponemos de inmediato por WhatsApp (+52 9831826892) sin costo adicional.',
  },
  {
    category: 'Diferencia',
    question: '¿Cuál es la diferencia entre Perfil (1 Dispositivo) y Cuenta Completa?',
    answer: 'El "Perfil (1 Dispositivo)" te otorga un espacio privado con PIN exclusivo dentro de una cuenta original para que lo uses en tu Smart TV o celular a un precio muy accesible. La "Cuenta Completa" te da el control de toda la cuenta y todos los perfiles para que tu familia pueda ver en múltiples pantallas simultáneamente.',
  },
  {
    category: 'Promociones',
    question: '¿Tienen combos y promociones especiales?',
    answer: 'Sí, contamos con promociones oficiales que la administración actualiza periódicamente. Puedes consultar los paquetes y descuentos vigentes directamente en la sección de Combos o escribiéndonos a nuestro WhatsApp (+52 9831826892).',
  },
  {
    category: 'Pagos',
    question: '¿Cuáles son los métodos de pago disponibles?',
    answer: 'Aceptamos transferencias electrónicas SPEI sin comisiones, depósitos en efectivo en tiendas OXXO, tarjetas de débito/crédito y pagos a través de Mercado Pago para tu total comodidad.',
  },
  {
    category: 'Renovación',
    question: '¿Cómo renuevo mi suscripción el siguiente periodo?',
    answer: 'No manejamos cobros automáticos a tu tarjeta. Días antes de que concluya tu periodo te avisamos por WhatsApp; si decides continuar, simplemente transfieres y conservas tu mismo perfil y tus listas favoritas sin interrupciones.',
  },
  {
    category: 'Lunaria AI',
    question: '¿Cómo me ayuda el asistente Lunaria AI?',
    answer: 'Lunaria AI te asesora al instante: te dice qué plataformas tienen tus películas o series favoritas, diferencia precios entre perfiles y cuentas completas, te informa de las promociones oficiales configuradas por la administración y te ayuda a enviar tu pedido ordenado a nuestro WhatsApp.',
  },
];
