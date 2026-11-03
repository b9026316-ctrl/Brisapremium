import * as THREE from 'three';
import {
  BRAND_INFO,
  PROFILES_CATALOG,
  FULL_ACCOUNTS_CATALOG,
  INITIAL_COMBOS,
  FAQS,
  CatalogPlan,
  CatalogCombo,
  getWhatsAppOrderLink,
  getWhatsAppComboLink,
  getWhatsAppGeneralLink,
} from './data/catalog.ts';

/* ==========================================================================
   1. 3D DIGITAL STREAMING HUB SHOWCASE (Three.js)
   ========================================================================== */
class DigitalStreaming3DShowcase {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private carouselGroup: THREE.Group;
  private cards: THREE.Mesh[] = [];
  private particles?: THREE.Points;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private targetRotationY = 0;
  private animId: number = 0;

  constructor(canvasId: string) {
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) throw new Error(`Canvas with id "${canvasId}" not found.`);
    this.canvas = el;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();

    const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(0, 0.2, 3.4);

    this.carouselGroup = new THREE.Group();
    this.scene.add(this.carouselGroup);

    this.setupLights();
    this.buildStreamingCards();
    this.buildAmbientParticles();
    this.setupEvents();
    this.handleResize();
    this.animate(0);
  }

  private setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xfff5f7, 0xdec6cb, 2.4);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3, 4, 4);
    this.scene.add(keyLight);

    const softFillLight = new THREE.DirectionalLight(0xfad2e1, 1.8);
    softFillLight.position.set(-3, -1, 2);
    this.scene.add(softFillLight);

    const rimLight = new THREE.DirectionalLight(0xc97d86, 2.0);
    rimLight.position.set(0, 3, -3);
    this.scene.add(rimLight);
  }

  private createCardCanvas(title: string, subtitle: string, brandColor: string): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 720;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(10, 10, 492, 700, 32);
      ctx.fill();

      ctx.fillStyle = brandColor;
      ctx.beginPath();
      ctx.roundRect(24, 24, 464, 380, 24);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(40, 40, 432, 10);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(235, 170);
      ctx.lineTo(295, 210);
      ctx.lineTo(235, 250);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#231618';
      ctx.font = 'bold 44px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 480);

      ctx.fillStyle = '#7d6165';
      ctx.font = '600 26px "Montserrat", sans-serif';
      ctx.fillText(subtitle, 256, 540);

      ctx.fillStyle = '#fcecee';
      ctx.beginPath();
      ctx.roundRect(130, 590, 252, 54, 27);
      ctx.fill();

      ctx.fillStyle = '#944a53';
      ctx.font = 'bold 22px "Montserrat", sans-serif';
      ctx.fillText('BRISA PREMIUM', 256, 626);
    }

    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildStreamingCards() {
    const cardData = [
      { title: 'NETFLIX', subtitle: 'Perfil $88 MXN', color: '#e50914' },
      { title: 'DISNEY+', subtitle: 'Perfil $40 | Completa $95', color: '#113ccf' },
      { title: 'HBO MAX', subtitle: 'Perfil $37 | Completa $85', color: '#002be7' },
      { title: 'SPOTIFY', subtitle: 'Perfil / Completa $55', color: '#1db954' },
      { title: 'CRUNCHYROLL', subtitle: 'Perfil $30 | Completa $65', color: '#f47521' },
      { title: 'PRIME VIDEO', subtitle: 'Perfil $35 | Completa $70', color: '#00a8e1' },
    ];

    const radius = 1.35;
    const cardGeom = new THREE.PlaneGeometry(0.85, 1.2);

    cardData.forEach((item, i) => {
      const angle = (i / cardData.length) * Math.PI * 2;
      const texture = this.createCardCanvas(item.title, item.subtitle, item.color);

      const mat = new THREE.MeshPhysicalMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      });

      const mesh = new THREE.Mesh(cardGeom, mat);
      mesh.position.x = Math.sin(angle) * radius;
      mesh.position.z = Math.cos(angle) * radius;
      mesh.rotation.y = angle;

      this.cards.push(mesh);
      this.carouselGroup.add(mesh);
    });

    const centerGeom = new THREE.OctahedronGeometry(0.24, 0);
    const centerMat = new THREE.MeshPhysicalMaterial({
      color: 0xfad2e1,
      emissive: 0xc97d86,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.5,
    });
    const centerMesh = new THREE.Mesh(centerGeom, centerMat);
    this.carouselGroup.add(centerMesh);
  }

  private buildAmbientParticles() {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const baseColor = new THREE.Color(0xfad2e1);
    const accentColor = new THREE.Color(0xc97d86);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.8 + Math.random() * 1.0;
      const y = (Math.random() - 0.5) * 1.8;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      const c = Math.random() > 0.5 ? baseColor : accentColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.carouselGroup.add(this.particles);
  }

  private setupEvents() {
    const onStart = (clientX: number, clientY: number) => {
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onMove = (clientX: number, clientY: number) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.previousMousePosition.x;
      this.targetRotationY += deltaX * 0.008;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 0) onStart(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );
    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length > 0) onMove(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );
    window.addEventListener('touchend', onEnd);
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = (time: number) => {
    this.animId = requestAnimationFrame(this.animate);
    const seconds = time * 0.001;

    if (!this.isDragging) {
      this.targetRotationY += 0.005;
    }

    this.carouselGroup.rotation.y += (this.targetRotationY - this.carouselGroup.rotation.y) * 0.08;
    this.carouselGroup.position.y = Math.sin(seconds * 1.5) * 0.04;

    this.cards.forEach((card, i) => {
      card.position.y = Math.sin(seconds * 2 + i) * 0.03;
    });

    if (this.particles) {
      this.particles.rotation.y = seconds * 0.2;
    }

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
  }
}

/* ==========================================================================
   2. APPLICATION STATE & PERSISTENT DATA
   ========================================================================== */
interface UserSession {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'client';
  status: 'pending' | 'active' | 'blocked';
}

let activeCatalog = {
  profiles: [...PROFILES_CATALOG],
  fullAccounts: [...FULL_ACCOUNTS_CATALOG],
  combos: [...INITIAL_COMBOS],
};

let currentCatalogMode: 'profiles' | 'full' | 'combos' = 'profiles';
let currentCategoryFilter = 'all';
let currentUser: UserSession | null = null;
let authToken: string | null = localStorage.getItem('brisa_token');

/* ==========================================================================
   3. CATALOG DATA LOADER (From live Database via API)
   ========================================================================== */
