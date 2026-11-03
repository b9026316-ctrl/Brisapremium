import { GoogleGenAI } from '@google/genai';
import { Database } from './db.ts';

export async function handleApiRequest(
  method: string,
  pathname: string,
  bodyText: string,
  headers: Record<string, string | string[] | undefined>
): Promise<{ statusCode: number; data: any }> {
  const db = Database.getInstance();
  const authHeader = (headers['authorization'] || headers['Authorization']) as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const currentUser = token ? db.getUserByToken(token) : null;
  const isAdmin = currentUser?.role === 'admin' && currentUser?.status === 'active';

  let body: any = {};
  try {
    if (bodyText) body = JSON.parse(bodyText);
  } catch (e) {
    // ignore parse error if empty
  }

  // 1. PUBLIC CATALOG
  if (pathname === '/api/catalog' && method === 'GET') {
    return { statusCode: 200, data: db.getCatalog() };
  }

  // 2. AUTH: LOGIN
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { identifier, password } = body;
    if (!identifier || !password) {
      return { statusCode: 400, data: { error: 'Por favor ingresa usuario y contraseña.' } };
    }
    const result = db.authenticateUser(identifier, password);
    if (result.error) {
      return { statusCode: 401, data: { error: result.error } };
    }
    return {
      statusCode: 200,
      data: {
        success: true,
        token: result.token,
        user: {
          id: result.user!.id,
          username: result.user!.username,
          email: result.user!.email,
          phone: result.user!.phone,
          role: result.user!.role,
          status: result.user!.status,
        },
      },
    };
  }

  // 3. AUTH: REGISTER (CLIENT SUJETO A AUTORIZACIÓN)
  if (pathname === '/api/auth/register' && method === 'POST') {
    const { username, email, phone, password } = body;
    const res = db.registerClient({ username, email, phone, password });
    return { statusCode: res.success ? 200 : 400, data: res };
  }

  // 4. AUTH: CURRENT USER PROFILE
  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!currentUser) {
      return { statusCode: 401, data: { error: 'No autenticado o sesión expirada.' } };
    }
    return {
      statusCode: 200,
      data: {
        user: {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          phone: currentUser.phone,
          role: currentUser.role,
          status: currentUser.status,
        },
      },
    };
  }

  // 5. AUTH: FORGOT PASSWORD
  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    const { identifier } = body;
    if (!identifier) {
      return { statusCode: 400, data: { error: 'Ingresa tu usuario, correo o teléfono.' } };
    }
    const res = db.requestPasswordReset(identifier);
    return { statusCode: res.success ? 200 : 404, data: res };
  }

  // 6. AUTH: RESET PASSWORD
  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    const { email, pin, newPassword } = body;
    if (!email || !pin || !newPassword) {
      return { statusCode: 400, data: { error: 'Faltan datos requeridos (correo, PIN o nueva contraseña).' } };
    }
    const res = db.resetPassword(email, pin, newPassword);
    return { statusCode: res.success ? 200 : 400, data: res };
  }

  // 7. CREATE ORDER (RECORD & RETURN WHATSAPP LINK)
  if (pathname === '/api/orders' && method === 'POST') {
    const { customerName, customerPhone, customerEmail, itemType, itemName, price, notes } = body;
    if (!itemName || !price) {
      return { statusCode: 400, data: { error: 'Faltan datos del servicio o precio.' } };
    }
    const order = db.createOrder({
      customerName: customerName || currentUser?.username || 'Cliente Web',
      customerPhone: customerPhone || currentUser?.phone || '+529831826892',
      customerEmail: customerEmail || currentUser?.email,
      itemType: itemType || 'profile',
      itemName,
      price: Number(price),
      status: 'pendiente',
      notes,
    });
    return { statusCode: 200, data: { success: true, order } };
  }

  // 7.1 CLIENT PERSONAL SPACE: MY ACCOUNTS & RENEWAL DATES
  if (pathname === '/api/client/my-accounts' && method === 'GET') {
    if (!currentUser) {
      return { statusCode: 401, data: { error: 'No autenticado o sesión expirada.' } };
    }
    const byId = db.getClientAccounts(currentUser.id);
    const byUser = db.getClientAccounts(currentUser.username);
    const combined = [...byId];
    for (const acc of byUser) {
      if (!combined.some((c) => c.id === acc.id)) combined.push(acc);
    }
    return {
      statusCode: 200,
      data: {
        success: true,
        user: {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          phone: currentUser.phone,
        },
        accounts: combined,
      },
    };
  }

  // --- ADMIN PROTECTED ROUTES ---
  if (pathname.startsWith('/api/admin/')) {
    if (!isAdmin) {
      return { statusCode: 403, data: { error: 'Acceso no autorizado. Se requiere rol de Administradora.' } };
    }

    if (pathname === '/api/admin/data' && method === 'GET') {
      const catalog = db.getCatalog();
      return {
        statusCode: 200,
        data: {
          users: db.getAllUsers(),
          profiles: catalog.profiles,
          fullAccounts: catalog.fullAccounts,
          combos: catalog.combos,
          orders: db.getOrders(),
          clientAccounts: db.getClientAccounts(),
        },
      };
    }

    if (pathname === '/api/admin/users/status' && method === 'POST') {
      const { userId, status } = body;
      const success = db.updateUserStatus(userId, status);
      return { statusCode: success ? 200 : 404, data: { success } };
    }

    if (pathname === '/api/admin/users/edit' && method === 'POST') {
      const { userId, updates } = body;
      const success = db.updateUser(userId, updates);
      return { statusCode: success ? 200 : 404, data: { success } };
    }

    if (pathname === '/api/admin/users/delete' && method === 'POST') {
      const { userId } = body;
      const success = db.deleteUser(userId);
      return { statusCode: success ? 200 : 400, data: { success } };
    }

    if (pathname === '/api/admin/catalog/item' && method === 'POST') {
      const { type, item } = body;
      if (!type || !item || !item.id) {
        return { statusCode: 400, data: { error: 'Datos de plataforma incompletos.' } };
      }
      const existing = (type === 'profile' ? db.getCatalog().profiles : db.getCatalog().fullAccounts).some(
        (i) => i.id === item.id
      );
      if (existing) {
        db.updateCatalogItem(type, item.id, item);
      } else {
        db.addCatalogItem(type, item);
      }
      return { statusCode: 200, data: { success: true, catalog: db.getCatalog() } };
    }

    if (pathname === '/api/admin/catalog/delete' && method === 'POST') {
      const { type, id } = body;
      const success = db.deleteCatalogItem(type, id);
      return { statusCode: success ? 200 : 404, data: { success, catalog: db.getCatalog() } };
    }

    if (pathname === '/api/admin/combos/save' && method === 'POST') {
      const { combo } = body;
      if (!combo || !combo.name) {
        return { statusCode: 400, data: { error: 'Datos del combo incompletos.' } };
      }
      db.saveCombo(combo);
      return { statusCode: 200, data: { success: true, combos: db.getCatalog().combos } };
    }

    if (pathname === '/api/admin/combos/delete' && method === 'POST') {
      const { comboId } = body;
      const success = db.deleteCombo(comboId);
      return { statusCode: success ? 200 : 404, data: { success, combos: db.getCatalog().combos } };
    }

    // CLIENT ACCOUNTS MANAGEMENT (ADMIN)
    if (pathname === '/api/admin/client-accounts' && method === 'GET') {
      return { statusCode: 200, data: { success: true, accounts: db.getClientAccounts() } };
    }

    if (pathname === '/api/admin/client-accounts/create' && method === 'POST') {
      const {
        clientId,
        clientUsername,
        clientName,
        clientPhone,
        accountName,
        serviceType,
        accountEmail,
        accountPassword,
        pin,
        price,
        startDate,
        renewalDate,
        paymentStatus,
        notes,
      } = body;

      if (!accountName || !accountEmail) {
        return { statusCode: 400, data: { error: 'El nombre de la cuenta y el correo asignado son obligatorios.' } };
      }

      const created = db.addClientAccount({
        clientId: clientId || `usr-${Date.now()}`,
        clientUsername: clientUsername || (clientName ? clientName.toLowerCase().replace(/\s+/g, '.') : 'cliente'),
        clientName: clientName || clientUsername || 'Cliente Brisa',
        clientPhone: clientPhone || '+529831826892',
        accountName,
        serviceType: serviceType || 'profile',
        accountEmail,
        accountPassword: accountPassword || '',
        pin: pin || '',
        price: Number(price) || 0,
        startDate: startDate || new Date().toISOString().slice(0, 10),
        renewalDate: renewalDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        paymentStatus: paymentStatus || 'al_dia',
        notes: notes || '',
      });

      return { statusCode: 200, data: { success: true, account: created, accounts: db.getClientAccounts() } };
    }

    if (pathname === '/api/admin/client-accounts/edit' && method === 'POST') {
      const { id, updates } = body;
      if (!id || !updates) {
        return { statusCode: 400, data: { error: 'Faltan parámetros de actualización.' } };
      }
      const success = db.updateClientAccount(id, updates);
      return { statusCode: success ? 200 : 404, data: { success, accounts: db.getClientAccounts() } };
    }

    if (pathname === '/api/admin/client-accounts/delete' && method === 'POST') {
      const { id } = body;
      if (!id) return { statusCode: 400, data: { error: 'ID de cuenta no especificado.' } };
      const success = db.deleteClientAccount(id);
      return { statusCode: success ? 200 : 404, data: { success, accounts: db.getClientAccounts() } };
    }

    if (pathname === '/api/admin/client-accounts/renew' && method === 'POST') {
      const { id, days = 30 } = body;
      if (!id) return { statusCode: 400, data: { error: 'ID de cuenta no especificado.' } };
      const res = db.renewClientAccount(id, Number(days) || 30);
      return { statusCode: res.success ? 200 : 404, data: { ...res, accounts: db.getClientAccounts() } };
    }
  }

  // 8. LUNARIA AI CHATBOT (GEMINI)
  if ((pathname === '/api/lunaria/chat' || pathname === '/api/chat') && method === 'POST') {
    const userMessage = body.message?.trim();
    const conversationHistory = Array.isArray(body.history) ? body.history : [];

    if (!userMessage) {
      return { statusCode: 400, data: { error: 'El mensaje no puede estar vacío.' } };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const dynamicPromptContext = db.getCatalogPromptForAI();

    if (!apiKey) {
      // Intelligent fallback using exact dynamic DB data
      return {
        statusCode: 200,
        data: {
          reply: generateSmartStreamingFallback(userMessage, db),
          isFallback: true,
        },
      };
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents: any[] = [];
      for (const item of conversationHistory.slice(-8)) {
        contents.push({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.text }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: `Eres Lunaria AI, la asistente virtual oficial de BRISA PREMIUM (servicios y suscripciones de streaming y entretenimiento).
Hablas con un tono sumamente amable, femenino, moderno, claro y servicial.
Tu saludo o actitud inicial responde al concepto: «¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?»

REGLAS DE ORO:
1. DIFERENCIACIÓN OBLIGATORIA: Existen dos categorías con precios distintos:
   - "Perfiles (1 dispositivo)"
   - "Cuentas Completas (multidispositivo para el hogar)"
   Cuando un usuario pregunte por precios, indica con precisión el costo de Perfil y de Cuenta Completa (si aplica).
2. CASOS ESPECIALES OBLIGATORIOS: Netflix y Universal+ NO están disponibles en cuentas completas (solo en Perfiles de 1 dispositivo).
3. NO inventes precios ni disponibilidad: Basa tus respuestas estrictamente en la base de datos oficial a continuación:

${dynamicPromptContext}`,
        },
      });

      const replyText =
        response.text ||
        '«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?» Con gusto te comparto nuestros precios actualizados de perfiles y cuentas completas.';
      return { statusCode: 200, data: { reply: replyText } };
    } catch (err: any) {
      console.error('Error in Lunaria Gemini API:', err);
      return {
        statusCode: 200,
        data: {
          reply: generateSmartStreamingFallback(userMessage, db),
          error: err?.message,
        },
      };
    }
  }

  return { statusCode: 404, data: { error: 'Ruta no encontrada' } };
}

