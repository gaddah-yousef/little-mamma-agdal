/**
 * uiManager.js
 * ---------------------------------------------------------------------------
 * Construit la carte à partir de menu.json, gère le panier persistant
 * (localStorage), la validation du formulaire et la génération du lien
 * WhatsApp formaté pour Little Mamma Agdal.
 */

const STORAGE_KEY = 'little-mamma:cart:v1';
const MENU_URL = 'assets/menu.json';

const fmtPrice = (n) => `${Number(n).toFixed(0)} DH`;

export class UIManager {
    constructor() {
        this.menu = null;
        this.cart = this._loadCart();
        this.activeCategory = null;

        this.els = {
            tabs: document.getElementById('menu-tabs'),
            sections: document.getElementById('menu-sections'),
            cartPanel: document.getElementById('cart-panel'),
            cartList: document.getElementById('cart-list'),
            cartCount: document.getElementById('cart-count'),
            cartTotal: document.getElementById('cart-total-amount'),
            openCart: document.getElementById('open-cart'),
            overlay: document.getElementById('cart-overlay'),
            form: document.getElementById('checkout-form'),
            formHint: document.getElementById('form-hint'),
            toast: document.getElementById('toast')
        };

        this._bindStaticEvents();
    }

    async init() {
        const res = await fetch(MENU_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`menu.json indisponible (${res.status})`);
        this.menu = await res.json();

        this.activeCategory = this.menu.categories[0]?.id || null;
        this._renderTabs();
        this._renderSections();
        this._renderCart();
        return this.menu;
    }