async function fetchCatalogFromDatabase() {
  try {
    const res = await fetch('/api/catalog');
    if (res.ok) {
      const data = await res.json();
      if (data.profiles && data.fullAccounts && data.combos) {
        activeCatalog = data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch catalog from DB, using bundled catalog:', err);
  }
  renderActiveCatalog();
  renderCombosSection();
}

function renderActiveCatalog() {
  const container = document.getElementById('productsGrid');
  const titleEl = document.getElementById('catalogMainTitle');
  const subtitleEl = document.getElementById('catalogSubtitle');
  const fullNotice = document.getElementById('fullAccountsNotice');
  const catFilterContainer = document.getElementById('categoryFilterContainer');

  if (!container) return;

  if (currentCatalogMode === 'combos') {
    if (titleEl) titleEl.textContent = 'Combos & Promociones Especiales';
    if (subtitleEl) subtitleEl.textContent = 'Paquetes de múltiples plataformas combinadas con descuento mensual.';
    if (fullNotice) fullNotice.style.display = 'none';
    if (catFilterContainer) catFilterContainer.style.display = 'none';
    renderCombosInCatalog(container);
    return;
  }

  if (catFilterContainer) catFilterContainer.style.display = 'flex';

  if (currentCatalogMode === 'profiles') {
    if (titleEl) titleEl.textContent = 'Catálogo de Perfiles (1 Dispositivo)';
    if (subtitleEl) subtitleEl.textContent = 'Disfruta de tu plataforma favorita en tu Smart TV o celular con perfil privado y PIN exclusivo.';
    if (fullNotice) fullNotice.style.display = 'none';

    const list = activeCatalog.profiles.filter(
      (p) => currentCategoryFilter === 'all' || p.category === currentCategoryFilter
    );
    renderPlanCards(container, list, 'Perfil (1 Dispositivo)');
  } else {
    if (titleEl) titleEl.textContent = 'Catálogo de Cuentas Completas (Hogar)';
    if (subtitleEl) subtitleEl.textContent = 'Cuentas completas con control total y pantallas simultáneas para toda la familia.';
    if (fullNotice) fullNotice.style.display = 'block';

    const list = activeCatalog.fullAccounts.filter(
      (p) => currentCategoryFilter === 'all' || p.category === currentCategoryFilter
    );
    renderPlanCards(container, list, 'Cuenta Completa');
  }
}

function renderPlanCards(container: HTMLElement, items: CatalogPlan[], typeLabel: string) {
  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--color-text-muted);">
        No hay plataformas disponibles en esta categoría actualmente.
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map((plan) => {
      const oldPriceHtml = plan.originalPrice
        ? `<span style="font-size: 0.88rem; color: #a48c90; text-decoration: line-through; margin-right: 6px;">$${plan.originalPrice}</span>`
        : '';

      const badgeHtml = plan.badge
        ? `<div style="position: absolute; top: 12px; left: 12px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border: 1px solid var(--color-rose-border); color: var(--color-rose-deep); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 9999px; z-index: 2;">${plan.badge}</div>`
        : '';

      const qualityBadgeHtml = `
        <div style="position: absolute; top: 12px; right: 12px; background: rgba(35, 22, 24, 0.85); backdrop-filter: blur(8px); color: #ffffff; font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; z-index: 2;">
          ${plan.quality}
        </div>
      `;

      const whatsappBuyUrl = getWhatsAppOrderLink(plan.name, plan.price, typeLabel);

      return `
        <div class="platform-card animate-fade-in" data-plan-id="${plan.id}" data-plan-type="${plan.type}">
          <div class="platform-img-wrapper">
            ${badgeHtml}
            ${qualityBadgeHtml}
            <img src="${plan.logoUrl}" alt="${plan.name}" loading="lazy" />
          </div>
          <div style="padding: 22px; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; gap: 16px;">
            <div>
              <div style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-rose-primary); margin-bottom: 4px;">
                ${plan.categoryLabel} · <span style="color: var(--color-rose-deep);">${typeLabel}</span>
              </div>
              <h3 style="font-size: 1.35rem; font-weight: 700; line-height: 1.25; margin-bottom: 6px; color: var(--color-text-title);">
                ${plan.name}
              </h3>
              <p style="font-size: 0.88rem; color: var(--color-text-muted); line-height: 1.5; margin-bottom: 12px;">
                ${plan.tagline}
              </p>

              <div style="background: var(--color-rose-subtle); padding: 10px 14px; border-radius: 12px; border: 1px solid var(--color-rose-border); font-size: 0.82rem; color: var(--color-text-body); display: flex; flex-direction: column; gap: 4px;">
                <div>✨ <strong>Acceso:</strong> ${plan.devices}</div>
                <div>🛡️ <strong>Garantía:</strong> 25 días de soporte continuo</div>
              </div>
            </div>

            <div>
              <div style="display: flex; align-items: baseline; margin-bottom: 14px;">
                ${oldPriceHtml}
                <span style="font-family: var(--font-serif); font-size: 1.55rem; font-weight: 700; color: var(--color-text-title);">
                  $${plan.price} MXN
                </span>
                <span style="font-size: 0.82rem; color: var(--color-text-muted); margin-left: 6px;">/ mes</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px;">
                <a href="${whatsappBuyUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp order-whatsapp-track" data-plan-name="${plan.name}" data-plan-price="${plan.price}" data-plan-type="${typeLabel}" style="width: 100%; font-size: 0.9rem; padding: 11px 16px;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 2C6.494 2 2 6.494 2 12.031c0 1.996.586 3.86 1.6 5.432L2 22l4.678-1.554c1.517.926 3.284 1.458 5.174 1.458 5.537 0 10.031-4.494 10.031-10.031S17.568 2 12.031 2zm5.789 14.286c-.244.686-1.218 1.258-1.706 1.319-.488.06-1.077.108-3.414-.827-2.731-1.092-4.484-3.844-4.62-4.025-.136-.182-1.1-1.465-1.1-2.793 0-1.328.694-1.982.94-2.247.245-.264.536-.33.714-.33.178 0 .356 0 .513.01.168.01.393-.064.615.47.227.548.777 1.897.844 2.035.068.137.113.3.023.48-.09.182-.136.296-.27.456-.137.161-.287.359-.41.482-.137.137-.28.286-.12.56.16.274.71 1.173 1.524 1.898 1.047.933 1.93 1.222 2.203 1.359.274.137.433.114.593-.069.16-.183.685-.798.868-1.072.183-.274.366-.228.616-.137.251.091 1.597.753 1.872.89.274.137.457.206.525.32.069.115.069.664-.175 1.35z"/></svg>
                  <span>Pedir por WhatsApp</span>
                </a>

                <div style="display: flex; gap: 8px;">
                  <button class="btn-secondary view-details-btn" data-plan-id="${plan.id}" data-plan-type="${plan.type}" style="flex: 1; font-size: 0.84rem; padding: 8px 12px;">
                    Ver Detalles
                  </button>
                  <button class="btn-lunaria ask-lunaria-plan-btn" data-plan-name="${plan.name}" data-plan-type="${typeLabel}" style="font-size: 0.84rem; padding: 8px 14px;" title="Preguntar a Lunaria AI">
                    ✨ Preguntar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  attachPlanEvents();
}

function renderCombosInCatalog(container: HTMLElement) {
  if (activeCatalog.combos.length === 0) {
    const isAdmin = currentUser?.role === 'admin';
    container.innerHTML = `
      <div style="grid-column: 1 / -1; background: #ffffff; border: 1px solid var(--color-rose-border); border-radius: 24px; padding: 48px 32px; text-align: center; max-width: 780px; margin: 0 auto; box-shadow: 0 8px 30px rgba(201, 125, 134, 0.08);" class="animate-fade-in">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--color-rose-subtle); border: 1px solid var(--color-rose-border); display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 18px;">
          🎁
        </div>
        <h3 style="font-size: 1.55rem; color: var(--color-text-title); margin-bottom: 12px; font-weight: 700; font-family: var(--font-serif);">
          Promociones & Combos Especiales
        </h3>
        <p style="font-size: 1rem; color: var(--color-text-body); line-height: 1.7; max-width: 580px; margin: 0 auto 24px;">
          Nuestros combos y promociones con descuento están siendo preparados y configurados por la administración de Brisa Premium. Si deseas consultar promociones vigentes o armar un paquete personalizado con descuento, ¡escríbenos directamente a nuestro WhatsApp oficial!
        </p>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 14px;">
          <a href="https://wa.me/529831826892?text=¡Hola%20Brisa%20Premium!%20✨%20Quiero%20consultar%20combos%20y%20promociones%20especiales%20vigentes." target="_blank" rel="noopener noreferrer" class="btn-whatsapp" style="padding: 13px 26px;">
            Consultar Promociones por WhatsApp (+52 9831826892)
          </a>
          ${
            isAdmin
              ? `<button id="btnCreateComboTrigger" class="btn-primary" style="padding: 13px 26px;">
                   + Configurar Nuevo Combo
                 </button>`
              : ''
          }
        </div>
      </div>
    `;

    document.getElementById('btnCreateComboTrigger')?.addEventListener('click', () => {
      openAdminDashboard();
      const tabCombos = document.getElementById('adminTabCombosBtn');
      tabCombos?.click();
    });
    return;
  }

  container.innerHTML = activeCatalog.combos
    .map((combo) => {
      const whatsappUrl = getWhatsAppComboLink(combo.name, combo.price);

      return `
        <div class="combo-card animate-fade-in" style="grid-column: span 1;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="background: var(--color-pastel-pink); color: #5a212e; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 9999px;">
                ${combo.badge}
              </span>
              <span style="background: #eafaf1; color: #1e824c; font-size: 0.78rem; font-weight: 700; padding: 3px 10px; border-radius: 9999px; border: 1px solid #b8e2cd;">
                ${combo.savings}
              </span>
            </div>

            <h3 style="font-size: 1.38rem; font-weight: 700; margin-bottom: 10px; color: var(--color-text-title); line-height: 1.3;">
              ${combo.name}
            </h3>

            <p style="font-size: 0.92rem; color: var(--color-text-body); line-height: 1.6; margin-bottom: 16px;">
              ${combo.description}
            </p>

            <div style="background: var(--color-rose-subtle); padding: 12px 16px; border-radius: 14px; border: 1px solid var(--color-rose-border); margin-bottom: 16px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-rose-deep); text-transform: uppercase; margin-bottom: 6px;">
                Plataformas Incluidas:
              </div>
              <div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.88rem; font-weight: 600; color: var(--color-text-title);">
                ${combo.platforms.map((p) => `<div>✓ ${p}</div>`).join('')}
              </div>
            </div>
          </div>

          <div>
            <div style="display: flex; align-items: baseline; margin-bottom: 14px;">
              <span style="font-size: 0.95rem; color: #a48c90; text-decoration: line-through; margin-right: 8px;">
                $${combo.originalPrice} MXN
              </span>
              <span style="font-family: var(--font-serif); font-size: 1.7rem; font-weight: 700; color: var(--color-text-title);">
                $${combo.price} MXN
              </span>
              <span style="font-size: 0.85rem; color: var(--color-text-muted); margin-left: 6px;">/ mes</span>
            </div>

            <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" style="width: 100%; text-align: center; font-size: 0.92rem; padding: 12px 18px;">
              Aprovechar Combo por WhatsApp
            </a>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderCombosSection() {
  const container = document.getElementById('combosGrid');
  if (container) {
    renderCombosInCatalog(container);
  }
}

function attachPlanEvents() {
  document.querySelectorAll('.view-details-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const planId = target.getAttribute('data-plan-id');
      const planType = target.getAttribute('data-plan-type') as 'profile' | 'full';
      if (planId && planType) openPlanModal(planId, planType);
    });
  });

  document.querySelectorAll('.ask-lunaria-plan-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const planName = target.getAttribute('data-plan-name');
      const planType = target.getAttribute('data-plan-type');
      if (planName) {
        openChatDrawer();
        sendUserMessageToLunaria(`¿Qué precio tiene "${planName}" en modalidad ${planType} y cómo es la activación?`);
      }
    });
  });

  // Track orders
  document.querySelectorAll('.order-whatsapp-track').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const name = target.getAttribute('data-plan-name');
      const price = target.getAttribute('data-plan-price');
      const type = target.getAttribute('data-plan-type');

      if (name && price) {
        try {
          await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: currentUser?.username || 'Cliente Web',
              customerPhone: currentUser?.phone || '+529831826892',
              customerEmail: currentUser?.email,
              itemType: type?.includes('Perfil') ? 'profile' : 'full',
              itemName: `${name} (${type})`,
              price: Number(price),
            }),
          });
        } catch (err) {
          // non-blocking
        }
      }
    });
  });
}