function generateSmartStreamingFallback(query: string, db: Database): string {
  const q = query.toLowerCase();
  const catalog = db.getCatalog();

  if (q.includes('precio') || q.includes('costo') || q.includes('cuanto') || q.includes('cuánto')) {
    return `«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?»\n\nAquí tienes nuestros precios oficiales y actualizados en BRISA PREMIUM:\n\n📺 PERFILES (1 DISPOSITIVO):\n• Netflix: $88 MXN\n• Disney+: $40 MXN\n• HBO Max: $37 MXN\n• Amazon Prime Video: $35 MXN\n• ViX: $30 MXN\n• Crunchyroll: $30 MXN\n• Paramount+: $30 MXN\n• Universal+: $30 MXN\n• Apple TV+: $30 MXN\n• Spotify: $55 MXN\n\n🏠 CUENTAS COMPLETAS (HOGAR):\n• Disney+: $95 MXN\n• HBO Max: $85 MXN\n• Apple TV+: $75 MXN\n• Paramount+: $70 MXN\n• Prime Video: $70 MXN\n• Crunchyroll: $65 MXN\n• Spotify: $55 MXN\n• ViX: $35 MXN\n• Fox One: $80 MXN\n*(Nota: Netflix y Universal+ aún no tienen precio confirmado en cuentas completas).* ¿Cuál te gustaría activar hoy por WhatsApp?`;
  }

  if (q.includes('combo') || q.includes('promo') || q.includes('paquete')) {
    const combos = catalog.combos.filter((c) => c.inStock);
    if (combos.length > 0) {
      const list = combos.map((c) => `• ${c.name}: $${c.price} MXN (Incluye: ${c.platforms.join(' + ')})`).join('\n');
      return `«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?»\n\nContamos con estas promociones oficiales configuradas por la administración:\n${list}\n\nTodos nuestros servicios incluyen 25 días de soporte garantizado y entrega de 5 minutos a 1 hora. ¿Te gustaría contratar alguno por WhatsApp?`;
    }
    return `«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?»\n\nNuestras promociones y combos especiales están siendo actualizados por la administración de Brisa Premium. Puedes consultar promociones vigentes o armar un paquete personalizado directamente en nuestro WhatsApp oficial: +52 9831826892. Todas las cuentas cuentan con 25 días de soporte garantizado y entrega de 5 minutos a 1 hora.`;
  }

  if (q.includes('netflix') && (q.includes('completa') || q.includes('porque') || q.includes('por qué') || q.includes('hogar'))) {
    return `«¡Hola! Soy Lunaria AI.» 🎬\n\nEn **BRISA PREMIUM** Netflix no se maneja en cuenta completa **porque se maneja en modalidad privada de un perfil**.\n\n✨ Te entregamos un **Perfil Privado con PIN exclusivo** para 1 dispositivo a solo **$88 MXN al mes**, con calidad 4K Ultra HD, descargas offline y **25 días de soporte garantizado**. Es una opción personal, privada y súper económica.\n\n¿Te gustaría solicitar tu perfil de Netflix por WhatsApp (+52 9831826892)?`;
  }

  if (q.includes('netflix')) {
    return `«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?»\n\nEn Netflix manejamos la modalidad **privada de un perfil** con PIN personal a solo **$88 MXN al mes**. Incluye calidad 4K Ultra HD, descargas offline y 25 días de soporte garantizado. No está en cuenta completa porque se maneja exclusivamente como perfil privado. ¿Deseas solicitar tu acceso por WhatsApp?`;
  }

  if (q.includes('disney')) {
    return `«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?»\n\nPara Disney+ tenemos dos opciones con 25 días de soporte:\n• Perfil (1 dispositivo con ESPN): $40 MXN al mes\n• Cuenta Completa (hogar multidispositivo con ESPN): $95 MXN al mes\n\n¿Cuál de las dos opciones se adapta mejor a tu necesidad?`;
  }

  if (q.includes('falla') || q.includes('fallar') || q.includes('caer') || q.includes('cae') || q.includes('reposicion') || q.includes('reposición') || q.includes('problema') || q.includes('bloqueo') || q.includes('sirve')) {
    return `«¡Hola! Soy Lunaria AI.» 🌸\n\nSí, como en cualquier servicio digital de streaming, una cuenta o perfil **sí puede llegar a fallar** debido a actualizaciones y ajustes de las plataformas.\n\n🛡️ **Por esa misma razón te damos 25 DÍAS DE GARANTÍA Y SOPORTE**:\n• En caso de fallo dentro de tu garantía, se te brinda una **reposición de correo en un lapso de 1 a 3 días hábiles**.\n• Solo debes escribirnos a nuestro WhatsApp oficial (**+52 983 182 6892**) con tus datos para atender tu reposición de inmediato.\n\n¿Deseas consultar información o contratar algún servicio?`;
  }

  if (q.includes('garantia') || q.includes('garantía') || q.includes('soporte') || q.includes('seguridad')) {
    return `¡En Brisa Premium cuentas con **25 DÍAS DE SOPORTE GARANTIZADO**! 🛡️\n\n• **¿La cuenta puede fallar?** Sí, puede fallar por cambios de las plataformas; por eso cuentas con garantía oficial de 25 días.\n• **Reposición de correo:** Si presenta fallo durante tus 25 días, se da una reposición de correo en un lapso de **1 a 3 días**.\n• **Tiempo de entrega inicial:** De 5 minutos a 1 hora tras confirmar tu comprobante por WhatsApp.\n• **WhatsApp Oficial:** +52 9831826892.`;
  }

  return `«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?»\n\nPuedo orientarte con precios de Perfiles (desde $30 MXN), Cuentas Completas (desde $35 MXN), Combos y promociones de Brisa Premium. ¿Qué servicio te gustaría disfrutar?`;
}