    _bindStaticEvents() {
        this.els.openCart.addEventListener('click', () => this.openCart());
        this.els.overlay.addEventListener('click', () => this.closeCart());

        document.querySelectorAll('[data-close]').forEach((btn) => {
            btn.addEventListener('click', () => this.closeCart());
        });

        this.els.form.addEventListener('submit', (e) => this._onCheckoutSubmit(e));

        // ESC ferme le panier.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeCart();
        });
    }

    openCart() {
        this.els.cartPanel.classList.add('is-open');
        this.els.overlay.classList.add('is-open');
        this.els.cartPanel.setAttribute('aria-hidden', 'false');
    }

    closeCart() {
        this.els.cartPanel.classList.remove('is-open');
        this.els.overlay.classList.remove('is-open');
        this.els.cartPanel.setAttribute('aria-hidden', 'true');
    }

    // ------------ MENU ------------

    setActiveCategory(catId) {
        this.activeCategory = catId;
        this._renderTabs();
        this._renderSections();
    }

    _renderTabs() {
        const wrap = this.els.tabs;
        wrap.innerHTML = '';
        this.menu.categories.forEach((cat) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'menu-tab' + (cat.id === this.activeCategory ? ' is-active' : '');
            btn.textContent = cat.label;
            btn.addEventListener('click', () => this.setActiveCategory(cat.id));
            wrap.appendChild(btn);
        });
    }

    _renderSections() {
        const wrap = this.els.sections;
        wrap.innerHTML = '';
        this.menu.categories.forEach((cat) => {
            const section = document.createElement('section');
            section.className = 'menu-section';
            if (cat.id !== this.activeCategory) section.classList.add('is-hidden');

            const head = document.createElement('header');
            head.className = 'menu-section__head';

            const title = document.createElement('h3');
            title.className = 'menu-section__title';
            title.textContent = cat.label;
            head.appendChild(title);

            if (cat.intro) {
                const intro = document.createElement('p');
                intro.className = 'menu-section__intro';
                intro.textContent = cat.intro;
                head.appendChild(intro);
            }
            section.appendChild(head);

            const grid = document.createElement('div');
            grid.className = 'dish-grid';

            cat.items.forEach((item) => grid.appendChild(this._buildDishCard(item)));
            section.appendChild(grid);
            wrap.appendChild(section);
        });
    }

    _buildDishCard(item) {
        const card = document.createElement('article');
        card.className = 'dish';

        const media = document.createElement('div');
        media.className = 'dish__media';

        const img = document.createElement('img');
        img.className = 'dish__img';
        img.loading = 'lazy';
        img.alt = item.name;
        img.src = item.image_url;
        img.onerror = () => {
            img.removeAttribute('src');
            media.style.background = 'linear-gradient(135deg, rgba(217,138,58,0.35), rgba(28,20,14,0.85))';
        };
        media.appendChild(img);

        const price = document.createElement('span');
        price.className = 'dish__price';
        price.textContent = fmtPrice(item.price);
        media.appendChild(price);

        card.appendChild(media);

        const body = document.createElement('div');
        body.className = 'dish__body';

        const name = document.createElement('h4');
        name.className = 'dish__name';
        name.textContent = item.name;
        body.appendChild(name);

        const desc = document.createElement('p');
        desc.className = 'dish__desc';
        desc.textContent = item.description;
        body.appendChild(desc);

        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'dish__add';
        add.textContent = 'Ajouter au panier';
        add.addEventListener('click', () => {
            this.addToCart(item);
            add.classList.add('is-added');
            add.textContent = 'Ajouté';
            this._bumpCart();
            this._toast(`${item.name} ajouté`);
            setTimeout(() => {
                add.classList.remove('is-added');
                add.textContent = 'Ajouter au panier';
            }, 1400);
        });
        body.appendChild(add);

        card.appendChild(body);
        return card;
    }

    // ------------ CART ------------

    _loadCart() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    _persistCart() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cart)); } catch {}
    }

    addToCart(item) {
        const ex = this.cart.find((c) => c.id === item.id);
        if (ex) ex.qty += 1;
        else this.cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
        this._persistCart();
        this._renderCart();
    }

    updateQty(id, delta) {
        const row = this.cart.find((c) => c.id === id);
        if (!row) return;
        row.qty += delta;
        if (row.qty <= 0) this.cart = this.cart.filter((c) => c.id !== id);
        this._persistCart();
        this._renderCart();
    }

    cartTotal() { return this.cart.reduce((s, r) => s + r.price * r.qty, 0); }
    cartCount() { return this.cart.reduce((s, r) => s + r.qty, 0); }

    _renderCart() {
        const list = this.els.cartList;
        list.innerHTML = '';

        if (!this.cart.length) {
            const empty = document.createElement('p');
            empty.className = 'cart-empty';
            empty.textContent = 'Votre commande est vide';
            list.appendChild(empty);
        } else {
            this.cart.forEach((row) => {
                const r = document.createElement('div');
                r.className = 'cart-row';

                const info = document.createElement('div');
                const name = document.createElement('div');
                name.className = 'cart-row__name';
                name.textContent = row.name;
                const line = document.createElement('div');
                line.className = 'cart-row__line';
                line.textContent = `${fmtPrice(row.price)} l'unité`;
                info.appendChild(name); info.appendChild(line);
                r.appendChild(info);

                const qty = document.createElement('div');
                qty.className = 'qty';
                const minus = document.createElement('button');
                minus.type = 'button'; minus.textContent = '−';
                minus.addEventListener('click', () => this.updateQty(row.id, -1));
                const val = document.createElement('span'); val.textContent = row.qty;
                const plus = document.createElement('button');
                plus.type = 'button'; plus.textContent = '+';
                plus.addEventListener('click', () => this.updateQty(row.id, +1));
                qty.appendChild(minus); qty.appendChild(val); qty.appendChild(plus);
                r.appendChild(qty);

                const sum = document.createElement('div');
                sum.className = 'cart-row__sum';
                sum.textContent = fmtPrice(row.price * row.qty);
                r.appendChild(sum);

                list.appendChild(r);
            });
        }

        this.els.cartTotal.textContent = this.cartTotal().toFixed(0);
        this.els.cartCount.textContent = this.cartCount();
    }

    _bumpCart() {
        const el = this.els.cartCount;
        el.classList.remove('is-bump');
        void el.offsetWidth;
        el.classList.add('is-bump');
    }

    _toast(msg) {
        const t = this.els.toast;
        t.textContent = msg;
        t.classList.add('is-visible');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2200);
    }

    // ------------ CHECKOUT ------------

    _onCheckoutSubmit(e) {
        e.preventDefault();
        const form = this.els.form;
        const hint = this.els.formHint;
        hint.className = 'form-hint';

        if (!this.cart.length) {
            hint.classList.add('is-error');
            hint.textContent = 'Ajoutez au moins un plat avant de valider.';
            return;
        }
        if (!form.checkValidity()) {
            hint.classList.add('is-error');
            hint.textContent = 'Merci de compléter le formulaire correctement.';
            return;
        }

        const fd = new FormData(form);
        const url = this._buildWhatsAppLink({
            name: (fd.get('name') || '').toString().trim(),
            phone: (fd.get('phone') || '').toString().trim(),
            address: (fd.get('address') || '').toString().trim()
        });

        hint.classList.add('is-ok');
        hint.textContent = 'Redirection vers WhatsApp…';
        window.open(url, '_blank', 'noopener,noreferrer');

        // Réinitialisation post-commande : vide le panier, le localStorage,
        // les champs du formulaire et le compteur HUD.
        this.cart = [];
        this._persistCart();
        this._renderCart();
        this._bumpCart();
        form.reset();

        setTimeout(() => {
            hint.className = 'form-hint';
            hint.textContent = '';
            this.closeCart();
        }, 1800);
    }

    _buildWhatsAppLink({ name, phone, address }) {
        const r = this.menu.restaurant;
        const lines = [];
        lines.push(`*Nouvelle commande — ${r.name}*`);
        lines.push('');
        lines.push(`Client : ${name}`);
        lines.push(`Téléphone : ${phone}`);
        lines.push(`Livraison : ${address}`);
        lines.push('');
        lines.push('— Détail —');
        this.cart.forEach((row) => {
            lines.push(`• ${row.qty} × ${row.name} — ${fmtPrice(row.price * row.qty)}`);
        });
        lines.push('');
        lines.push(`Total : ${fmtPrice(this.cartTotal())}`);

        const text = encodeURIComponent(lines.join('\n'));
        const target = (r.whatsapp || '').replace(/\D+/g, '');
        return `https://wa.me/${target}?text=${text}`;
    }
}