function openPlanModal(planId: string, planType: 'profile' | 'full') {
  const list = planType === 'profile' ? activeCatalog.profiles : activeCatalog.fullAccounts;
  const plan = list.find((p) => p.id === planId);
  if (!plan) return;

  const modal = document.getElementById('productDetailModal');
  const content = document.getElementById('productDetailContent');
  if (!modal || !content) return;

  const typeText = planType === 'profile' ? 'Perfil (1 Dispositivo)' : 'Cuenta Completa';
  const whatsappUrl = getWhatsAppOrderLink(plan.name, plan.price, typeText);

  content.innerHTML = `
    <button id="closeProductModalBtn" style="position: absolute; top: 18px; right: 20px; background: transparent; border: none; font-size: 1.5rem; color: var(--color-text-muted); cursor: pointer; padding: 4px;">✕</button>

    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="width: 100%; height: 220px; border-radius: 18px; overflow: hidden; background: #fbf2f3; position: relative;">
        <img src="${plan.logoUrl}" alt="${plan.name}" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; bottom: 12px; left: 14px; background: rgba(35, 22, 24, 0.88); backdrop-filter: blur(8px); color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 0.78rem; font-weight: 700;">
          ${plan.quality}
        </div>
      </div>

      <div>
        <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-rose-primary); margin-bottom: 4px;">
          ${plan.categoryLabel} · <span style="color: var(--color-rose-deep);">${typeText}</span>
        </div>
        <h2 style="font-size: 1.7rem; color: var(--color-text-title); line-height: 1.25; margin-bottom: 6px;">
          ${plan.name}
        </h2>
        <div style="font-family: var(--font-serif); font-size: 1.75rem; font-weight: 700; color: var(--color-text-title); margin-bottom: 12px;">
          $${plan.price} MXN <span style="font-size: 0.95rem; font-family: var(--font-sans); color: var(--color-text-muted); font-weight: 500;">/ mes</span>
        </div>
        <p style="font-size: 0.96rem; color: var(--color-text-body); line-height: 1.65; margin-bottom: 16px;">
          ${plan.description}
        </p>
      </div>

      <div style="background: var(--color-rose-card); padding: 18px; border-radius: 18px; border: 1px solid var(--color-rose-border);">
        <div style="font-weight: 700; font-size: 0.94rem; color: var(--color-text-title); margin-bottom: 10px;">
          Detalles de Entrega & Garantía:
        </div>
        <ul style="padding-left: 20px; font-size: 0.9rem; color: var(--color-text-body); display: flex; flex-direction: column; gap: 6px;">
          ${plan.features.map((f) => `<li>${f}</li>`).join('')}
          <li><strong>Dispositivos:</strong> ${plan.devices}</li>
          <li><strong>Garantía Oficial:</strong> 25 días con soporte y reposición directa</li>
          <li><strong>Tiempo de Entrega:</strong> De 5 minutos a 1 hora tras confirmar pago</li>
        </ul>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px;">
        <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" style="flex: 1; padding: 14px 22px; text-align: center; font-size: 0.95rem;">
          Contratar por WhatsApp (+52 9831826892)
        </a>
        <button id="modalAskLunariaBtn" class="btn-lunaria" style="padding: 14px 22px;">
          ✨ Preguntar a Lunaria
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');

  document.getElementById('closeProductModalBtn')?.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  document.getElementById('modalAskLunariaBtn')?.addEventListener('click', () => {
    modal.classList.remove('open');
    openChatDrawer();
    sendUserMessageToLunaria(`¿Cómo es el proceso para contratar "${plan.name}" en modalidad ${typeText}?`);
  });

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('open');
  };
}

/* ==========================================================================
   4. USER AUTHENTICATION & SESSION CONTROLLER
   ========================================================================== */
async function checkAuthStatus() {
  if (!authToken) {
    renderUserHeaderSession(null);
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      renderUserHeaderSession(currentUser);
    } else {
      localStorage.removeItem('brisa_token');
      authToken = null;
      currentUser = null;
      renderUserHeaderSession(null);
    }
  } catch (err) {
    renderUserHeaderSession(null);
  }
}

function renderUserHeaderSession(user: UserSession | null) {
  const container = document.getElementById('userHeaderSession');
  const mobileContainer = document.getElementById('mobileAuthRow');

  if (!container) return;

  if (!user) {
    container.innerHTML = `
      <button id="headerOpenLoginBtn" class="btn-secondary" style="padding: 8px 16px; font-size: 0.86rem;">
        Iniciar Sesión
      </button>
    `;
    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <button id="mobileOpenLoginBtn" class="btn-secondary" style="width: 100%; padding: 10px; font-size: 0.9rem;">
          Iniciar Sesión / Registrarse
        </button>
      `;
      document.getElementById('mobileOpenLoginBtn')?.addEventListener('click', () => {
        openAuthModal('login');
        const m = document.getElementById('mobileMenu');
        if (m) m.style.display = 'none';
      });
    }

    document.getElementById('headerOpenLoginBtn')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  // If Logged In
  const isAdmin = user.role === 'admin';
  const roleBadge = isAdmin ? '👑 Admin' : '👤 Cliente';

  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      ${isAdmin ? `<button id="headerAdminPanelBtn" class="btn-primary" style="padding: 8px 14px; font-size: 0.84rem; background: linear-gradient(135deg, #944a53 0%, #c97d86 100%);">⚙️ Panel Admin</button>` : ''}
      <div style="background: var(--color-rose-subtle); border: 1px solid var(--color-rose-border); padding: 6px 12px; border-radius: 9999px; font-size: 0.82rem; font-weight: 700; color: var(--color-text-title);">
        ${roleBadge}: ${user.username}
      </div>
      <button id="headerLogoutBtn" style="background: transparent; border: none; font-size: 0.82rem; color: var(--color-rose-deep); font-weight: 600; cursor: pointer; text-decoration: underline;">
        Salir
      </button>
    </div>
  `;

  if (mobileContainer) {
    mobileContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; font-size: 0.9rem; color: var(--color-text-title);">${roleBadge}: ${user.username}</span>
        ${isAdmin ? `<button id="mobileAdminPanelBtn" class="btn-primary" style="font-size: 0.8rem; padding: 6px 12px;">Panel Admin</button>` : ''}
        <button id="mobileLogoutBtn" style="background: transparent; border: none; font-size: 0.85rem; color: var(--color-rose-deep); text-decoration: underline; cursor: pointer;">Salir</button>
      </div>
    `;

    document.getElementById('mobileAdminPanelBtn')?.addEventListener('click', () => {
      openAdminDashboard();
      const m = document.getElementById('mobileMenu');
      if (m) m.style.display = 'none';
    });

    document.getElementById('mobileLogoutBtn')?.addEventListener('click', logout);
  }

  document.getElementById('headerAdminPanelBtn')?.addEventListener('click', openAdminDashboard);
  document.getElementById('headerLogoutBtn')?.addEventListener('click', logout);
}

function logout() {
  localStorage.removeItem('brisa_token');
  authToken = null;
  currentUser = null;
  renderUserHeaderSession(null);
  window.location.reload();
}

function openAuthModal(tab: 'login' | 'register' | 'forgot' = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('open');
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('open');
}

function switchAuthTab(tab: 'login' | 'register' | 'forgot') {
  const loginForm = document.getElementById('loginForm');
  const regForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');
  const tabLogin = document.getElementById('authTabLoginBtn');
  const tabReg = document.getElementById('authTabRegisterBtn');
  const tabForgot = document.getElementById('authTabForgotBtn');
  const alertEl = document.getElementById('authAlert');

  if (alertEl) alertEl.style.display = 'none';

  [tabLogin, tabReg, tabForgot].forEach((btn) => {
    if (btn) {
      btn.style.color = 'var(--color-text-muted)';
      btn.style.borderBottom = 'none';
      btn.style.fontWeight = '600';
    }
  });

  if (tab === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (regForm) regForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
    if (tabLogin) {
      tabLogin.style.color = 'var(--color-rose-deep)';
      tabLogin.style.borderBottom = '2px solid var(--color-rose-primary)';
      tabLogin.style.fontWeight = '700';
    }
  } else if (tab === 'register') {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'block';
    if (forgotForm) forgotForm.style.display = 'none';
    if (tabReg) {
      tabReg.style.color = 'var(--color-rose-deep)';
      tabReg.style.borderBottom = '2px solid var(--color-rose-primary)';
      tabReg.style.fontWeight = '700';
    }
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'block';
    if (tabForgot) {
      tabForgot.style.color = 'var(--color-rose-deep)';
      tabForgot.style.borderBottom = '2px solid var(--color-rose-primary)';
      tabForgot.style.fontWeight = '700';
    }
  }
}

function showAuthAlert(message: string, isError: boolean = true) {
  const alertEl = document.getElementById('authAlert');
  if (!alertEl) return;
  alertEl.style.display = 'block';
  alertEl.style.backgroundColor = isError ? '#fee2e2' : '#d1fae5';
  alertEl.style.color = isError ? '#991b1b' : '#065f46';
  alertEl.style.border = `1px solid ${isError ? '#fecaca' : '#a7f3d0'}`;
  alertEl.textContent = message;
}

function setupAuthForms() {
  document.getElementById('authTabLoginBtn')?.addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('authTabRegisterBtn')?.addEventListener('click', () => switchAuthTab('register'));
  document.getElementById('authTabForgotBtn')?.addEventListener('click', () => switchAuthTab('forgot'));
  document.getElementById('closeAuthModalBtn')?.addEventListener('click', closeAuthModal);

  // 1. Submit Login
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = (document.getElementById('loginIdentifier') as HTMLInputElement).value;
    const password = (document.getElementById('loginPassword') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAuthAlert(data.error || 'Credenciales inválidas.');
        return;
      }

      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('brisa_token', data.token);
      renderUserHeaderSession(currentUser);
      closeAuthModal();

      if (currentUser?.role === 'admin') {
        openAdminDashboard();
      } else {
        alert(`¡Bienvenida(o), ${currentUser?.username}! Sesión iniciada con éxito.`);
      }
    } catch (err: any) {
      showAuthAlert('Error al conectar con el servidor.');
    }
  });

  // 2. Submit Register
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('regUsername') as HTMLInputElement).value;
    const email = (document.getElementById('regEmail') as HTMLInputElement).value;
    const phone = (document.getElementById('regPhone') as HTMLInputElement).value;
    const password = (document.getElementById('regPassword') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAuthAlert(data.message || 'Error en el registro.');
        return;
      }
      showAuthAlert(data.message, false);
      (document.getElementById('registerForm') as HTMLFormElement).reset();
    } catch (err) {
      showAuthAlert('No se pudo procesar el registro.');
    }
  });

  // 3. Request Reset PIN
  document.getElementById('btnRequestPin')?.addEventListener('click', async () => {
    const identifier = (document.getElementById('forgotIdentifier') as HTMLInputElement).value;
    if (!identifier) {
      showAuthAlert('Por favor escribe tu usuario o correo.');
      return;
    }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAuthAlert(data.error || data.message || 'No se encontró la cuenta.');
        return;
      }
      showAuthAlert(data.message, false);
      const resetFields = document.getElementById('resetFieldsContainer');
      if (resetFields) resetFields.style.display = 'block';
    } catch (err) {
      showAuthAlert('Error al generar PIN.');
    }
  });

  // 4. Submit Reset Password
  document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('forgotIdentifier') as HTMLInputElement).value;
    const pin = (document.getElementById('resetPin') as HTMLInputElement).value;
    const newPassword = (document.getElementById('resetNewPassword') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showAuthAlert(data.error || data.message || 'Error al restablecer.');
        return;
      }
      showAuthAlert(data.message, false);
      setTimeout(() => switchAuthTab('login'), 2000);
    } catch (err) {
      showAuthAlert('Error al restablecer contraseña.');
    }
  });
}

/* ==========================================================================
   5. ADMIN DASHBOARD (Exclusive for Owner / Admin)
   ========================================================================== */
async function openAdminDashboard() {
  const modal = document.getElementById('adminModal');
  if (!modal) return;
  modal.classList.add('open');
  await loadAdminData();
}

function closeAdminDashboard() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.classList.remove('open');
}

async function loadAdminData() {
  if (!authToken) return;
  try {
    const res = await fetch('/api/admin/data', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) {
      alert('Sesión no autorizada como Administradora.');
      closeAdminDashboard();
      return;
    }
    const data = await res.json();
    renderAdminUsers(data.users || []);
    renderAdminCatalog(data.profiles || [], data.fullAccounts || []);
    renderAdminCombos(data.combos || []);
    renderAdminOrders(data.orders || []);
  } catch (err) {
    console.error('Error loading admin data:', err);
  }
}

function showAdminAlert(msg: string, isError: boolean = false) {
  const el = document.getElementById('adminAlert');
  if (!el) return;
  el.style.display = 'block';
  el.style.backgroundColor = isError ? '#fee2e2' : '#d1fae5';
  el.style.color = isError ? '#991b1b' : '#065f46';
  el.style.border = `1px solid ${isError ? '#fecaca' : '#a7f3d0'}`;
  el.textContent = msg;
  setTimeout(() => {
    el.style.display = 'none';
  }, 4000);
}

function renderAdminUsers(users: any[]) {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  tbody.innerHTML = users
    .map((u) => {
      const isSuperAdmin = u.role === 'admin';
      let statusBadge = `<span class="badge-status badge-status-pending">Pendiente</span>`;
      if (u.status === 'active') statusBadge = `<span class="badge-status badge-status-active">Activo</span>`;
      if (u.status === 'blocked') statusBadge = `<span class="badge-status badge-status-blocked">Bloqueado</span>`;

      return `
        <tr>
          <td><strong>${u.username}</strong></td>
          <td>${u.email}</td>
          <td>${u.phone || 'N/A'}</td>
          <td>${u.role}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${
                u.status !== 'active'
                  ? `<button class="btn-primary admin-auth-btn" data-user-id="${u.id}" style="padding: 4px 10px; font-size: 0.76rem; background: #059669;">Autorizar</button>`
                  : ''
              }
              ${
                u.status !== 'blocked' && !isSuperAdmin
                  ? `<button class="btn-secondary admin-block-btn" data-user-id="${u.id}" style="padding: 4px 10px; font-size: 0.76rem; color: #dc2626; border-color: #fca5a5;">Bloquear</button>`
                  : ''
              }
              ${
                !isSuperAdmin
                  ? `<button class="btn-secondary admin-delete-btn" data-user-id="${u.id}" style="padding: 4px 10px; font-size: 0.76rem; color: #991b1b;">Eliminar</button>`
                  : '<span style="font-size: 0.76rem; color: var(--color-rose-deep);">Admin Principal</span>'
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  // Attach User Action Handlers
  document.querySelectorAll('.admin-auth-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-user-id');
      await updateUserStatus(id!, 'active');
    });
  });

  document.querySelectorAll('.admin-block-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-user-id');
      await updateUserStatus(id!, 'blocked');
    });
  });

  document.querySelectorAll('.admin-delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-user-id');
      if (confirm('¿Segura que deseas eliminar este cliente del sistema?')) {
        await deleteUser(id!);
      }
    });
  });
}

async function updateUserStatus(userId: string, status: string) {
  try {
    const res = await fetch('/api/admin/users/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId, status }),
    });
    if (res.ok) {
      showAdminAlert(`Estado de usuario actualizado a "${status}".`);
      await loadAdminData();
    }
  } catch (err) {
    showAdminAlert('Error al actualizar usuario.', true);
  }
}

async function deleteUser(userId: string) {
  try {
    const res = await fetch('/api/admin/users/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      showAdminAlert('Usuario eliminado con éxito.');
      await loadAdminData();
    }
  } catch (err) {
    showAdminAlert('Error al eliminar usuario.', true);
  }
}

function renderAdminCatalog(profiles: CatalogPlan[], fullAccounts: CatalogPlan[]) {
  const pBody = document.getElementById('adminProfilesTableBody');
  const fBody = document.getElementById('adminFullAccountsTableBody');

  const renderRows = (list: CatalogPlan[], type: 'profile' | 'full') => {
    return list
      .map((item) => {
        return `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span>$</span>
                <input type="number" class="admin-price-input" data-id="${item.id}" data-type="${type}" value="${item.price}" style="width: 80px; padding: 4px 8px; border-radius: 8px; border: 1px solid var(--color-rose-border); font-weight: 700;" />
                <span>MXN</span>
              </div>
            </td>
            <td>${item.quality}</td>
            <td>
              <span class="badge-status ${item.inStock ? 'badge-status-active' : 'badge-status-blocked'}">
                ${item.inStock ? 'Disponible' : 'Agotado'}
              </span>
            </td>
            <td>
              <button class="btn-secondary admin-save-price-btn" data-id="${item.id}" data-type="${type}" style="padding: 4px 10px; font-size: 0.78rem;">
                Guardar
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  };

  if (pBody) pBody.innerHTML = renderRows(profiles, 'profile');
  if (fBody) fBody.innerHTML = renderRows(fullAccounts, 'full');

  document.querySelectorAll('.admin-save-price-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const id = target.getAttribute('data-id');
      const type = target.getAttribute('data-type') as 'profile' | 'full';
      const input = document.querySelector(`.admin-price-input[data-id="${id}"][data-type="${type}"]`) as HTMLInputElement;

      if (id && input) {
        const newPrice = Number(input.value);
        await saveCatalogPrice(type, id, newPrice);
      }
    });
  });
}

async function saveCatalogPrice(type: 'profile' | 'full', id: string, newPrice: number) {
  try {
    const list = type === 'profile' ? activeCatalog.profiles : activeCatalog.fullAccounts;
    const item = list.find((i) => i.id === id);
    if (!item) return;

    item.price = newPrice;

    const res = await fetch('/api/admin/catalog/item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ type, item }),
    });

    if (res.ok) {
      showAdminAlert(`Precio de ${item.name} actualizado a $${newPrice} MXN con éxito.`);
      await fetchCatalogFromDatabase();
    }
  } catch (err) {
    showAdminAlert('Error al guardar precio.', true);
  }
}

function renderAdminCombos(combos: CatalogCombo[]) {
  const tbody = document.getElementById('adminCombosTableBody');
  if (!tbody) return;

  tbody.innerHTML = combos
    .map((c) => {
      return `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>$${c.price} MXN</td>
          <td>$${c.originalPrice} MXN</td>
          <td>${c.platforms.join(', ')}</td>
          <td>
            <button class="btn-secondary admin-del-combo-btn" data-combo-id="${c.id}" style="padding: 4px 10px; font-size: 0.78rem; color: #dc2626;">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    })
    .join('');

  document.querySelectorAll('.admin-del-combo-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-combo-id');
      if (confirm('¿Eliminar este combo?')) {
        try {
          await fetch('/api/admin/combos/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ comboId: id }),
          });
          showAdminAlert('Combo eliminado.');
          await fetchCatalogFromDatabase();
          await loadAdminData();
        } catch (err) {
          showAdminAlert('Error al eliminar combo.', true);
        }
      }
    });
  });
}

function renderAdminOrders(orders: any[]) {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted);">Aún no hay pedidos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map((o) => {
      return `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customerName}</td>
          <td><a href="https://wa.me/${o.customerPhone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #25d366; text-decoration: underline;">${o.customerPhone}</a></td>
          <td>${o.itemName}</td>
          <td><strong>$${o.price} MXN</strong></td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          <td>
            <span class="badge-status ${o.status === 'entregado' ? 'badge-status-active' : 'badge-status-pending'}">
              ${o.status}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');
}

function setupAdminTabs() {
  document.getElementById('closeAdminModalBtn')?.addEventListener('click', closeAdminDashboard);

  const tabUsers = document.getElementById('adminTabUsersBtn');
  const tabCatalog = document.getElementById('adminTabCatalogBtn');
  const tabCombos = document.getElementById('adminTabCombosBtn');
  const tabOrders = document.getElementById('adminTabOrdersBtn');

  const viewUsers = document.getElementById('adminViewUsers');
  const viewCatalog = document.getElementById('adminViewCatalog');
  const viewCombos = document.getElementById('adminViewCombos');
  const viewOrders = document.getElementById('adminViewOrders');

  const switchView = (activeTab: HTMLElement, activeView: HTMLElement) => {
    [tabUsers, tabCatalog, tabCombos, tabOrders].forEach((t) => t?.classList.remove('active'));
    [viewUsers, viewCatalog, viewCombos, viewOrders].forEach((v) => {
      if (v) v.style.display = 'none';
    });
    activeTab.classList.add('active');
    activeView.style.display = 'block';
  };

  tabUsers?.addEventListener('click', () => switchView(tabUsers, viewUsers!));
  tabCatalog?.addEventListener('click', () => switchView(tabCatalog, viewCatalog!));
  tabCombos?.addEventListener('click', () => switchView(tabCombos, viewCombos!));
  tabOrders?.addEventListener('click', () => switchView(tabOrders, viewOrders!));

  document.getElementById('adminCreateUserBtn')?.addEventListener('click', () => {
    const username = prompt('Nombre de usuario del nuevo cliente:');
    if (!username) return;
    const email = prompt('Correo del cliente:', `${username.toLowerCase()}@cliente.com`);
    const phone = prompt('Teléfono de WhatsApp:', '+52 983');
    const password = prompt('Contraseña temporal:', 'Cliente123!');

    if (username && email && password) {
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password }),
      }).then(() => {
        showAdminAlert(`Cliente "${username}" creado.`);
        loadAdminData();
      });
    }
  });

  document.getElementById('adminAddPlatformBtn')?.addEventListener('click', () => {
    const type = prompt('Tipo de catálogo: escribe "profile" (Perfil 1 dispositivo) o "full" (Cuenta completa):', 'profile');
    if (type !== 'profile' && type !== 'full') return;
    const name = prompt('Nombre de la plataforma (ej. Star+ o Mubi):');
    if (!name) return;
    const priceStr = prompt('Precio mensual en $ MXN:');
    if (!priceStr) return;

    const id = `${type === 'profile' ? 'p' : 'f'}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newItem: CatalogPlan = {
      id,
      type: type as 'profile' | 'full',
      typeLabel: type === 'profile' ? 'Perfil (1 Dispositivo)' : 'Cuenta Completa',
      name,
      category: 'peliculas_series',
      categoryLabel: 'Streaming',
      price: Number(priceStr),
      devices: type === 'profile' ? '1 Dispositivo' : 'Cuenta Completa Hogar',
      quality: '4K Ultra HD',
      tagline: 'Suscripción de alta calidad con garantía oficial de 25 días',
      description: `Acceso garantizado a ${name} con garantía de 25 días y soporte directo por WhatsApp.`,
      features: ['Entrega de 5 min a 1 hora', 'Sin cortes', 'Garantía 25 días'],
      logoUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
      accentColor: '#c97d86',
      inStock: true,
    };

    fetch('/api/admin/catalog/item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ type, item: newItem }),
    }).then(() => {
      showAdminAlert(`Plataforma ${name} agregada exitosamente.`);
      fetchCatalogFromDatabase();
      loadAdminData();
    });
  });

  document.getElementById('adminCreateComboBtn')?.addEventListener('click', () => {
    const name = prompt('Nombre del combo (ej. Combo Dúo Especial):');
    if (!name) return;
    const price = Number(prompt('Precio del combo en $ MXN:', '120'));
    const platformsStr = prompt('Plataformas incluidas separadas por coma:', 'Netflix, Disney+');

    const newCombo: CatalogCombo = {
      id: `combo-${Date.now()}`,
      name,
      price,
      originalPrice: price + 20,
      badge: 'Nuevo Combo',
      description: 'Disfruta de tus plataformas favoritas combinadas al mejor precio.',
      platforms: platformsStr ? platformsStr.split(',').map((s) => s.trim()) : [],
      savings: 'Ahorro mensual especial',
      inStock: true,
    };

    fetch('/api/admin/combos/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ combo: newCombo }),
    }).then(() => {
      showAdminAlert(`Combo "${name}" guardado.`);
      fetchCatalogFromDatabase();
      loadAdminData();
    });
  });
}

/* ==========================================================================
   6. LUNARIA AI CHATBOT CONTROLLER
   ========================================================================== */
interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

const chatHistory: ChatHistoryItem[] = [];
let isAwaitingResponse = false;

function openChatDrawer() {
  const drawer = document.getElementById('lunariaChatDrawer');
  if (drawer) {
    drawer.classList.add('open');
    const input = document.getElementById('chatInput') as HTMLInputElement;
    if (input) input.focus();
  }
}

function closeChatDrawer() {
  const drawer = document.getElementById('lunariaChatDrawer');
  if (drawer) drawer.classList.remove('open');
}

function appendMessage(role: 'user' | 'model', text: string, showWhatsAppShortcut = false) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role === 'user' ? 'bubble-user' : 'bubble-bot'} animate-fade-in`;

  const formattedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  bubble.innerHTML = formattedText;

  if (showWhatsAppShortcut && role === 'model') {
    const shortcutDiv = document.createElement('div');
    shortcutDiv.style.marginTop = '10px';
    shortcutDiv.style.paddingTop = '8px';
    shortcutDiv.style.borderTop = '1px solid rgba(237, 210, 213, 0.6)';
    shortcutDiv.innerHTML = `
      <a href="${getWhatsAppGeneralLink()}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" style="display: inline-flex; width: 100%; font-size: 0.82rem; padding: 8px 12px; justify-content: center;">
        📱 Contratar por WhatsApp (+52 9831826892)
      </a>
    `;
    bubble.appendChild(shortcutDiv);
  }

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator(): HTMLElement {
  const container = document.getElementById('chatMessages');
  const indicator = document.createElement('div');
  indicator.className = 'chat-bubble bubble-bot';
  indicator.id = 'lunariaTypingIndicator';
  indicator.style.display = 'flex';
  indicator.style.alignItems = 'center';
  indicator.style.gap = '6px';
  indicator.innerHTML = `
    <span style="font-size: 0.86rem; color: var(--color-rose-deep); font-weight: 600;">Lunaria AI está escribiendo...</span>
    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--color-rose-primary); animation: pulseGreen 1s infinite;"></span>
  `;
  if (container) {
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
  }
  return indicator;
}

async function sendUserMessageToLunaria(messageText: string) {
  if (isAwaitingResponse || !messageText.trim()) return;

  appendMessage('user', messageText);
  chatHistory.push({ role: 'user', text: messageText });

  isAwaitingResponse = true;
  const typingIndicator = appendTypingIndicator();

  try {
    const res = await fetch('/api/lunaria/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        history: chatHistory.slice(-8),
      }),
    });

    typingIndicator.remove();

    if (!res.ok) throw new Error(`Server status ${res.status}`);

    const data = await res.json();
    const reply = data.reply || '«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?» Con gusto te comparto precios y promociones.';

    const shouldShowWhatsApp =
      messageText.toLowerCase().includes('precio') ||
      messageText.toLowerCase().includes('contratar') ||
      messageText.toLowerCase().includes('comprar') ||
      messageText.toLowerCase().includes('combo') ||
      messageText.toLowerCase().includes('promo') ||
      messageText.toLowerCase().includes('whatsapp');

    appendMessage('model', reply, shouldShowWhatsApp);
    chatHistory.push({ role: 'model', text: reply });
  } catch (error) {
    console.error('Error in Lunaria chat:', error);
    typingIndicator.remove();
    appendMessage(
      'model',
      '«¡Hola! Soy Lunaria AI. ¿Qué plataforma estás buscando hoy?» Para darte atención y activar de inmediato, escríbenos directamente a nuestro WhatsApp oficial: +52 9831826892.',
      true
    );
  } finally {
    isAwaitingResponse = false;
  }
}

function setupLunariaChat() {
  const form = document.getElementById('chatForm') as HTMLFormElement;
  const input = document.getElementById('chatInput') as HTMLInputElement;

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      input.value = '';
      sendUserMessageToLunaria(text);
    }
  });

  document.querySelectorAll('#chatQuickChips .chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const question = target.getAttribute('data-question');
      if (question) sendUserMessageToLunaria(question);
    });
  });

  document.getElementById('floatingLunariaBtn')?.addEventListener('click', openChatDrawer);
  document.getElementById('openLunariaNavBtn')?.addEventListener('click', openChatDrawer);
  document.getElementById('heroLunariaTrigger')?.addEventListener('click', openChatDrawer);
  document.getElementById('bannerOpenLunariaBtn')?.addEventListener('click', openChatDrawer);
  document.getElementById('footerLunariaBtn')?.addEventListener('click', openChatDrawer);
  document.getElementById('closeChatBtn')?.addEventListener('click', closeChatDrawer);
}

/* ==========================================================================
   7. NAVIGATION & TAB SWITCHERS
   ========================================================================== */
function setupNavigationAndModes() {
  // Mobile Hamburger menu toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      const isVisible = mobileMenu.style.display === 'flex';
      mobileMenu.style.display = isVisible ? 'none' : 'flex';
    });

    document.querySelectorAll('.mobile-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.style.display = 'none';
      });
    });
  }

  // Catalog Mode Switcher: Profiles vs Full Accounts vs Combos
  const tabProfiles = document.getElementById('tabProfilesBtn');
  const tabFull = document.getElementById('tabFullAccountsBtn');
  const tabCombos = document.getElementById('tabCombosBtn');

  const setMode = (mode: 'profiles' | 'full' | 'combos') => {
    currentCatalogMode = mode;
    [tabProfiles, tabFull, tabCombos].forEach((t) => t?.classList.remove('active'));
    if (mode === 'profiles') tabProfiles?.classList.add('active');
    if (mode === 'full') tabFull?.classList.add('active');
    if (mode === 'combos') tabCombos?.classList.add('active');
    renderActiveCatalog();
  };

  tabProfiles?.addEventListener('click', () => setMode('profiles'));
  tabFull?.addEventListener('click', () => setMode('full'));
  tabCombos?.addEventListener('click', () => setMode('combos'));

  document.getElementById('heroGoProfilesBtn')?.addEventListener('click', () => {
    setMode('profiles');
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('heroGoFullBtn')?.addEventListener('click', () => {
    setMode('full');
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Category Filter Pills
  document.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      if (!target.parentElement?.id.includes('categoryFilterContainer')) return;
      document.querySelectorAll('#categoryFilterContainer .filter-pill').forEach((p) => p.classList.remove('active'));
      target.classList.add('active');
      currentCategoryFilter = target.getAttribute('data-category') || 'all';
      renderActiveCatalog();
    });
  });
}

function renderFAQs() {
  const container = document.getElementById('faqContainer');
  if (!container) return;

  container.innerHTML = FAQS.map((faq, index) => {
    return `
      <div style="background: #ffffff; border: 1px solid var(--color-rose-border); border-radius: 18px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        <button class="faq-question-btn" data-faq-index="${index}" style="width: 100%; text-align: left; padding: 18px 24px; background: transparent; border: none; font-size: 1.05rem; font-weight: 700; color: var(--color-text-title); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s;">
          <span>${faq.question}</span>
          <span class="faq-icon" style="font-size: 1.25rem; color: var(--color-rose-primary); transition: transform 0.3s;">+</span>
        </button>
        <div class="faq-answer-content" id="faq-answer-${index}" style="display: none; padding: 0 24px 20px; font-size: 0.94rem; color: var(--color-text-body); line-height: 1.65; border-top: 1px solid #fbf2f3;">
          ${faq.answer}
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.faq-question-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const index = target.getAttribute('data-faq-index');
      if (!index) return;
      const answer = document.getElementById(`faq-answer-${index}`);
      const icon = target.querySelector('.faq-icon') as HTMLElement;
      if (!answer) return;

      const isHidden = answer.style.display === 'none';
      answer.style.display = isHidden ? 'block' : 'none';
      if (icon) {
        icon.textContent = isHidden ? '−' : '+';
        icon.style.transform = isHidden ? 'rotate(180deg)' : 'none';
      }
    });
  });
}

/* ==========================================================================
   8. APPLICATION BOOTSTRAP
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    new DigitalStreaming3DShowcase('heroCanvas');
  } catch (err) {
    console.warn('3D Showcase initialization fallback:', err);
  }

  // 1. Check user login session
  await checkAuthStatus();

  // 2. Fetch live catalog and promos from database
  await fetchCatalogFromDatabase();

  // 3. Render FAQs
  renderFAQs();

  // 4. Setup forms and modal events
  setupAuthForms();
  setupAdminTabs();
  setupLunariaChat();
  setupNavigationAndModes();
});
